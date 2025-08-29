
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Phone, Mic, Image as ImageIcon, Send, Smile, MoreVertical, MessageSquareReply, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const ChatMessage = ({ message, isSender, isImage, onReply }: { message: any, isSender: boolean, isImage?: boolean, onReply: (message: any) => void }) => {
    return (
        <div className={`flex items-start gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
            {!isSender && (
                 <Avatar className="h-8 w-8">
                    <AvatarImage src="https://i.pravatar.cc/150?u=susu" alt="Su Su" data-ai-hint="person portrait" />
                    <AvatarFallback>S</AvatarFallback>
                </Avatar>
            )}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer">
                        {isImage ? (
                            <div className="relative h-48 w-48 rounded-lg overflow-hidden">
                                <Image src={message.text} alt="sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                            </div>
                        ) : (
                            <div className={`max-w-xs rounded-lg px-4 py-2 ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="font-semibold text-xs mb-1">{message.user.name}</p>
                                {message.text}
                            </div>
                        )}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onReply(message)}>
                        <MessageSquareReply className="mr-2 h-4 w-4" />
                        <span>Reply</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                         <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
};


export default function IndividualChatPage({ params }: { params: { id: string } }) {
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  // In a real app, you would fetch user and messages based on params.id
  const user = {
    id: params.id,
    name: "Su Su",
    avatar: "https://i.pravatar.cc/150?u=susu",
    online: true
  };

  const messages = [
    { id: 1, text: "Hello!", sender: false, user: { name: 'Su Su' } },
    { id: 2, text: "Hi, how are you?", sender: true, user: { name: 'Aung Aung' } },
    { id: 3, text: "I am fine, thank you! And you?", sender: false, user: { name: 'Su Su' } },
    { id: 4, text: "https://picsum.photos/400/400?random=20", sender: false, isImage: true, user: { name: 'Su Su' } },
    { id: 5, text: "I'm doing great. Look at this picture!", sender: false, user: { name: 'Su Su' } },
    { id: 6, text: "Wow, that's beautiful!", sender: true, user: { name: 'Aung Aung' } },
  ];

  const handleReply = (message: any) => {
    setReplyingTo(message);
  };

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
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-destructive">Block user</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete chat</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isSender={msg.sender} isImage={msg.isImage} onReply={handleReply} />
        ))}
      </main>

      <footer className="flex-shrink-0 border-t p-2">
        {replyingTo && (
            <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 text-xs">
                <div className="truncate">
                    <span className="text-muted-foreground">Replying to </span>
                    <span className="font-semibold">{replyingTo.user.name}</span>: 
                    <span className="text-muted-foreground ml-1">{replyingTo.isImage ? "an image" : replyingTo.text}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyingTo(null)}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}
        <div className="flex items-center gap-2 pt-1">
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
