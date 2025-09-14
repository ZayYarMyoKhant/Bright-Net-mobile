
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


// Mock participant data
const participants = [
    { id: 'aungaung', name: 'Aung Aung', avatar: 'https://i.pravatar.cc/150?u=aungaung', isHost: true },
    { id: 'susu', name: 'Su Su', avatar: 'https://i.pravatar.cc/150?u=susu' },
    { id: 'kyawkyaw', name: 'Kyaw Kyaw', avatar: 'https://i.pravatar.cc/150?u=kyawkyaw' },
    { id: 'myomyint', name: 'Myo Myint', avatar: 'https://i.pravatar.cc/150?u=myomyint' },
];

export default function ClassVideoCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const classInfo = {
    id: params.id,
    name: "Digital Marketing Masterclass",
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
      
      newStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
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
             <Link href={`/class/${classInfo.id}`}>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <ArrowLeft />
                </Button>
            </Link>
            <div>
                <p className="font-bold">{classInfo.name}</p>
                <div className="flex items-center gap-1 text-xs text-green-400">
                    <Users className="h-3 w-3" />
                    <span>{participants.length} participants</span>
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 relative grid grid-cols-2 grid-rows-2 gap-1 p-1">
            {/* Local User's Video */}
            <div className="relative rounded-lg overflow-hidden bg-black border-2 border-primary">
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
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md text-sm font-semibold">You</div>
            </div>

            {/* Remote Participants */}
            {participants.slice(0, 3).map(p => (
                <div key={p.id} className="relative rounded-lg overflow-hidden bg-black/80">
                     <Avatar className="h-full w-full rounded-none">
                        <AvatarImage src={p.avatar} alt={p.name} className="object-cover opacity-50 blur-sm" data-ai-hint="person talking" />
                        <AvatarFallback className="rounded-none bg-gray-800"></AvatarFallback>
                    </Avatar>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Avatar className="h-20 w-20 border-2">
                             <AvatarImage src={p.avatar} alt={p.name} data-ai-hint="person talking" />
                             <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-md text-sm font-semibold">{p.name}</div>
                     <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full">
                        <MicOff className="h-4 w-4" />
                    </div>
                </div>
            ))}
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
                 <Link href={`/class/${classInfo.id}`}>
                    <Button variant="destructive" size="icon" className="h-14 w-14 rounded-full">
                        <PhoneOff className="h-7 w-7" />
                    </Button>
                </Link>
            </div>
          </footer>
      </div>
    );
}
