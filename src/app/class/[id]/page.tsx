
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Video, MoreVertical, Image as ImageIcon, Send, Smile, Mic } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ChatMessage = ({ message, isSender, isImage }: { message: string, isSender: boolean, isImage?: boolean }) => {
    return (
        <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
            {isImage ? (
                 <div className="relative h-48 w-48 rounded-lg overflow-hidden">
                    <Image src={message} alt="sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                </div>
            ) : (
                <div className={`max-w-xs rounded-lg px-4 py-2 ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {message}
                </div>
            )}
        </div>
    )
};


export default function ClassChannelPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch class and messages based on params.id
  const classInfo = {
    id: params.id,
    name: "Advanced Graphic Design",
    avatarFallback: "A",
  };

  const messages = [
    { id: 1, text: "Hello everyone!", sender: false },
    { id: 2, text: "Hi! Glad to be here.", sender: true },
    { id: 3, text: "Here's the first design I'm working on.", sender: false },
    { id: 4, text: "https://picsum.photos/400/400?random=30", sender: false, isImage: true },
  ];

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
            <Link href="/class">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <Link href={`/class/${classInfo.id}/info`}>
              <Avatar className="h-10 w-10">
                  <AvatarFallback>{classInfo.avatarFallback}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
                <p className="font-bold">{classInfo.name}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/class/${classInfo.id}/video-call`}>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-destructive">Leave class</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg.text} isSender={msg.sender} isImage={msg.isImage} />
        ))}
      </main>

      <footer className="flex-shrink-0 border-t p-2">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
            <Input placeholder="Type a message..." className="flex-1"/>
            <Button variant="ghost" size="icon"><Mic className="h-5 w-5 text-muted-foreground" /></Button>
            <Button size="icon">
                <Send className="h-5 w-5" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
