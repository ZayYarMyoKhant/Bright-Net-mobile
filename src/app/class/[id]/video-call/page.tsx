
"use client";

import { Avatar } from "@/components/ui/avatar";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type Participant = Profile & {
    isCurrentUser?: boolean;
    isMuted?: boolean;
    isCameraOn?: boolean;
    stream?: MediaStream;
};

const ParticipantVideo = ({ participant, isMainView }: { participant: Participant, isMainView: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);

    return (
        <div className={cn(
            "relative rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center",
             isMainView ? "w-full h-full" : "aspect-square h-32 flex-shrink-0"
        )}>
            {participant.stream && participant.isCameraOn ? (
                <video ref={videoRef} className={cn("w-full h-full object-cover")} autoPlay muted={participant.isCurrentUser} playsInline />
            ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground bg-gray-800">
                     <Avatar className={cn(isMainView ? "h-24 w-24" : "h-12 w-12")} profile={participant} />
                    <p className={cn("text-sm font-semibold mt-2", isMainView ? "text-base" : "text-xs")}>{participant.isCurrentUser ? "You" : participant.full_name}</p>
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
  const peersRef = useRef<{[key: string]: Peer.Instance}>({});
  const presenceChannelRef = useRef<any>(null);

  const cleanupCall = useCallback(() => {
    if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
    }
    
    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    peersRef.current = {};

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [supabase]);

  const handleEndCall = useCallback(async () => {
    if (classInfo && currentUser && currentUser.id === classInfo.creator_id) {
        await supabase.from('classes').update({ is_video_call_active: false }).eq('id', classInfo.id);
    }
    cleanupCall();
    if (params.id) router.push(`/class/${params.id}`);
  }, [classInfo, currentUser, params.id, router, supabase, cleanupCall]);

  const startStream = useCallback(async (currentFacingMode: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: currentFacingMode },
        audio: true
      });

      streamRef.current = newStream;
      setHasCameraPermission(true);
      
      newStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      newStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
      
      setParticipants(prev => prev.map(p => p.isCurrentUser ? {...p, stream: newStream, isCameraOn: isCameraOn, isMuted: isMuted} : p));

      Object.values(peersRef.current).forEach((peer) => {
        const oldStream = peer.streams[0];
        if (oldStream) {
            const oldAudioTrack = oldStream.getAudioTracks()[0];
            const newAudioTrack = newStream.getAudioTracks()[0];
             if (oldAudioTrack && newAudioTrack) peer.replaceTrack(oldAudioTrack, newAudioTrack, oldStream);

            const oldVideoTrack = oldStream.getVideoTracks()[0];
            const newVideoTrack = newStream.getVideoTracks()[0];
             if (oldVideoTrack && newVideoTrack) peer.replaceTrack(oldVideoTrack, newVideoTrack, oldStream);
        } else {
             peer.addStream(newStream);
        }
      });

      return newStream;
    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Hardware Access Denied', description: 'Please enable camera and microphone permissions.' });
      return null;
    }
  }, [isMuted, isCameraOn, toast]);

    const createPeer = useCallback((otherUserId: string, otherUserProfile: Profile, initiator: boolean) => {
        if (!streamRef.current || !currentUser) return null;
        
        const peer = new Peer({
            initiator: initiator,
            trickle: false,
            stream: streamRef.current,
        });

        peer.on('signal', (signal) => {
            presenceChannelRef.current?.send({
                type: 'broadcast',
                event: 'signal',
                payload: { from: currentUser.id, to: otherUserId, signal },
            });
        });

        peer.on('stream', (remoteStream: MediaStream) => {
            setParticipants(prev => {
                const userExists = prev.some(p => p.id === otherUserId);
                if (userExists) {
                    return prev.map(p => p.id === otherUserId ? { ...p, stream: remoteStream } : p);
                } else {
                    return [...prev, { ...otherUserProfile, stream: remoteStream, isCameraOn: true, isMuted: false }];
                }
            });
        });
        
        peer.on('close', () => {
             if (peersRef.current[otherUserId]) {
                delete peersRef.current[otherUserId];
             }
             setParticipants(prev => prev.filter(p => p.id !== otherUserId));
        });

        peer.on('error', (err) => {
            console.error(`Peer error with ${otherUserId}:`, err);
            // Optionally attempt to reconnect or just clean up
            if (peersRef.current[otherUserId]) {
                peersRef.current[otherUserId].destroy();
                delete peersRef.current[otherUserId];
            }
            setParticipants(prev => prev.filter(p => p.id !== otherUserId));
        });
        
        peersRef.current[otherUserId] = peer;
        return peer;

    }, [currentUser]);


  useEffect(() => {
    let isMounted = true;
    const init = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/signup'); return; }
        if (!isMounted) return;
        setCurrentUser(user);

        const { data: classData, error: classError } = await supabase.from('classes').select('id, name, creator_id').eq('id', params.id).single();
        if (classError) {
            toast({ variant: 'destructive', title: 'Error', description: "Could not load class details." });
            router.push('/class'); return;
        }
        if (!isMounted) return;
        setClassInfo(classData);

        const localStream = await startStream(facingMode);
        if (!localStream || !isMounted) { setLoading(false); return; }

        const {data: myProfile} = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (!myProfile || !isMounted) { setLoading(false); return; }

        setParticipants([{ ...myProfile, isCurrentUser: true, stream: localStream, isCameraOn: isCameraOn, isMuted: isMuted }]);
        setLoading(false);
        
        presenceChannelRef.current = supabase.channel(`class-call-${params.id}`);

        presenceChannelRef.current
        .on('presence', { event: 'sync' }, () => {
            if (!isMounted || !streamRef.current || !currentUser) return;
            const state = presenceChannelRef.current.presenceState();
            for (const id in state) {
                if (id === user.id || peersRef.current[id]) continue;
                const otherUser = state[id][0].user_profile;
                const isInitiator = currentUser.id > otherUser.id; // Deterministic initiator
                createPeer(otherUser.id, otherUser, isInitiator);
            }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }: {leftPresences: any[]}) => {
             if (!isMounted) return;
             leftPresences.forEach(presence => {
                const leftUserId = presence.user_profile.id;
                if (peersRef.current[leftUserId]) {
                    peersRef.current[leftUserId].destroy();
                    delete peersRef.current[leftUserId];
                }
                setParticipants(prev => prev.filter(p => p.id !== leftUserId));
            });
        })
        .on('broadcast', { event: 'signal' }, ({ payload }: {payload: any}) => {
            if (!isMounted || payload.to !== user.id || !currentUser) return;
            
            const peer = peersRef.current[payload.from];
            if (peer) {
                peer.signal(payload.signal);
            } else {
                const fromUser = presenceChannelRef.current.presenceState()[payload.from]?.[0]?.user_profile;
                if (!fromUser) return;
                const isInitiator = currentUser.id > fromUser.id;
                const newPeer = createPeer(fromUser.id, fromUser, isInitiator);
                newPeer?.signal(payload.signal);
            }
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannelRef.current.track({ user_profile: myProfile });
          }
        });
    };

    init();

    return () => { isMounted = false; cleanupCall(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);


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
  
   const handleFlipCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    startStream(newFacingMode);
  };

  if (loading) {
      return (
          <div className="flex h-dvh w-full items-center justify-center bg-gray-900">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
      )
  }
  
  const creator = participants.find(p => p.id === classInfo?.creator_id);
  const otherParticipants = participants.filter(p => p.id !== classInfo?.creator_id);

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

        <main className="flex-1 flex flex-col min-h-0">
           <div className="flex-1 relative">
                {creator ? (
                    <ParticipantVideo participant={creator} isMainView={true} />
                ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-muted-foreground">
                        Creator has not joined yet.
                    </div>
                )}
           </div>

            {otherParticipants.length > 0 && (
                <ScrollArea className="flex-shrink-0 w-full bg-black/30">
                    <div className="flex gap-2 p-2">
                        {otherParticipants.map((participant) => (
                           <ParticipantVideo key={participant.id} participant={participant} isMainView={false} />
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            )}

           {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-sm rounded-lg bg-gray-800/80 m-2">
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
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={handleFlipCamera}>
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
