
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { formatDistanceToNow, isBefore, subMinutes } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AdBanner } from "@/components/ad-banner";

type OtherUser = {
  id: string;
  username: string;
  avatar_url: string;
  full_name: string;
  last_seen: string | null;
  show_active_status: boolean;
};

type LastMessage = {
    content: string | null;
    media_type: string | null;
    created_at: string;
    sender_id: string;
} | null;

type Conversation = {
  conversation_id: string;
  other_user: OtherUser;
  last_message: LastMessage;
  unread_count: number;
};

function PresenceIndicator({ user }: { user: OtherUser }) {
    if (!user || !user.show_active_status || !user.last_seen) {
        return null;
    }

    const twoMinutesAgo = subMinutes(new Date(), 2);
    const isOnline = isBefore(twoMinutesAgo, new Date(user.last_seen));

    if (isOnline) {
         return (
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
         )
    }
    
    return null;
}


export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserAndConversations = useCallback(async (user: User) => {
      try {
        const { data, error } = await supabase.rpc('get_user_conversations');
        
        if (error) {
            throw error;
        }
        
        setConversations(data || []);

      } catch (error) {
        console.error("Error fetching user's conversations:", error);
        toast({
            variant: "destructive",
            title: "Failed to load chats",
            description: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }, [supabase, toast]);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/signup');
            setLoading(false);
            return;
        }
        setCurrentUser(user);
        fetchUserAndConversations(user);
    };
    init();
  }, [fetchUserAndConversations, supabase.auth, router]);
  
  useEffect(() => {
    if (!currentUser) return;
    
    const channel = supabase.channel('public:chat_list_updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages' },
        () => fetchUserAndConversations(currentUser)
      ).on('postgres_changes',
        { event: '*', schema: 'public', table: 'direct_message_read_status' },
        () => fetchUserAndConversations(currentUser)
      ).on('postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants' },
        () => fetchUserAndConversations(currentUser)
      )
      .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }

  }, [currentUser, fetchUserAndConversations, supabase]);

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/profile/${userId}`);
  };

  const getLastMessageDisplay = (msg: LastMessage, isUnread: boolean) => {
    if (!msg || !msg.created_at) return "No messages yet";
    const textClass = isUnread ? "font-bold text-foreground" : "text-muted-foreground";
    let content = "";
    
    const prefix = msg.sender_id === currentUser?.id ? "You: " : "";

    if (msg.content) {
        content = prefix + msg.content;
    } else if (msg.media_type) {
        content = prefix + `Sent a ${msg.media_type}`;
    } else {
        content = "No content";
    }
    
    return <p className={cn("text-sm truncate", textClass)}>{content}</p>
  }

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
          <h1 className="text-xl font-bold">Chat</h1>
        </header>

         <div className="p-4 border-b">
            <AdBanner />
          </div>

        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full pt-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
             <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                <Users className="h-12 w-12 mb-4" />
                <p className="font-bold">No Chats Yet</p>
                <p className="text-sm mt-1">Find someone on the Search page to start a conversation!</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((chat) => (
                <Link href={`/chat/${chat.other_user.id}`} key={chat.conversation_id}>
                  <div className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer">
                    <div className="relative" onClick={(e) => handleProfileClick(e, chat.other_user.id)}>
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={chat.other_user.avatar_url} alt={chat.other_user.username} data-ai-hint="person portrait" />
                        <AvatarFallback>{chat.other_user.full_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <PresenceIndicator user={chat.other_user} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold truncate">{chat.other_user.full_name}</p>
                      {getLastMessageDisplay(chat.last_message, chat.unread_count > 0 && chat.last_message?.sender_id !== currentUser?.id)}
                    </div>
                     <div className="flex flex-col items-end gap-1.5 self-start">
                        <p className="text-xs text-muted-foreground shrink-0">
                          {chat.last_message && chat.last_message.created_at ? formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true }) : ''}
                        </p>
                         {chat.unread_count > 0 && chat.last_message?.sender_id !== currentUser?.id && (
                             <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground">{chat.unread_count}</Badge>
                         )}
                     </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
