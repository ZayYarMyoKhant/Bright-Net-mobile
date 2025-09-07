
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Video, MoreVertical, Image as ImageIcon, Send, Smile, Mic, Trash2, Loader2, Check, CheckCheck } from "lucide-react";
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
    content: string;
    created_at: string;
    user_id: string;
    profiles: Profile;
    is_read?: boolean; 
};

const ChatMessage = ({ message, isSender }: { message: Message, isSender: boolean }) => {
    const sentTime = format(new Date(message.created_at), 'h:mm a');
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
                                <p className="text-sm">{message.content}</p>
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
                      message.is_read ? <CheckCheck className="h-4 w-4 text-primary" /> : <Check className="h-4 w-4 text-muted-foreground" />
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
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [classInfo, setClassInfo] = useState<{ id: string; name: string; avatarFallback: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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

  const fetchInitialData = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
      setCurrentUserProfile(profile as Profile);
    }
    
    const { data: classData } = await supabase.from('classes').select('name').eq('id', params.id).single();
    if (classData) {
      setClassInfo({
        id: params.id,
        name: classData.name,
        avatarFallback: classData.name.charAt(0),
      });
    }

    const { data: initialMessages } = await supabase
      .from('class_messages')
      .select(`*, profiles (username, avatar_url), message_read_status(reader_id)`)
      .eq('class_id', params.id)
      .order('created_at', { ascending: true });
      
    if (initialMessages && user) {
      const processedMessages = initialMessages.map((msg: any) => ({
        ...msg,
        is_read: msg.message_read_status.some((status: any) => status.reader_id !== msg.user_id),
      }));
      setMessages(processedMessages as Message[]);
      markMessagesAsRead(processedMessages, user);
    }
    
    setLoading(false);
  }, [params.id, supabase, markMessagesAsRead]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleNewMessage = useCallback((payload: any) => {
      const { data: profile } = supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.user_id).single().then(({ data }) => {
          if (data) {
              const newMessageWithProfile = { ...payload.new, profiles: data, is_read: false } as Message;
              setMessages((prevMessages) => {
                  if (prevMessages.some(msg => msg.id === newMessageWithProfile.id)) {
                      return prevMessages;
                  }
                  return [...prevMessages, newMessageWithProfile];
              });
          }
      });
  }, [supabase]);

  const handleReadStatusUpdate = useCallback((payload: any) => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
            msg.id === payload.new.message_id && msg.user_id !== payload.new.reader_id
            ? { ...msg, is_read: true } 
            : msg
        )
      );
      if (currentUser) {
        markMessagesAsRead(messages, currentUser);
      }
  }, [currentUser, markMessagesAsRead, messages]);

  useEffect(() => {
    const messagesChannel = supabase.channel(`class-chat-${params.id}`)
      .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'class_messages', filter: `class_id=eq.${params.id}` },
          handleNewMessage
      )
      .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'message_read_status' },
          handleReadStatusUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [params.id, supabase, handleNewMessage, handleReadStatusUpdate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !classInfo || !currentUserProfile) return;

    const content = newMessage;
    setNewMessage("");

    try {
        const audio = new Audio('/bubble-pop.mp3');
        await audio.play();
    } catch(err) {
        console.error("Audio play failed:", err);
    }

    const { error } = await supabase.from('class_messages').insert({
        content: content,
        class_id: classInfo.id,
        user_id: currentUser.id
    });

    if (error) {
        console.error("Error sending message:", error);
    }
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
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
            <Button variant="ghost" size="icon"><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
            <Input 
              placeholder="Type a message..." 
              className="flex-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button variant="ghost" size="icon"><Mic className="h-5 w-5 text-muted-foreground" /></Button>
            <Button size="icon" type="submit" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
            </Button>
        </form>
      </footer>
    </div>
  );
}
