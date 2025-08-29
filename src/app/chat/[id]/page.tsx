
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, Mic, Image as ImageIcon, Send, Smile, Swords, MoreVertical } from "lucide-react";
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


export default function IndividualChatPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch user and messages based on params.id
  const user = {
    id: params.id,
    name: "Su Su",
    avatar: "https://i.pravatar.cc/150?u=susu",
    online: true
  };

  const messages = [
    { id: 1, text: "Hello!", sender: false },
    { id: 2, text: "Hi, how are you?", sender: true },
    { id: 3, text: "I am fine, thank you! And you?", sender: false },
    { id: 4, text: "https://picsum.photos/400/400?random=20", sender: false, isImage: true },
    { id: 5, text: "I'm doing great. Look at this picture!", sender: false },
    { id: 6, text: "Wow, that's beautiful!", sender: true },
  ];

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
            <Link href="/chat">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-bold">{user.name}</p>
                {user.online && <p className="text-xs text-green-500">Active now</p>}
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/chat/${user.id}/voice-call`}>
            <Button variant="ghost" size="icon">
              <Phone className="h-5 w-5" />
            </Button>
          </Link>
           <Button variant="ghost" size="icon">
            <Swords className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
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
