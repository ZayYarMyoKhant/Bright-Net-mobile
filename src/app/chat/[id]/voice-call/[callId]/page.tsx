
"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mic, MicOff, PhoneOff, Video, VideoOff, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect, use, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Profile } from "@/lib/data";
import Peer from 'simple-peer';
import { User } from "@supabase/supabase-js";

export default function VoiceCallPage({ params: paramsPromise }: { params: Promise<{ id: string, callId: string }> }) {
  const params = use(paramsPromise);
  const otherUserId = params.id;
  const callId = params.callId;
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const callSubscriptionRef = useRef<any>(null);

  const handleEndCall = useCallback(async () => {
    if (callSubscriptionRef.current) {
        supabase.removeChannel(callSubscriptionRef.current);
        callSubscriptionRef.current = null;
    }
    if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    // The call record will be deleted from the active calls table, 
    // which triggers the logging function on the backend.
    if (callId) {
        await supabase.from('video_calls').delete().eq('id', callId);
    }
    if (otherUserId) {
       router.push(`/chat/${otherUserId}`);
    }
  }, [callId, supabase, router, otherUserId]);


  const setupPeer = useCallback((stream: MediaStream, isInitiator: boolean) => {
    if (peerRef.current || !callId) return;

    const peer = new Peer({
        initiator: isInitiator,
        trickle: false,
        stream: stream,
    });

    peer.on('signal', async (data) => {
        const signalColumn = isInitiator ? 'caller_signal' : 'callee_signal';
        const { error } = await supabase.from('video_calls').update({ [signalColumn]: JSON.stringify(data) }).eq('id', callId);
        if (error) console.error("Signal update error:", error);
    });

    peer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    });
    
    peer.on('close', () => handleEndCall());
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      toast({variant: 'destructive', title: 'Connection Error'});
      handleEndCall();
    });

    peerRef.current = peer;
  }, [supabase, handleEndCall, toast, callId]);
  
  const startStream = useCallback(async (currentFacingMode: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode },
        audio: true
      });
      streamRef.current = stream;
      setHasPermission(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      stream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
      
      if (peerRef.current) {
         const oldVideoTrack = peerRef.current.streams[0]?.getVideoTracks()[0];
         const newVideoTrack = stream.getVideoTracks()[0];
         if(oldVideoTrack && newVideoTrack) {
            peerRef.current.replaceTrack(oldVideoTrack, newVideoTrack, peerRef.current.streams[0]);
         }
      }
      return stream;

    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasPermission(false);
      toast({
        variant: 'destructive',
        title: 'Hardware Access Denied',
        description: 'Please enable camera and microphone permissions.',
      });
      return null;
    }
  }, [isMuted, isCameraOn, toast]);


  useEffect(() => {
    let isMounted = true;

    const initCall = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) { router.push('/signup'); return; }
        setCurrentUser(user);

        const { data: otherUserData } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
        if (!otherUserData || !isMounted) { router.push('/chat'); return; }
        setOtherUser(otherUserData);

        const { data: callData, error: callError } = await supabase.from('video_calls')
          .select('*')
          .eq('id', callId)
          .single();

        if (callError || !callData || !isMounted) {
            toast({variant: 'destructive', title: 'Active call not found'});
            router.push(`/chat/${otherUserId}`);
            return;
        }

        const isInitiator = callData.caller_id === user.id;

        const localStream = await startStream(facingMode);
        if (!localStream || !isMounted) return;

        setupPeer(localStream, isInitiator);
        
        callSubscriptionRef.current = supabase.channel(`webrtc-signaling-${callId}`)
            .on('postgres_changes', {
                event: '*', // Listen for both UPDATE and DELETE
                schema: 'public',
                table: 'video_calls',
                filter: `id=eq.${callId}`
            }, (payload) => {
                if (!isMounted || (peerRef.current && peerRef.current.destroyed)) return;

                if (payload.eventType === 'DELETE') {
                    handleEndCall();
                    return;
                }

                if (payload.eventType === 'UPDATE') {
                    const { caller_signal, callee_signal } = payload.new;
                    const signalData = isInitiator ? callee_signal : caller_signal;
                    
                    if (signalData && !peerRef.current.destroyed) {
                        try {
                            const parsedSignal = typeof signalData === 'string' ? JSON.parse(signalData) : signalData;
                            if (parsedSignal.type === 'answer' || parsedSignal.type === 'offer') {
                                peerRef.current.signal(parsedSignal);
                            }
                        } catch (e) {
                            console.error("Signal error:", e);
                        }
                    }
                }
            }).subscribe();
    };

    initCall();
    
    return () => {
        isMounted = false;
        handleEndCall();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId, callId]);


  const handleFlipCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    await startStream(newFacingMode);
  };

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

  if (!otherUser) {
      return (
          <div className="flex h-dvh w-full items-center justify-center bg-gray-900 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      );
  }

  return (
    <div className="flex h-dvh flex-col bg-gray-900 text-white">
      <main className="flex-1 relative">
        <video ref={remoteVideoRef} className="w-full h-full object-cover bg-black" autoPlay playsInline />
        
        {(!remoteVideoRef.current?.srcObject || remoteVideoRef.current?.paused) && (
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 border-4 border-white/50" profile={otherUser}>
                </Avatar>
                <p className="mt-4 text-xl font-bold">{otherUser.full_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                </p>
              </div>
            </div>
        )}

        <div className="absolute top-4 right-4 h-48 w-32 rounded-lg overflow-hidden bg-black border-2 border-gray-600 z-10">
          <video ref={localVideoRef} className={cn("w-full h-full object-cover", !isCameraOn && "hidden")} autoPlay muted playsInline />
          {!isCameraOn && (
            <div className="flex flex-col items-center justify-center h-full">
              <VideoOff className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-2 text-center text-xs">
              <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
              <p>Permission denied.</p>
            </div>
          )}
        </div>
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
          <Button variant="destructive" size="icon" className="h-14 w-14 rounded-full" onClick={() => handleEndCall()}>
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
