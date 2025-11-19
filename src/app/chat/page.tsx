
"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { BottomNav } from '@/components/bottom-nav';
import { Avatar } from '@/components/ui/avatar';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, isBefore, subMinutes } from 'date-fns';
import { Profile } from '@/lib/data';
import { AdBanner } from '@/components/ad-banner';

type Conversation = {
  id: string;
  other_user: Profile & { last_seen: string | null; show_active_status: boolean; };
  last_message: {
    content: string | null;
    media_type: string | null;
    created_at: string;
    sender_id: string;
    is_seen: boolean;
  } | null;
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

    const { data: userConvos, error: userConvosError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

    if (userConvosError) {
        console.error('Error fetching user conversations:', userConvosError);
        setConversations([]);
        setLoading(false);
        return;
    }

    const conversationIds = userConvos.map(c => c.conversation_id);

    if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
    }

    const { data: otherParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profiles(*)')
        .in('conversation_id', conversationIds)
        .neq('user_id', user.id);

    if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        setConversations([]);
        setLoading(false);
        return;
    }

    const { data: lastMessages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

    if (messagesError) {
        console.error('Error fetching last messages:', messagesError);
    }
    
    // Create a map to get the latest message for each conversation
    const lastMessageMap = new Map();
    if (lastMessages) {
        for (const message of lastMessages) {
            if (!lastMessageMap.has(message.conversation_id)) {
                lastMessageMap.set(message.conversation_id, message);
            }
        }
    }

    // Check read status for each last message
    const lastMessageIds = Array.from(lastMessageMap.values()).map(m => m.id);
    const { data: readStatuses, error: readStatusError } = await supabase
        .from('direct_message_read_status')
        .select('message_id')
        .eq('user_id', user.id)
        .in('message_id', lastMessageIds);

    if (readStatusError) {
        console.error('Error fetching read statuses:', readStatusError);
    }

    const readMessageIds = new Set(readStatuses?.map(s => s.message_id) || []);
    
    const convos: Conversation[] = otherParticipants.map(p => {
        const lastMessage = lastMessageMap.get(p.conversation_id) || null;
        return {
            id: p.conversation_id,
            // @ts-ignore
            other_user: p.profiles,
            last_message: lastMessage ? {
                content: lastMessage.content,
                media_type: lastMessage.media_type,
                created_at: lastMessage.created_at,
                sender_id: lastMessage.sender_id,
                is_seen: readMessageIds.has(lastMessage.id) || lastMessage.sender_id === user.id,
            } : null,
        }
    }).sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
    });

    setConversations(convos);
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

    const channel = supabase
      .channel('public:direct_messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'direct_messages' },
        (payload) => {
            // A bit inefficient to refetch all, but it's the simplest way to ensure correctness
            fetchConversations(currentUser);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase, fetchConversations]);

  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4">
          <h1 className="text-xl font-bold">Chats</h1>
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
                const lastMessage = convo.last_message;
                const isUnread = lastMessage && lastMessage.sender_id !== currentUser?.id && !lastMessage.is_seen;
                let lastMessagePreview = "No messages yet";

                if (lastMessage) {
                  let text = "";
                   if (lastMessage.content) {
                        text = lastMessage.content;
                   } else if (lastMessage.media_type) {
                        text = `Sent a ${lastMessage.media_type}`;
                   }
                  if(lastMessage.sender_id === currentUser?.id) {
                     lastMessagePreview = `You: ${text}`;
                  } else {
                     lastMessagePreview = text;
                  }
                }

                return (
                  <Link href={`/chat/${convo.other_user.id}`} key={convo.id}>
                    <div className="p-4 flex items-center gap-4 hover:bg-muted/50">
                      <div className="relative">
                        <Avatar className="h-14 w-14" profile={convo.other_user}/>
                        <PresenceIndicator user={convo.other_user} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between">
                           <p className="font-semibold">{convo.other_user.full_name}</p>
                           {lastMessage && <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}</p>}
                        </div>
                        <p className={`text-sm truncate ${isUnread ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                           {lastMessagePreview}
                        </p>
                      </div>
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
