
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  const startStream = useCallback(async (isInitiator: boolean) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      });
      streamRef.current = stream;
      setHasPermission(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      stream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
      
      setupPeer(stream, isInitiator);

    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasPermission(false);
      toast({
        variant: 'destructive',
        title: 'Hardware Access Denied',
        description: 'Please enable camera and microphone permissions in your browser settings.',
      });
    }
  }, [facingMode, isMuted, isCameraOn, toast, callId, currentUser]);

  const setupPeer = (stream: MediaStream, isInitiator: boolean) => {
      if (!callId || !currentUser) return;

      const peer = new Peer({
          initiator: isInitiator,
          trickle: false,
          stream: stream,
      });

      peer.on('signal', (data) => {
          supabase.from('video_calls').update({ signal_data: JSON.stringify(data) }).eq('id', callId).then();
      });

      peer.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
          }
      });
      
      peer.on('close', handleEndCall);
      peer.on('error', (err) => {
        console.error('Peer error:', err);
        toast({variant: 'destructive', title: 'Connection Error'});
        handleEndCall();
      });

      peerRef.current = peer;
  }

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/signup');
            return;
        }
        setCurrentUser(user);

        const { data: otherUserData, error } = await supabase.from('profiles').select('*').eq('id', params.id).single();
        if (error || !otherUserData) {
            toast({ variant: 'destructive', title: 'User not found' });
            router.push('/chat');
            return;
        }
        setOtherUser(otherUserData);

        const { data: callData, error: callError } = await supabase.from('video_calls').select('*').or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`).eq('status', 'accepted').order('created_at', {ascending: false}).limit(1).single();

        if (callError || !callData) {
            toast({variant: 'destructive', title: 'Active call not found'});
            router.push(`/chat/${params.id}`);
            return;
        }
        
        setCallId(callData.id);
        const isInitiator = callData.caller_id === user.id;
        startStream(isInitiator);
    };
    init();
    
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerRef.current) {
            peerRef.current.destroy();
        }
    }
  }, [params.id, router, supabase, toast, startStream]);

  useEffect(() => {
    if (!callId) return;
    const channel = supabase.channel(`webrtc-signaling-${callId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'video_calls',
            filter: `id=eq.${callId}`
        }, (payload) => {
            const { signal_data, status } = payload.new;
            if (signal_data && peerRef.current && !peerRef.current.destroyed) {
                try {
                    const parsedSignal = JSON.parse(signal_data);
                    // Only signal if the data is not from ourselves
                    if ((parsedSignal.type === 'offer' && peerRef.current.initiator === false) || (parsedSignal.type === 'answer' && peerRef.current.initiator === true)) {
                        peerRef.current.signal(parsedSignal);
                    }
                } catch (e) {
                    console.error("Error parsing signal data:", e);
                }
            }
            if (status === 'ended' || status === 'declined' || status === 'cancelled') {
                handleEndCall();
            }
        }).subscribe();
        
     return () => {
         supabase.removeChannel(channel);
     }
  }, [callId, supabase]);


  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
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

  const handleEndCall = async () => {
    if (peerRef.current) {
        peerRef.current.destroy();
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if(callId) {
        await supabase.from('video_calls').update({ status: 'ended' }).eq('id', callId);
    }
    router.push(`/chat/${params.id}`);
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
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 border-4 border-white/50">
              <AvatarImage src={otherUser.avatar_url} alt={otherUser.username} />
              <AvatarFallback>{otherUser.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="mt-4 text-xl font-bold">{otherUser.full_name}</p>
            <p className="text-sm text-muted-foreground">In call...</p>
          </div>
        </div>
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
          <Button variant="destructive" size="icon" className="h-14 w-14 rounded-full" onClick={handleEndCall}>
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
