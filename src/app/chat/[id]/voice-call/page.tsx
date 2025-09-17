
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mic, MicOff, PhoneOff, Video, VideoOff, RefreshCw } from "lucide-react";
import { useState, useEffect, use, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Profile } from "@/lib/data";


export default function VoiceCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchOtherUser = async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', params.id).single();
        if (error || !data) {
            toast({ variant: 'destructive', title: 'User not found' });
            router.push('/chat');
        } else {
            setOtherUser(data);
        }
    };
    fetchOtherUser();
  }, [params.id, supabase, toast, router]);
  
   const startStream = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode },
        audio: true
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      stream.getVideoTracks().forEach(track => track.enabled = isCameraOn);

      // In a real app, this is where you'd use a WebRTC library (like PeerJS or simple-peer)
      // to connect to the other user and exchange streams.
      // For this prototype, we'll just show the remote user's avatar.
      if (remoteVideoRef.current) {
        // remoteVideoRef.current.srcObject = remoteStream;
      }

    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasPermission(false);
      toast({
        variant: 'destructive',
        title: 'Hardware Access Denied',
        description: 'Please enable camera and microphone permissions in your browser settings.',
      });
    }
  }, [facingMode, isMuted, isCameraOn, toast]);

  useEffect(() => {
    startStream();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startStream]);


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

  const handleEndCall = () => {
    // In a real app, you'd signal the end of the call to the other user.
    // For now, just go back to chat.
    router.push(`/chat/${params.id}`);
  };
  

  return (
      <div className="flex h-dvh flex-col bg-gray-900 text-white">
        
        {/* Remote user's video (or avatar) */}
        <main className="flex-1 relative">
            <video ref={remoteVideoRef} className="w-full h-full object-cover bg-black" autoPlay playsInline />
            
            {/* Fallback avatar if remote video is not available */}
            <div className="absolute inset-0 flex items-center justify-center">
                 {otherUser && (
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-32 w-32 border-4 border-white/50">
                            <AvatarImage src={otherUser.avatar_url} alt={otherUser.username} />
                            <AvatarFallback>{otherUser.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="mt-4 text-xl font-bold">{otherUser.full_name}</p>
                        <p className="text-sm text-muted-foreground">In call...</p>
                    </div>
                )}
            </div>

            {/* Local user's video preview */}
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
