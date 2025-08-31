
"use client";

import { use, useState, useEffect } from "react";
import { ArrowLeft, Send, Swords } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getVideoPosts } from "@/lib/data";


export default function TypingBattlePage({ params: paramsPromise }: { params: Promise<{ id:string }> }) {
  const params = use(paramsPromise);
  const [inputValue, setInputValue] = useState("");
  // Set an initial default state to prevent rendering errors
  const [opponent, setOpponent] = useState<any>({
      name: "Opponent",
      avatar: "https://i.pravatar.cc/150?u=opponent",
      username: "opponent"
  });

  useEffect(() => {
    const allUsers = getVideoPosts().map(p => p.user);
    const uniqueUsers = [...new Map(allUsers.map(item => [item['username'], item])).values()];
    const foundOpponent = uniqueUsers.find(u => u.username === params.id);

    if (foundOpponent) {
      setOpponent(foundOpponent);
    } else {
      // Create a fallback opponent if not found
      setOpponent({
        id: params.id,
        username: params.id,
        name: params.id.charAt(0).toUpperCase() + params.id.slice(1),
        avatar: `https://i.pravatar.cc/150?u=${params.id}`,
      });
    }
  }, [params.id]);


  const you = {
    name: "You",
    avatar: "https://i.pravatar.cc/150?u=aungaung",
  }

  const yourMark = 10;
  const enemyMark = 9;
  const typingWord = "Jade is word for school.";

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // Handle message sending logic
      setInputValue("");
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Link href={`/chat/${params.id}`} className="p-2 -ml-2 absolute left-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2 mx-auto">
           <h1 className="text-xl font-bold">Typing Battle</h1>
           <Swords className="h-5 w-5" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-around items-center text-center">
            <div className="flex flex-col items-center gap-2">
                <Avatar className="h-20 w-20 border-2 border-primary">
                    <AvatarImage src={you.avatar} alt={you.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{you.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{you.name}</p>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">Vs</p>
            <div className="flex flex-col items-center gap-2">
                 <Avatar className="h-20 w-20 border-2">
                    <AvatarImage src={opponent.avatar} alt={opponent.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{opponent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{opponent.name}</p>
            </div>
        </div>

        <Card>
            <CardContent className="p-4">
                <div className="flex justify-around items-center text-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Your Mark</p>
                        <p className="text-3xl font-bold">{yourMark}</p>
                    </div>
                     <Swords className="h-8 w-8 text-destructive" />
                     <div>
                        <p className="text-sm text-muted-foreground">Enemy Mark</p>
                        <p className="text-3xl font-bold">{enemyMark}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="bg-muted">
            <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Typing Word</p>
                <p className="text-lg font-semibold mt-1">{typingWord}</p>
            </CardContent>
        </Card>

      </main>

       <footer className="flex-shrink-0 border-t p-2">
        <div className="flex items-center gap-2">
            <Input 
              placeholder="Typing bar..." 
              className="flex-1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button size="icon" onClick={handleSendMessage} disabled={!inputValue}>
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
