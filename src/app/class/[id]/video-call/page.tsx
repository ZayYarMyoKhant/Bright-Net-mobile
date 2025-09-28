
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff, RefreshCw, Users, Loader2 } from "lucide-react";
import { useState, useEffect, use, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/data";
import { useRouter } from "next/navigation";
import Peer from 'simple-peer';

type Participant = Profile & {
    isCurrentUser?: boolean;
    isMuted?: boolean;
    isCameraOn?: boolean;
    stream?: MediaStream;
    peer?: Peer.Instance;
};

const ParticipantVideo = ({ participant }: { participant: Participant }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);

    return (
        <div className="relative rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center aspect-video">
            <video ref={videoRef} className={cn("w-full h-full object-cover", !participant.isCameraOn && "hidden")} autoPlay muted={participant.isCurrentUser} playsInline />
            
            {!participant.isCameraOn && (
                 <div className="flex flex-col items-center gap-1 text-muted-foreground">
                     <Avatar className={cn("h-16 w-16 rounded-full", !participant.isCameraOn ? "flex" : "hidden")}>
                        <AvatarImage src={participant.avatar_url} alt={participant.username} className="object-cover" />
                        <AvatarFallback className="bg-gray-700">{participant.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <VideoOff className="h-6 w-6 mt-2" />
                    <p className="text-xs font-semibold">Camera Off</p>
                </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center gap-1.5 text-xs text-white font-medium truncate">
                    {participant.isMuted ? <MicOff className="h-3 w-3 flex-shrink-0" /> : <Mic className="h-3 w-3 flex-shrink-0" />}
                    <span className="truncate">{participant.isCurrentUser ? "You" : participant.full_name}</span>
                </div>
            </div>
        </div>
    );
};


export default function ClassVideoCallPage({ params: paramsPromise }: { params: Promise<{ id:string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [classInfo, setClassInfo] = useState<{id: string, name: string, creator_id: string} | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{[key: string]: Peer.Instance}>({});

  const startStream = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode },
        audio: true
      });

      streamRef.current = newStream;
      setHasCameraPermission(true);
      
      newStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      newStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
      
      setParticipants(prev => prev.map(p => p.isCurrentUser ? {...p, stream: newStream} : p));

      return newStream;
    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Hardware Access Denied', description: 'Please enable camera and microphone permissions.' });
      return null;
    }
  }, [facingMode, isMuted, isCameraOn, toast]);
  
  const fetchCallData = useCallback(async (user: User) => {
    setLoading(true);
    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name, creator_id')
        .eq('id', params.id)
        .single();
    
    if (classError) {
        toast({ variant: 'destructive', title: 'Error', description: "Could not load class details." });
        router.push('/class');
        return;
    }
    setClassInfo(classData);

    const { data: memberIds, error: memberError } = await supabase
        .from('class_members')
        .select('user_id')
        .eq('class_id', params.id);
        
    if (memberError) {
        toast({ variant: 'destructive', title: 'Error', description: "Could not load members." });
        setLoading(false);
        return;
    }
    
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds.map(m => m.user_id));

    if (profilesError) {
        toast({ variant: 'destructive', title: 'Error', description: "Could not load member profiles." });
        setLoading(false);
        return;
    }
    
    const localStream = await startStream();

    const allParticipants: Participant[] = profiles.map(p => ({
        ...p,
        isCurrentUser: p.id === user.id,
        isMuted: p.id === user.id ? isMuted : false,
        isCameraOn: p.id === user.id ? isCameraOn : false,
        stream: p.id === user.id ? localStream || undefined : undefined
    }));

    setParticipants(allParticipants);
    setLoading(false);
    return { participants: allParticipants, localStream };

  }, [params.id, supabase, toast, router, isMuted, isCameraOn, startStream]);


  useEffect(() => {
    let channel: any;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) {
            router.push('/signup');
            return;
        }
        setCurrentUser(user);
        const fetchedData = await fetchCallData(user);

        if (fetchedData && fetchedData.localStream) {
            const { participants: allParticipants, localStream } = fetchedData;
            const otherParticipants = allParticipants.filter(p => p.id !== user.id);

            otherParticipants.forEach(participant => {
                const peer = new Peer({
                    initiator: true,
                    trickle: false,
                    stream: localStream,
                });

                peer.on('signal', signal => {
                    channel.track({
                        event: 'signal',
                        payload: { to: participant.id, from: user.id, signal }
                    });
                });

                peersRef.current[participant.id] = peer;
            });

            channel = supabase.channel(`class-call-${params.id}`);
            channel.on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
            });
            channel.on('broadcast', { event: 'signal' }, ({ payload }: {payload: any}) => {
                if (payload.to === user.id) {
                    if (peersRef.current[payload.from]) {
                        peersRef.current[payload.from].signal(payload.signal);
                    } else {
                        const peer = new Peer({
                            initiator: false,
                            trickle: false,
                            stream: localStream
                        });
                        peer.on('signal', signal => {
                           channel.track({
                                event: 'signal',
                                payload: { to: payload.from, from: user.id, signal }
                           });
                        });
                        peer.signal(payload.signal);
                        peersRef.current[payload.from] = peer;
                    }
                }
            });

            Object.values(peersRef.current).forEach((peer, index) => {
                 const peerID = Object.keys(peersRef.current)[index];
                 peer.on('stream', stream => {
                    setParticipants(prev => prev.map(p => p.id === peerID ? {...p, stream: stream, isCameraOn: true} : p));
                 });
                 peer.on('close', () => {
                    setParticipants(prev => prev.filter(p => p.id !== peerID));
                    delete peersRef.current[peerID];
                 });
            });

            channel.subscribe(async (status: string) => {
              if (status === 'SUBSCRIBED') {
                await channel.track({ user: user.id, online_at: new Date().toISOString() });
              }
            });
        }
    });
    
    return () => {
        if(channel) supabase.removeChannel(channel);
        Object.values(peersRef.current).forEach(peer => peer.destroy());
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !newMutedState);
    }
  };
  
  const handleToggleCamera = () => {
    const newCameraState = !isCameraOn;
    setIsCameraOn(newCameraState);
     if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = newCameraState);
    }
  };
  
  const handleEndCall = async () => {
    if (!classInfo || !currentUser) return;
    if (currentUser.id === classInfo.creator_id) {
        await supabase.from('classes').update({ is_video_call_active: false }).eq('id', classInfo.id);
    }
    router.push(`/class/${classInfo.id}`);
  };

  const host = participants.find(p => p.isCurrentUser);
  const otherMembers = participants.filter(p => !p.isCurrentUser);
  
  if (loading) {
      return (
          <div className="flex h-dvh w-full items-center justify-center bg-gray-900">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
      )
  }

  return (
      <div className="flex h-dvh flex-col bg-gray-900 text-white">
        <header className="flex h-16 flex-shrink-0 items-center justify-between px-4 z-20">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleEndCall}>
                <ArrowLeft />
            </Button>
            <div>
                <p className="font-bold">{classInfo?.name}</p>
                <div className="flex items-center gap-1 text-xs text-green-400">
                    <Users className="h-3 w-3" />
                    <span>{participants.length} participants</span>
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {host && hasCameraPermission !== false && <ParticipantVideo participant={{...host, isMuted, isCameraOn, stream: streamRef.current || undefined }} />}
                {otherMembers.map((member) => (
                    <ParticipantVideo key={member.id} participant={member} />
                ))}
           </div>
           {hasCameraPermission === false && (
                <div className="flex flex-col items-center justify-center p-4 text-center text-sm rounded-lg bg-gray-800 m-2">
                    <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                    <p className="font-semibold">Camera and Mic Access Denied</p>
                    <p className="text-xs text-muted-foreground">Please enable permissions in your browser settings to participate.</p>
                </div>
           )}
        </main>
        
        <footer className="flex-shrink-0 p-6 z-20">
            <div className="flex items-center justify-around">
               <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={handleToggleMute}>
                    {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={handleToggleCamera}>
                    {isCameraOn ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')}>
                  <RefreshCw className="h-7 w-7" />
                </Button>
                 <Button variant="destructive" size="icon" className="h-14 w-14 rounded-full" onClick={handleEndCall}>
                    <PhoneOff className="h-7 w-7" />
                </Button>
            </div>
          </footer>
      </div>
    );
}
