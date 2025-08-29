
"use client";

import { useState, use } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const host = {
    id: 0,
    name: `Host`,
    avatarFallback: `H`,
    isMuted: false,
    avatar: `https://i.pravatar.cc/400?u=host`
};

const members = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Member ${i + 1}`,
    avatarFallback: `M${i+1}`,
    isMuted: i % 3 === 0,
    avatar: `https://i.pravatar.cc/150?u=member${i+1}`
}));

export default function ClassVideoCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // In a real app, you would fetch class info
  const classInfo = {
    id: params.id,
    name: "Advanced Graphic Design",
    avatarFallback: "A",
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Link href={`/class/${classInfo.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-10 w-10">
            <AvatarFallback>{classInfo.avatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{classInfo.name}</p>
            <p className="text-xs text-green-500">{members.length + 1} participants</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2 flex flex-col">
        {/* Host View */}
        <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-muted mb-2">
           <Image 
                src={host.avatar}
                alt={host.name}
                layout="fill"
                objectFit="cover"
                data-ai-hint="person video"
            />
            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                {host.isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                <span>{host.name} (Host)</span>
            </div>
        </div>
        {/* Members View */}
        <div className="grid grid-cols-4 gap-2 flex-1">
            {members.map(member => (
                 <div key={member.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <Image 
                        src={member.avatar}
                        alt={member.name}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="person video"
                    />
                     <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                        {member.isMuted ? <MicOff className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5" />}
                        <span className="truncate">{member.name}</span>
                    </div>
                 </div>
            ))}
        </div>
      </main>

      <footer className="flex-shrink-0 border-t p-4">
        <div className="flex items-center justify-around">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={() => setIsCameraOn(!isCameraOn)}
          >
            {isCameraOn ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
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
