
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff, RefreshCw, Users, UserX } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


// Mock participant data
const initialParticipants = [
    { id: 'aungaung', name: 'Aung Aung', avatar: 'https://i.pravatar.cc/150?u=aungaung', isCurrentUser: true, isMuted: false, isCameraOn: true },
    { id: 'susu', name: 'Su Su', avatar: 'https://i.pravatar.cc/150?u=susu', isMuted: true, isCameraOn: true },
    { id: 'kyawkyaw', name: 'Kyaw Kyaw', avatar: 'https://i.pravatar.cc/150?u=kyawkyaw', isMuted: false, isCameraOn: false },
    { id: 'myomyint', name: 'Myo Myint', avatar: 'https://i.pravatar.cc/150?u=myomyint', isMuted: false, isCameraOn: true },
    { id: 'thuzar', name: 'Thuzar', avatar: 'https://i.pravatar.cc/150?u=thuzar', isMuted: true, isCameraOn: true },
];


const ParticipantVideo = ({ participant, isHost = false, isCurrentUser = false, stream, isCameraOn, isMuted: userIsMuted }: { participant?: any, isHost?: boolean, isCurrentUser?: boolean, stream?: MediaStream | null, isCameraOn?: boolean, isMuted?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const showVideo = isCurrentUser ? isCameraOn : participant?.isCameraOn;

    return (
        <div className={cn(
            "relative rounded-lg overflow-hidden bg-black/80 flex items-center justify-center", 
            isHost ? "col-span-full aspect-video" : "aspect-square"
        )}>
            {!participant && !isCurrentUser ? (
                 <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <UserX className="h-6 w-6" />
                    <p className="text-xs font-semibold">Not Joined</p>
                </div>
            ) : showVideo ? (
                isCurrentUser ? (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                ) : (
                    <Avatar className="h-full w-full rounded-none">
                        <AvatarImage src={participant.avatar} alt={participant.name} className="object-cover" data-ai-hint="person talking" />
                        <AvatarFallback className="rounded-none bg-gray-800">{participant.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )
            ) : (
                 <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <VideoOff className="h-6 w-6" />
                    <p className="text-xs font-semibold">Camera Off</p>
                </div>
            )}
            
            {(participant || isCurrentUser) && (
                <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex items-center gap-1.5 text-xs text-white font-medium truncate">
                        {(isCurrentUser ? userIsMuted : participant.isMuted) ? <MicOff className="h-3 w-3 flex-shrink-0" /> : <Mic className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{isCurrentUser ? "You (Host)" : participant?.name}</span>
                    </div>
                </div>
            )}
        </div>
    );
};


export default function ClassVideoCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const classInfo = {
    id: params.id,
    name: "Advanced Graphic Design",
  };
  
  const host = initialParticipants.find(p => p.isCurrentUser);
  const members = initialParticipants.filter(p => !p.isCurrentUser).slice(0, 10);
  const totalParticipants = 1 + members.length;
  
  const startStream = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: isCameraOn ? { facingMode: facingMode } : false,
        audio: true
      });

      streamRef.current = newStream;
      setHasCameraPermission(true);
      
      newStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      if (!isCameraOn) {
        newStream.getVideoTracks().forEach(track => track.stop());
      }

    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasCameraPermission(false);
    }
  }, [facingMode, isMuted, isCameraOn]);

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
      setIsCameraOn(prev => !prev);
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
                    <span>{totalParticipants} participants</span>
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-5 gap-2">
                {host && (
                     <div className="col-span-full row-span-2">
                         <ParticipantVideo 
                            participant={host} 
                            isHost 
                            isCurrentUser={true}
                            stream={streamRef.current}
                            isCameraOn={isCameraOn}
                            isMuted={isMuted}
                         />
                     </div>
                )}
                {Array.from({ length: 10 }).map((_, index) => (
                    <ParticipantVideo key={members[index]?.id || `empty-${index}`} participant={members[index]} />
                ))}
            </div>
             {hasCameraPermission === false && isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-2 text-center text-xs">
                    <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
                    <p>Camera access denied.</p>
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
