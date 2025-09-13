
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Phone, Mic, Image as ImageIcon, Send, Smile, MoreVertical, MessageSquareReply, Trash2, X, Loader2, Waves } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/emoji-picker";
import { useToast } from "@/hooks/use-toast";
import AudioPlayer from "@/components/audio-player";


const ChatMessage = ({ message, isSender, isImage, onReply }: { message: any, isSender: boolean, isImage?: boolean, onReply: (message: any) => void }) => {
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


export default function IndividualChatPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const { toast } = useToast();
  
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello!", sender: false, user: { name: 'Susu', username: 'susu', avatar: `https://i.pravatar.cc/150?u=susu` } },
    { id: 2, text: "Hi, how are you?", sender: true, user: { name: 'Aung Aung', username: 'aungaung' } },
    { id: 3, text: "I am fine, thank you! And you?", sender: false, user: { name: 'Susu', username: 'susu', avatar: `https://i.pravatar.cc/150?u=susu` } },
    { id: 4, text: "https://picsum.photos/400/400?random=20", sender: false, isImage: true, user: { name: 'Susu', username: 'susu', avatar: `https://i.pravatar.cc/150?u=susu` } },
    { id: 5, text: "I'm doing great. Look at this picture!", sender: false, user: { name: 'Susu', username: 'susu', avatar: `https://i.pravatar.cc/150?u=susu` } },
    { id: 6, text: "Wow, that's beautiful!", sender: true, user: { name: 'Aung Aung', username: 'aungaung' } },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const user = {
    id: params.id,
    username: params.id,
    name: params.id.charAt(0).toUpperCase() + params.id.slice(1),
    avatar: `https://i.pravatar.cc/150?u=${params.id}`,
    online: Math.random() > 0.5
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleReply = (message: any) => {
    setReplyingTo(message);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
        setMediaDuration(null); // Reset duration for non-audio
      } else {
        toast({variant: "destructive", title: "Unsupported File Type", description: "Only images and videos are allowed."});
        handleRemoveMedia();
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaDuration(null);
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
    setShowEmojiPicker(false);
    toast({ title: "Message sent (mock)" });
  }

  const handleSendSticker = async (stickerUrl: string) => {
    setShowEmojiPicker(false);
    setSending(true);
    
    // Mock sending logic
    await new Promise(resolve => setTimeout(resolve, 500));

    setSending(false);
    toast({ title: "Sticker sent (mock)" });
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setMediaDuration(recordingTime);
        setRecordingTime(0);

        setMediaFile(audioFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

    } catch (error) {
      console.error("Mic permission denied", error);
      toast({ variant: "destructive", title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser settings." });
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatRecordingTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
            <Link href={`/profile/${user.id}`}>
                <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
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
             {mediaPreview && !mediaFile?.type.startsWith('audio') && (
                <div className="p-2 relative">
                    <div className="relative w-24 h-24 rounded-md overflow-hidden">
                        {mediaFile?.type.startsWith('image/') ? (
                            <Image src={mediaPreview} alt="Media preview" layout="fill" objectFit="cover" />
                        ) : (
                            <video src={mediaPreview} className="w-full h-full object-cover" />
                        )}
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
                 { isRecording ? (
                    <div className="flex-1 flex items-center bg-muted h-10 rounded-md px-3 gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <p className="text-sm font-mono text-red-500">{formatRecordingTime(recordingTime)}</p>
                    </div>
                ) : mediaFile && mediaFile.type.startsWith('audio/') ? (
                    <div className="flex-1 flex items-center bg-muted h-10 rounded-md px-3 gap-2">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleRemoveMedia}>
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                        <Waves className="h-5 w-5 text-primary" />
                        <p className="text-sm font-mono text-muted-foreground">{formatRecordingTime(Math.round(mediaDuration || 0))}</p>
                    </div>
                ) : (
                    <>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            className="hidden" 
                            accept="image/*,video/*"
                        />
                        <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                            <Smile className={cn("h-5 w-5 text-muted-foreground", showEmojiPicker && "text-primary")} />
                        </Button>
                        <Input 
                          placeholder="Type a message..." 
                          className="flex-1"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onFocus={() => setShowEmojiPicker(false)}
                        />
                    </>
                )}

                <Button variant="ghost" size="icon" type="button" onClick={handleMicClick}>
                  <Mic className={cn("h-5 w-5 text-muted-foreground", isRecording && "text-red-500")} />
                </Button>
                <Button size="icon" type="submit" disabled={(!newMessage.trim() && !mediaFile) || sending}>
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </form>
        </div>
        {showEmojiPicker && (
            <EmojiPicker 
                onEmojiSelect={(emoji) => {
                    setNewMessage(prev => prev + emoji);
                }}
                onStickerSelect={handleSendSticker}
            />
        )}
      </footer>
    </div>
  );
}
