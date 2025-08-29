
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MicOff, PhoneOff, Volume2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function VoiceCallPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch user data based on params.id
  const user = {
    id: params.id,
    name: "Su Su",
    avatar: "https://i.pravatar.cc/150?u=susu",
  };

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
