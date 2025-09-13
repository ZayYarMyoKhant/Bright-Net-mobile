
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, use, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


export default function VoiceCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // In a real app, you would fetch user data based on params.id
  const user = {
    id: params.id,
    name: "Su Su",
    avatar: "https://i.pravatar.cc/150?u=susu",
  };
  
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

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      // Mute/unmute the local audio track based on state
      newStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      // Turn camera on/off based on state
      newStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);

    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Hardware Access Denied',
        description: 'Please enable camera and microphone permissions in your browser settings.',
      });
    }
  }, [facingMode, isMuted, isCameraOn, toast]);

  useEffect(() => {
    startStream();
    
    // Cleanup on component unmount
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
  

  return (
      <div className="flex h-dvh flex-col bg-gray-900 text-white">
        <header className="flex h-16 flex-shrink-0 items-center justify-between px-4 z-20">
          <div className="flex items-center gap-3">
             <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                <AvatarFallback className="rounded-md">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="font-bold">{user.name}</p>
          </div>
        </header>

        <main className="flex-1 relative">
             {/* Remote user's video */}
             <div className="absolute inset-0">
                <Image src={user.avatar} alt={user.name} layout="fill" objectFit="cover" className="blur-md opacity-50" data-ai-hint="person portrait" />
                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Avatar className="h-32 w-32 border-4 border-white">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                 </div>
            </div>
            {/* Local user's video */}
            <div className="absolute top-4 right-4 h-48 w-32 rounded-lg overflow-hidden bg-black border-2 border-gray-600">
                <video ref={videoRef} className={cn("w-full h-full object-cover", !isCameraOn && "hidden")} autoPlay muted playsInline />
                {!isCameraOn && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <VideoOff className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}
                 {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-2 text-center text-xs">
                        <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
                        <p>Camera access denied.</p>
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
                 <Link href={`/chat/${user.id}`} className="flex flex-col items-center gap-2">
                    <Button variant="destructive" size="icon" className="h-14 w-14 rounded-full">
                        <PhoneOff className="h-7 w-7" />
                    </Button>
                </Link>
            </div>
          </footer>
      </div>
    );
}

    