
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

export default function VoiceCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const callSubscriptionRef = useRef<any>(null);

  const handleEndCall = useCallback(async (shouldUpdateDb = true) => {
    console.log('Ending call. Should update DB:', shouldUpdateDb);
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
    if (shouldUpdateDb && callId) {
        await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId);
    }
    if (params.id) {
       router.push(`/chat/${params.id}`);
    }
  }, [callId, supabase, router, params.id]);


  const setupPeer = useCallback((stream: MediaStream, isInitiator: boolean, currentCallId: string, user: User) => {
    if (peerRef.current) return; // Avoid re-creating peer

    const peer = new Peer({
        initiator: isInitiator,
        trickle: false, // Simplifies signaling
        stream: stream,
    });

    peer.on('signal', async (data) => {
        const signalColumn = isInitiator ? 'caller_signal' : 'callee_signal';
        const { error } = await supabase.from('video_calls').update({ [signalColumn]: JSON.stringify(data) }).eq('id', currentCallId);
        if (error) console.error("Signal update error:", error);
    });

    peer.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    });
    
    peer.on('close', () => handleEndCall(false));
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      toast({variant: 'destructive', title: 'Connection Error'});
      handleEndCall(true);
    });

    peerRef.current = peer;
  }, [supabase, handleEndCall, toast]);
  
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
      
      // If peer exists, replace tracks. This is for flipping camera.
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
        if (!user) { router.push('/signup'); return; }
        if (!isMounted) return;
        setCurrentUser(user);

        const { data: otherUserData } = await supabase.from('profiles').select('*').eq('id', params.id).single();
        if (!otherUserData || !isMounted) { router.push('/chat'); return; }
        setOtherUser(otherUserData);

        const { data: callData, error: callError } = await supabase.from('video_calls')
          .select('*')
          .or(`and(caller_id.eq.${user.id},callee_id.eq.${params.id}),and(caller_id.eq.${params.id},callee_id.eq.${user.id})`)
          .in('status', ['requesting', 'accepted'])
          .order('created_at', { ascending: false })
          .limit(1).single();

        if (callError || !callData) {
            toast({variant: 'destructive', title: 'Active call not found'});
            if(isMounted) router.push(`/chat/${params.id}`);
            return;
        }

        if (!isMounted) return;
        const currentCallId = callData.id;
        setCallId(currentCallId);
        const isInitiator = callData.caller_id === user.id;

        // If callee accepts, update status.
        if (!isInitiator && callData.status === 'requesting') {
            await supabase.from('video_calls').update({ status: 'accepted' }).eq('id', currentCallId);
        }

        const localStream = await startStream(facingMode);
        if (!localStream || !isMounted) return;

        setupPeer(localStream, isInitiator, currentCallId, user);
        
        callSubscriptionRef.current = supabase.channel(`webrtc-signaling-${currentCallId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'video_calls',
                filter: `id=eq.${currentCallId}`
            }, (payload) => {
                if (!isMounted || !peerRef.current || peerRef.current.destroyed) return;
                
                const { caller_signal, callee_signal, status } = payload.new;
                const signalData = isInitiator ? callee_signal : caller_signal;
                
                if (signalData && !peerRef.current.destroyed) {
                    try {
                        const parsedSignal = typeof signalData === 'string' ? JSON.parse(signalData) : signalData;
                        peerRef.current.signal(parsedSignal);
                    } catch (e) {
                        console.error("Signal error:", e);
                    }
                }
                
                if (status === 'ended' || status === 'declined' || status === 'cancelled') {
                    handleEndCall(false);
                }
            }).subscribe();
    };

    initCall();
    
    return () => {
        isMounted = false;
        handleEndCall(true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);


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
        
        {!remoteVideoRef.current?.srcObject && (
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
          <Button variant="destructive" size="icon" className="h-14 w-14 rounded-full" onClick={() => handleEndCall(true)}>
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
