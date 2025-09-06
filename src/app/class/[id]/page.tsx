
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Video, MoreVertical, Image as ImageIcon, Send, Smile, Mic, Trash2, Loader2, Check } from "lucide-react";
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
                    {isSender && <Check className="h-4 w-4 text-primary" />}
                </div>
            </div>
        </div>
    )
};


export default function ClassChannelPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [classInfo, setClassInfo] = useState<{ id: string; name: string; avatarFallback: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewMessage = useCallback((newMessagePayload: Message) => {
    setMessages((prevMessages) => {
      // Avoid adding duplicate messages
      if (prevMessages.some(msg => msg.id === newMessagePayload.id)) {
        return prevMessages;
      }
      return [...prevMessages, newMessagePayload];
    });
  }, []);

  useEffect(() => {
    const setupPage = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if(user) {
        const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
        setCurrentUserProfile(profile);
      }
      
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('name')
        .eq('id', params.id)
        .single();
      
      if (classData) {
        setClassInfo({
          id: params.id,
          name: classData.name,
          avatarFallback: classData.name.charAt(0),
        });
      } else {
         console.error(classError);
      }

      const { data: initialMessages, error: messagesError } = await supabase
        .from('class_messages')
        .select(`*, profiles (username, avatar_url)`)
        .eq('class_id', params.id)
        .order('created_at', { ascending: true });
        
      if (initialMessages) {
        setMessages(initialMessages as Message[]);
      } else {
        console.error(messagesError);
      }
      
      setLoading(false);
    };
    setupPage();

    const channel = supabase.channel(`class-chat-${params.id}`)
        .on<Message>(
            'postgres_changes',
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'class_messages',
                filter: `class_id=eq.${params.id}`
            },
            async (payload) => {
                // Fetch profile for the new message if it's not from the current user
                if (payload.new.user_id !== currentUser?.id) {
                    const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.user_id).single();
                    if(profile){
                        const newMessageWithProfile = { ...payload.new, profiles: profile } as Message;
                        handleNewMessage(newMessageWithProfile);
                    }
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };

  }, [params.id, supabase, currentUser?.id, handleNewMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || !classInfo || !currentUserProfile) return;

    const content = newMessage;
    setNewMessage("");

    // Optimistic UI update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: content,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      profiles: currentUserProfile
    };
    handleNewMessage(optimisticMessage);


    const { error } = await supabase.from('class_messages').insert({
        content: content,
        class_id: classInfo.id,
        user_id: currentUser.id
    });

     if (error) {
        // Revert optimistic update on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
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
