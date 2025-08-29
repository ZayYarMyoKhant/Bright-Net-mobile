
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MicOff, PhoneOff, Volume2, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, use } from "react";
import { cn } from "@/lib/utils";

export default function VoiceCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [callStatus, setCallStatus] = useState("ringing"); // ringing, active
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // In a real app, you would fetch user data based on params.id
  const user = {
    id: params.id,
    name: "Su Su",
    avatar: "https://i.pravatar.cc/150?u=susu",
  };
  
  useEffect(() => {
    // Simulate call being answered after 3 seconds
    const timer = setTimeout(() => {
      setCallStatus("active");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);


  if (callStatus === 'active') {
    return (
      <div className="flex h-dvh flex-col bg-black text-white">
        <header className="flex h-16 flex-shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-3">
             <Avatar className="h-10 w-10 rounded-md">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                <AvatarFallback className="rounded-md">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="font-bold">{user.name}</p>
          </div>
        </header>

        <main className="flex-1 relative">
             <div className="absolute inset-0">
                <Image src="https://i.pravatar.cc/400?u=caller" alt="My Video Feed" layout="fill" objectFit="cover" className="rounded-lg" data-ai-hint="person video" />
            </div>
            <div className="absolute top-4 right-4 h-48 w-32">
                 <Image src={user.avatar} alt={user.name} layout="fill" objectFit="cover" className="rounded-lg" data-ai-hint="person portrait" />
            </div>
        </main>
        
        <footer className="flex-shrink-0 p-6">
            <div className="flex items-center justify-around">
               <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <MicOff className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={() => setIsCameraOn(!isCameraOn)}>
                    {isCameraOn ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
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

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className="relative h-full w-full">
        <div className="absolute inset-0 z-0">
          <Image
            src={user.avatar}
            alt={user.name}
            layout="fill"
            objectFit="cover"
            className="blur-xl opacity-30"
            data-ai-hint="person portrait"
          />
           <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 flex h-full flex-col">
          <header className="flex h-16 flex-shrink-0 items-center px-4">
            <Link href={`/chat/${user.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          </header>

          <main className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
            <Avatar className="h-32 w-32 border-4 border-white">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-3xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground">Ringing...</p>
          </main>

          <footer className="flex-shrink-0 p-6">
            <div className="flex items-center justify-around">
                <div className="flex flex-col items-center gap-2">
                   <Button variant="outline" size="icon" className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 border-0">
                        <Volume2 className="h-8 w-8" />
                    </Button>
                    <span className="text-sm">Speaker</span>
                </div>
                 <div className="flex flex-col items-center gap-2">
                    <Button variant="outline" size="icon" className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 border-0">
                        <MicOff className="h-8 w-8" />
                    </Button>
                    <span className="text-sm">Mute</span>
                </div>
                 <Link href={`/chat/${user.id}`} className="flex flex-col items-center gap-2">
                    <Button variant="destructive" size="icon" className="h-16 w-16 rounded-full">
                        <PhoneOff className="h-8 w-8" />
                    </Button>
                     <span className="text-sm">End</span>
                </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
