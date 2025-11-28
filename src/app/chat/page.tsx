
"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { BottomNav } from '@/components/bottom-nav';
import { Avatar } from '@/components/ui/avatar';
import { Loader2, MessageSquarePlus, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, isBefore, subMinutes } from 'date-fns';
import { Profile } from '@/lib/data';
import { AdBanner } from '@/components/ad-banner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Conversation = {
  id: string;
  is_self_chat: boolean;
  other_user: Profile & { last_seen: string | null; show_active_status: boolean; };
  last_message: {
    content: string | null;
    media_type: string | null;
    created_at: string;
    sender_id: string;
    is_seen: boolean;
  } | null;
  unread_count: number;
};

function PresenceIndicator({ user }: { user: { last_seen: string | null; show_active_status: boolean; } }) {
    if (!user || !user.show_active_status || !user.last_seen) {
        return null;
    }

    const twoMinutesAgo = subMinutes(new Date(), 2);
    const isOnline = isBefore(twoMinutesAgo, new Date(user.last_seen));

    if (isOnline) {
         return (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
         )
    }
    return null;
}


export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchConversations = useCallback(async (user: User) => {
    setLoading(true);
    
    // 1. Get all conversation IDs the current user is part of
    const { data: userConvos, error: userConvosError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

    if (userConvosError) {
        console.error("Error fetching user's conversations:", userConvosError);
        setLoading(false);
        return;
    }

    const conversationIds = userConvos.map(c => c.conversation_id);
    if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
    }

    // 2. Fetch all participants for these conversations
    const { data: allParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profiles!inner(id, username, full_name, avatar_url, last_seen, show_active_status)')
        .in('conversation_id', conversationIds);

    if (participantsError) {
        console.error("Error fetching participants:", participantsError);
        setLoading(false);
        return;
    }

    // 3. Process each conversation
    const processedConvos = await Promise.all(conversationIds.map(async (convoId) => {
        const participantsInConvo = allParticipants.filter(p => p.conversation_id === convoId);
        const otherParticipant = participantsInConvo.find(p => p.user_id !== user.id);
        const isSelfChat = participantsInConvo.length === 1 && participantsInConvo[0].user_id === user.id;

        // Determine the "other user" for the chat list
        const otherUser = isSelfChat ? participantsInConvo[0].profiles : otherParticipant?.profiles;
        if (!otherUser) return null; // Should not happen in a valid conversation

        // 4. Fetch the last message for the conversation
        const { data: lastMessage, error: lastMessageError } = await supabase
            .from('direct_messages')
            .select('content, media_type, created_at, sender_id')
            .eq('conversation_id', convoId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // 5. Count unread messages for the current user in this conversation
        const { count: unreadCount, error: unreadError } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convoId)
            .eq('is_seen', false)
            .neq('sender_id', user.id);

        return {
            id: convoId,
            is_self_chat: isSelfChat,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: unreadCount || 0,
        } as Conversation;
    }));

    const validConvos = processedConvos.filter(Boolean) as Conversation[];

    const sortedConvos = validConvos.sort((a, b) => {
        if (a.is_self_chat) return -1;
        if (b.is_self_chat) return 1;
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
    });

    setConversations(sortedConvos);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/signup');
      } else {
        setCurrentUser(user);
        fetchConversations(user);
      }
    });
  }, [supabase, router, fetchConversations]);

  useEffect(() => {
    if (!currentUser) return;

    const changes = supabase.channel('public:chat-list-page-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'direct_messages' },
        (payload) => {
            fetchConversations(currentUser);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants' },
        (payload) => {
            fetchConversations(currentUser);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'direct_message_read_status' },
        (payload) => {
             fetchConversations(currentUser);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(changes);
    };
  }, [currentUser, supabase, fetchConversations]);
  
  const handleSavedMessageClick = () => {
    if(currentUser) {
        router.push(`/chat/${currentUser.id}`);
    }
  }

  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4 relative">
          <h1 className="text-xl font-bold">Chats</h1>
          {currentUser && (
            <Button variant="ghost" size="icon" className="absolute right-2" onClick={handleSavedMessageClick}>
                <Bookmark />
            </Button>
          )}
        </header>

        <div className="p-4 border-b">
          <AdBanner />
        </div>

        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-20">
              <MessageSquarePlus className="h-16 w-16" />
              <h2 className="mt-4 text-lg font-semibold">No Chats Yet</h2>
              <p className="mt-1 text-sm">Start a conversation from a user's profile.</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((convo) => {
                if (!convo.other_user) return null;
                
                const isSavedMessages = convo.is_self_chat;
                const lastMessage = convo.last_message;
                const isUnread = !isSavedMessages && convo.unread_count > 0;
                let lastMessagePreview = "No messages yet";

                if (lastMessage) {
                  let text = "";
                   if (lastMessage.content) {
                        text = lastMessage.content;
                   } else if (lastMessage.media_type) {
                        text = `Sent a ${lastMessage.media_type}`;
                   }
                  if(lastMessage.sender_id === currentUser?.id && !isSavedMessages) {
                     lastMessagePreview = `You: ${text}`;
                  } else {
                     lastMessagePreview = text;
                  }
                }

                return (
                  <Link href={`/chat/${convo.other_user.id}`} key={convo.id}>
                    <div className="p-4 flex items-center gap-4 hover:bg-muted/50">
                      <div className="relative">
                        {isSavedMessages ? (
                            <div className="h-14 w-14 rounded-md bg-primary flex items-center justify-center">
                                <Bookmark className="h-8 w-8 text-primary-foreground" />
                            </div>
                        ) : (
                            <>
                                <Avatar className="h-14 w-14" profile={convo.other_user}/>
                                <PresenceIndicator user={convo.other_user} />
                            </>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between">
                           <p className="font-semibold">{isSavedMessages ? 'Saved Messages' : convo.other_user.full_name}</p>
                           {lastMessage && <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}</p>}
                        </div>
                        <p className={cn(`text-sm truncate`, isUnread ? 'font-bold text-foreground' : 'text-muted-foreground')}>
                           {lastMessagePreview}
                        </p>
                      </div>
                       {isUnread && (
                         <div className="flex-shrink-0">
                           <Badge variant="destructive" className="h-6 w-6 justify-center rounded-full p-0">{convo.unread_count}</Badge>
                         </div>
                       )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
