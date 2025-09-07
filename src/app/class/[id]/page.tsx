
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Video, MoreVertical, Image as ImageIcon, Send, Smile, Mic, Trash2, Loader2, Check, CheckCheck, X, Expand } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { format } from 'date-fns';


type Profile = {
    username: string;
    avatar_url: string;
};

type Message = {
    id: string;
    content: string | null;
    created_at: string;
    user_id: string;
    profiles: Profile;
    is_read?: boolean;
    media_url?: string | null;
    media_type?: 'image' | 'video' | 'text' | null;
};

const ChatMessage = ({ message, isSender }: { message: Message, isSender: boolean }) => {
    const sentTime = format(new Date(message.created_at), 'h:mm a');

    const renderContent = () => {
        if (message.media_type === 'image' && message.media_url) {
            return (
                <div className="relative h-48 w-48 rounded-lg overflow-hidden">
                    <Image src={message.media_url} alt="Sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                    <Link href={`/class/media/image/${encodeURIComponent(message.media_url)}`} passHref>
                         <Button asChild variant="ghost" size="icon" className="absolute bottom-1 left-1 h-7 w-7 bg-black/50 hover:bg-black/70 text-white hover:text-white">
                           <a><Expand className="h-4 w-4" /></a>
                        </Button>
                    </Link>
                </div>
            )
        }
        if (message.media_type === 'video' && message.media_url) {
             return (
                <Link href={`/class/media/video/${encodeURIComponent(message.media_url)}`}>
                    <video src={message.media_url} controls className="max-w-60 rounded-lg" />
                </Link>
             )
        }
        return <p className="text-sm">{message.content}</p>;
    }

    return (
        <div className={`flex items-start gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
             {!isSender && (
                 <Link href={`/profile/${message.profiles.username}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.profiles.avatar_url} alt={message.profiles.username} />
                        <AvatarFallback>{message.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                 </Link>
            )}
            <div className="flex flex-col gap-1 items-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="cursor-pointer">
                            <div className={`max-w-xs rounded-lg px-3 py-2 ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {!isSender && <p className="font-semibold text-xs mb-1 text-primary">{message.profiles.username}</p>}
                                {renderContent()}
                                {message.media_url && message.content && <p className="text-sm mt-1">{message.content}</p>}
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-1.5">
                    <p className="text-xs text-muted-foreground">{sentTime}</p>
                    {isSender && (
                      message.is_read ? <CheckCheck className="h-4 w-4 text-blue-500" /> : <Check className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>
        </div>
    )
};


export default function ClassChannelPage({ params: paramsPromise }: { params: Promise<{ id:string }> }) {
  const params = use(paramsPromise);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [classInfo, setClassInfo] = useState<{ id: string; name: string; avatarFallback: string } | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleNewMessage = useCallback(
    async (payload: any) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', payload.new.user_id)
        .single();
  
      if (profileData) {
        const newMessageWithProfile: Message = {
          ...payload.new,
          profiles: profileData,
          is_read: false,
        };
        
        setMessages((prevMessages) => {
          if (prevMessages.some(msg => msg.id === newMessageWithProfile.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessageWithProfile];
        });
      }
    },
    [supabase]
  );

  const handleReadStatusUpdate = useCallback((payload: any) => {
    setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg => {
            if (msg.id === payload.new.message_id) {
                 return { ...msg, is_read: true };
            }
            return msg;
        });

        if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
            return updatedMessages;
        }
        return prevMessages;
    });
  }, []);

  const markMessagesAsRead = useCallback(async (msgs: Message[], user: SupabaseUser) => {
    const unreadMessageIds = msgs
      .filter(m => m.user_id !== user.id && !m.is_read)
      .map(m => m.id);

    if (unreadMessageIds.length === 0) return;

    const readReceipts = unreadMessageIds.map(message_id => ({
        message_id,
        reader_id: user.id,
    }));
    
    await supabase.from('message_read_status').upsert(readReceipts, {
      onConflict: 'message_id,reader_id'
    });
  }, [supabase]);


  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      const { data: classData } = await supabase.from('classes').select('name').eq('id', params.id).single();
      if (classData) {
        setClassInfo({
          id: params.id,
          name: classData.name,
          avatarFallback: classData.name.charAt(0),
        });
      }

      if (user) {
        const { data: initialMessages } = await supabase
          .from('class_messages')
          .select(`*, profiles (username, avatar_url), message_read_status(reader_id)`)
          .eq('class_id', params.id)
          .order('created_at', { ascending: true });
          
        if (initialMessages) {
            const memberCountResult = await supabase
              .from('class_members')
              .select('user_id', { count: 'exact' })
              .eq('class_id', params.id);
            
            const memberCount = memberCountResult.data?.length || 1;

            const processedMessages = initialMessages.map((msg: any) => ({
                ...msg,
                is_read: msg.message_read_status.length >= (memberCount - 1),
            }));
            setMessages(processedMessages as Message[]);
            markMessagesAsRead(processedMessages, user);
        }
      }
      
      setLoading(false);
    };
    
    fetchInitialData();
  }, [params.id, supabase, markMessagesAsRead]);

  useEffect(() => {
    if (!params.id || !supabase) return;

    const channel = supabase.channel(`class-chat-${params.id}`);

    const messageSubscription = channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'class_messages', filter: `class_id=eq.${params.id}` },
        handleNewMessage
    );

    const readStatusSubscription = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_read_status' },
        (payload) => {
            if (messages.some(m => m.id === payload.new.message_id)) {
                handleReadStatusUpdate(payload);
            }
        }
    );
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, supabase, handleNewMessage, handleReadStatusUpdate, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
      } else {
        alert("Only images and videos are allowed.");
        setMediaFile(null);
        setMediaPreview(null);
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaFile) || !currentUser || !classInfo) return;
    
    setSending(true);
    let media_url = null;
    let media_type: 'image' | 'video' | 'text' = 'text';

    if (mediaFile) {
        const fileType = mediaFile.type.split('/')[0]; // 'image' or 'video'
        media_type = fileType as 'image' | 'video';
        const filePath = `class_media/${classInfo.id}/${currentUser.id}/${Date.now()}_${mediaFile.name}`;
        
        const { error: uploadError } = await supabase.storage
            .from('avatars') // NOTE: Using 'avatars' bucket, consider a 'class_media' bucket
            .upload(filePath, mediaFile);
        
        if (uploadError) {
            console.error("Upload error:", uploadError);
            alert("Failed to upload file.");
            setSending(false);
            return;
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        media_url = urlData.publicUrl;
    }

    const content = newMessage;
    
    await supabase.from('class_messages').insert({
        content: content || null,
        class_id: classInfo.id,
        user_id: currentUser.id,
        media_url,
        media_type
    });

    setNewMessage("");
    handleRemoveMedia();
    setSending(false);
  }

  if (loading || !classInfo) {
      return (
        <div className="flex h-dvh flex-col bg-background text-foreground items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading channel...</p>
        </div>
      )
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
            <ChatMessage key={msg.id} message={msg} isSender={msg.user_id === currentUser?.id} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="flex-shrink-0 border-t p-2">
        {mediaPreview && (
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
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept="image/*,video/*"
            />
            <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" type="button"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
            <Input 
              placeholder="Type a message..." 
              className="flex-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button variant="ghost" size="icon" type="button"><Mic className="h-5 w-5 text-muted-foreground" /></Button>
            <Button size="icon" type="submit" disabled={(!newMessage.trim() && !mediaFile) || sending}>
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </form>
      </footer>
    </div>
  );
}
