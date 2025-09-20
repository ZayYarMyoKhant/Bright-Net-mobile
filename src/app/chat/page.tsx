
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

type OtherUser = {
  id: string;
  username: string;
  avatar_url: string;
  full_name: string;
  last_seen: string | null;
  show_active_status: boolean;
};

type Conversation = {
  conversation_id: string;
  other_user: OtherUser;
  last_message: {
    content: string | null;
    media_type: string | null;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
};

function PresenceIndicator({ user }: { user: OtherUser }) {
    if (!user.show_active_status || !user.last_seen) {
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

  const fetchUserAndConversations = useCallback(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signup');
        return;
      }
      setCurrentUser(user);

      // This is a manual implementation of fetching conversations without RPC
      try {
        // 1. Get all conversation IDs the user is part of.
        const { data: userConvos, error: convoError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (convoError) throw convoError;
        
        const conversationIds = userConvos.map(c => c.conversation_id);
        
        if (conversationIds.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // 2. Get all participants and their profiles for these conversations
        const { data: allParticipants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, profiles(*)')
          .in('conversation_id', conversationIds);

        if (participantsError) throw participantsError;
        
        // 3. Get the last message for each conversation
        const { data: lastMessages, error: messagesError } = await supabase
          .rpc('get_last_messages_for_conversations', { c_ids: conversationIds });
          
        if (messagesError) throw messagesError;

        // 4. Get unread counts for each conversation
        const { data: unreadData, error: unreadError } = await supabase
            .from('direct_messages')
            .select('id, conversation_id')
            .in('conversation_id', conversationIds)
            .neq('sender_id', user.id);

        if (unreadError) throw unreadError;

        const { data: readStatuses, error: readStatusError } = await supabase
            .from('direct_message_read_status')
            .select('message_id')
            .eq('user_id', user.id)
            .in('message_id', unreadData?.map(m => m.id) || []);

        // if (readStatusError) throw readStatusError; // Don't throw, just handle it
        if (readStatusError) {
          console.error("Error fetching read statuses:", readStatusError);
        }
        
        const readMessageIds = new Set((readStatuses || []).map(rs => rs.message_id));
        const unreadCountsMap = new Map<string, number>();

        unreadData?.forEach(message => {
            if (!readMessageIds.has(message.id)) {
                const count = unreadCountsMap.get(message.conversation_id) || 0;
                unreadCountsMap.set(message.conversation_id, count + 1);
            }
        });

        // 5. Process and combine the data
        const lastMessageMap = new Map(lastMessages.map(m => [m.conversation_id, m]));

        const processedConversations = conversationIds.map(convoId => {
            const participants = allParticipants.filter(p => p.conversation_id === convoId);
            const otherParticipant = participants.find(p => p.user_id !== user.id);
            
            if (!otherParticipant || !otherParticipant.profiles) {
              return null; // Should not happen in a valid conversation
            }

            const lastMessage = lastMessageMap.get(convoId);

            return {
                conversation_id: convoId,
                other_user: otherParticipant.profiles as OtherUser,
                last_message: lastMessage ? {
                    content: lastMessage.content,
                    media_type: lastMessage.media_type,
                    created_at: lastMessage.created_at,
                    sender_id: lastMessage.sender_id,
                } : null,
                unread_count: unreadCountsMap.get(convoId) || 0,
            };
        }).filter((c): c is Conversation => c !== null);
        
        processedConversations.sort((a, b) => {
            if (!a.last_message) return 1;
            if (!b.last_message) return -1;
            return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
        });

        setConversations(processedConversations);

      } catch (error: any) {
        console.error("Error fetching user's conversations:", error);
        toast({
            variant: "destructive",
            title: "Failed to load chats",
            description: `Database error: ${error.message}`
        });
      } finally {
        setLoading(false);
      }
    }, [supabase, router, toast]);

  useEffect(() => {
    setLoading(true);
    fetchUserAndConversations();
    
    const channel = supabase.channel('public:direct_messages')
      .on( 'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_messages' },
        (payload) => {
          fetchUserAndConversations();
        }
      ).on( 'postgres_changes',
        { event: '*', schema: 'public', table: 'direct_message_read_status' },
        (payload) => {
          fetchUserAndConversations();
        }
      ).subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }

  }, [fetchUserAndConversations, supabase]);

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    router.push(`/profile/${userId}`);
  };

  const getLastMessageDisplay = (msg: Conversation['last_message'], isUnread: boolean) => {
    if (!msg) return "No messages yet";
    const textClass = isUnread ? "font-bold text-foreground" : "text-muted-foreground";
    let content = "";
    if (msg.content) content = msg.content;
    else if (msg.media_type === 'sticker') content = 'Sent a sticker';
    else if (msg.media_type) content = `Sent a ${msg.media_type}`;
    else content = "No content";
    
    return <p className={cn("text-sm truncate", textClass)}>{content}</p>
  }

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
          <h1 className="text-xl font-bold">Chat</h1>
        </header>

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
                          {chat.last_message ? formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true }) : ''}
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
