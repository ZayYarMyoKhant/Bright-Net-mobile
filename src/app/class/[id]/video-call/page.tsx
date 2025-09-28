
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
            {participant.stream && participant.isCameraOn ? (
                <video ref={videoRef} className={cn("w-full h-full object-cover")} autoPlay muted={participant.isCurrentUser} playsInline />
            ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground bg-gray-800">
                     <Avatar className={cn("h-16 w-16 rounded-full")}>
                        <AvatarImage src={participant.avatar_url} alt={participant.username} className="object-cover" />
                        <AvatarFallback className="bg-gray-700">{participant.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-semibold mt-2">{participant.isCurrentUser ? "You" : participant.full_name}</p>
                    {!participant.stream && <div className="flex items-center gap-1 text-xs"><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</div>}
                    {!participant.isCameraOn && participant.stream && <div className="flex items-center gap-1 text-xs"><VideoOff className="h-4 w-4" /> Camera Off</div>}
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
  const peersRef = useRef<{[key: string]: {peer: Peer.Instance, user: Profile}}>({});
  const presenceRef = useRef<any>(null);

  const handleEndCall = useCallback(async () => {
    if (presenceRef.current) {
        presenceRef.current.untrack();
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
    }
    
    Object.values(peersRef.current).forEach(({peer}) => peer.destroy());
    peersRef.current = {};

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (classInfo && currentUser && currentUser.id === classInfo.creator_id) {
        await supabase.from('classes').update({ is_video_call_active: false }).eq('id', classInfo.id);
    }
    
    if (params.id) router.push(`/class/${params.id}`);

  }, [classInfo, currentUser, params.id, router, supabase]);
  

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
      
      setParticipants(prev => prev.map(p => p.isCurrentUser ? {...p, stream: newStream, isCameraOn: isCameraOn, isMuted: isMuted} : p));

      // For existing peers, replace the track
      Object.values(peersRef.current).forEach(({ peer }) => {
        const oldTrack = peer.streams[0].getVideoTracks()[0];
        const newTrack = newStream.getVideoTracks()[0];
        if (oldTrack && newTrack) {
          peer.replaceTrack(oldTrack, newTrack, peer.streams[0]);
        }
      });


      return newStream;
    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Hardware Access Denied', description: 'Please enable camera and microphone permissions.' });
      return null;
    }
  }, [facingMode, isMuted, isCameraOn, toast]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/signup');
            return;
        }
        setCurrentUser(user);

        const { data: classData, error: classError } = await supabase.from('classes').select('id, name, creator_id').eq('id', params.id).single();
        if (classError) {
            toast({ variant: 'destructive', title: 'Error', description: "Could not load class details." });
            router.push('/class');
            return;
        }
        setClassInfo(classData);

        const localStream = await startStream();
        if (!localStream) {
            setLoading(false);
            return;
        }

        const {data: myProfile} = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (myProfile) {
            setParticipants([{
                ...myProfile,
                isCurrentUser: true,
                stream: localStream,
                isCameraOn: isCameraOn,
                isMuted: isMuted,
            }]);
        }
        
        setLoading(false);
        
        presenceRef.current = supabase.channel(`class-call-presence-${params.id}`);

        presenceRef.current.on('presence', { event: 'sync' }, () => {
            if (!isMounted) return;
            const newState = presenceRef.current.presenceState();
            const otherUsers = Object.keys(newState).map(id => newState[id][0].user_profile).filter(p => p.id !== user.id);
            
            otherUsers.forEach((otherUser: Profile) => {
                if (!peersRef.current[otherUser.id] && localStream) {
                    const peer = new Peer({ initiator: true, trickle: false, stream: localStream });
                    
                    peer.on('signal', signal => {
                        presenceRef.current.send({
                            type: 'broadcast',
                            event: 'signal-offer',
                            payload: { from: user.id, signal }
                        });
                    });

                    peersRef.current[otherUser.id] = { peer, user: otherUser };
                    setParticipants(prev => {
                        if (!prev.find(p => p.id === otherUser.id)) {
                           return [...prev, {...otherUser, isCameraOn: true, isMuted: true}];
                        }
                        return prev;
                    });
                }
            });
        });

        presenceRef.current.on('presence', { event: 'leave' }, ({ leftPresences }: {leftPresences: any[]}) => {
             if (!isMounted) return;
             leftPresences.forEach(presence => {
                const leftUserId = presence.user_profile.id;
                if (peersRef.current[leftUserId]) {
                    peersRef.current[leftUserId].peer.destroy();
                    delete peersRef.current[leftUserId];
                }
                setParticipants(prev => prev.filter(p => p.id !== leftUserId));
            });
        });
        
        presenceRef.current.on('broadcast', { event: 'signal-offer' }, ({ payload }: {payload: any}) => {
            if (!isMounted || payload.from === user.id || peersRef.current[payload.from] || !localStream) return;
            
            const peer = new Peer({ initiator: false, trickle: false, stream: localStream });
            
            peer.on('signal', signal => {
                presenceRef.current.send({
                    type: 'broadcast',
                    event: 'signal-answer',
                    payload: { to: payload.from, from: user.id, signal }
                });
            });
            
            peer.on('stream', (remoteStream) => {
                 setParticipants(prev => prev.map(p => p.id === payload.from ? {...p, stream: remoteStream, isCameraOn: true} : p));
            });

            peer.on('close', () => {
                delete peersRef.current[payload.from];
                setParticipants(prev => prev.filter(p => p.id !== payload.from));
            });
            
            peer.signal(payload.signal);
            const fromUser = presenceRef.current.presenceState()[payload.from][0].user_profile;
            peersRef.current[payload.from] = { peer, user: fromUser };
             setParticipants(prev => {
                if (!prev.find(p => p.id === fromUser.id)) {
                    return [...prev, {...fromUser, isCameraOn: true, isMuted: true}];
                }
                return prev;
            });
        });

        presenceRef.current.on('broadcast', { event: 'signal-answer' }, ({ payload }: {payload: any}) => {
            if (!isMounted || payload.to !== user.id || !peersRef.current[payload.from]) return;

            peersRef.current[payload.from].peer.on('stream', (remoteStream) => {
                setParticipants(prev => prev.map(p => p.id === payload.from ? {...p, stream: remoteStream, isCameraOn: true} : p));
            });
            peersRef.current[payload.from].peer.signal(payload.signal);
        });

        presenceRef.current.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await presenceRef.current.track({ user_profile: myProfile });
          }
        });

    };

    init();

    return () => {
        isMounted = false;
        if (presenceRef.current) {
            presenceRef.current.untrack();
            supabase.removeChannel(presenceRef.current);
        }
        Object.values(peersRef.current).forEach(({ peer }) => peer.destroy());
        peersRef.current = {};
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, [params.id, router, supabase, startStream]);


  useEffect(() => {
    startStream();
  }, [startStream, facingMode]);


  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !newMutedState);
    }
    setParticipants(prev => prev.map(p => p.isCurrentUser ? {...p, isMuted: newMutedState} : p));
  };
  
  const handleToggleCamera = () => {
    const newCameraState = !isCameraOn;
    setIsCameraOn(newCameraState);
     if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = newCameraState);
    }
     setParticipants(prev => prev.map(p => p.isCurrentUser ? {...p, isCameraOn: newCameraState} : p));
  };
  
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
                {participants.map((participant) => (
                    <ParticipantVideo key={participant.id} participant={participant} />
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
