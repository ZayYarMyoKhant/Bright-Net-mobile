
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Phone, Mic, Image as ImageIcon, Send, Smile, MoreVertical, MessageSquareReply, Trash2, X, Loader2, Waves, Heart, ThumbsUp, Laugh, Frown, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


const ReactionEmojis = {
  '❤️': Heart,
  '👍': ThumbsUp,
  '😂': Laugh,
  '😢': Frown
};


const ChatMessage = ({ message, isSender, onReply, onDelete }: { message: any, isSender: boolean, onReply: (message: any) => void, onDelete: (messageId: number) => void }) => {
    
    const [isReacting, setIsReacting] = useState(false);

    const handleReact = (reaction: string) => {
        setIsReacting(false);
        // Mock reaction logic
        console.log(`Reacted with ${reaction} on message ${message.id}`);
    };

    return (
        <div className={`flex items-start gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
            {!isSender && (
                <Link href={`/profile/${message.user.username}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.user.avatar} alt={message.user.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
            )}
            <div className="group relative">
                <div className={cn(
                    "max-w-xs rounded-lg",
                     message.isImage ? "bg-transparent" : (isSender ? 'bg-primary text-primary-foreground' : 'bg-muted')
                )}>
                     <div className={message.isImage ? "" : "px-4 py-2"}>
                        {!isSender && <p className="font-semibold text-xs mb-1">{message.user.name}</p>}
                        {message.isImage ? (
                            <div className="relative h-48 w-48 rounded-lg overflow-hidden">
                                <Image src={message.text} alt="sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                            </div>
                        ) : (
                            <p>{message.text}</p>
                        )}
                     </div>
                </div>
                <div className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn("h-6 w-6", isSender ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20" : "text-muted-foreground hover:text-foreground hover:bg-black/10")}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             {isSender ? (
                                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(message.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => onReply(message)}>
                                    <MessageSquareReply className="mr-2 h-4 w-4" />
                                    <span>Reply</span>
                                </DropdownMenuItem>
                            )}
                             <Popover open={isReacting} onOpenChange={setIsReacting}>
                                <PopoverTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Smile className="mr-2 h-4 w-4" />
                                        <span>React</span>
                                    </DropdownMenuItem>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-1">
                                    <div className="flex gap-1">
                                        {Object.entries(ReactionEmojis).map(([emoji, Icon]) => (
                                                <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleReact(emoji)}>
                                                <Icon className="h-5 w-5" />
                                            </Button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
};


export default function IndividualClassPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const { toast } = useToast();
  
  // Mock data
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello Class! Welcome to Digital Marketing Masterclass.", sender: false, user: { name: 'Aung Aung', username: 'aungaung', avatar: `https://i.pravatar.cc/150?u=aungaung` } },
    { id: 2, text: "Hi teacher!", sender: true, user: { name: 'Kyaw Kyaw', username: 'kyawkyaw' } },
    { id: 3, text: "When will we start the first lesson?", sender: false, user: { name: 'Susu', username: 'susu', avatar: `https://i.pravatar.cc/150?u=susu` } },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const classInfo = {
    id: params.id,
    name: "Digital Marketing Masterclass",
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleReply = (message: any) => {
    setReplyingTo(message);
  };
  
  const handleDelete = (messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast({ title: "Message deleted (mock)" });
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() && !mediaFile) return;
    
    setSending(true);
    // Mock sending logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setNewMessage("");
    handleRemoveMedia();
    setSending(false);
    toast({ title: "Message sent (mock)" });
  }

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
                <p className="font-bold">{classInfo.name}</p>
            </Link>
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
              <DropdownMenuItem>Leave Class</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isSender={msg.sender} onReply={handleReply} onDelete={handleDelete}/>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="flex-shrink-0 border-t">
        <div className="p-2">
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
             {mediaPreview && (
                <div className="p-2 relative">
                    <div className="relative w-24 h-24 rounded-md overflow-hidden">
                        <Image src={mediaPreview} alt="Media preview" layout="fill" objectFit="cover" />
                         <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full z-10"
                            onClick={handleRemoveMedia}
                         >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/*,video/*,audio/*,application/pdf"
                />
                <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
                <Input 
                  placeholder="Type a message..." 
                  className="flex-1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />

                <Button variant="ghost" size="icon" type="button">
                  <Mic className={cn("h-5 w-5 text-muted-foreground", isRecording && "text-red-500")} />
                </Button>
                <Button size="icon" type="submit" disabled={(!newMessage.trim() && !mediaFile) || sending}>
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </form>
        </div>
      </footer>
    </div>
  );
}
