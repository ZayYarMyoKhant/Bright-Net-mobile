
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
    const { data, error } = await supabase
      .rpc('get_user_conversations', { p_user_id: user.id });

    if (error) {
      console.error('Error fetching conversations:', error);
    } else {
      setConversations(data as Conversation[]);
    }
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
                  if(lastMessage.sender_id === currentUser?.id) {
                     lastMessagePreview = `You: ${lastMessage.content || `sent a ${lastMessage.media_type}`}`;
                  } else {
                     lastMessagePreview = lastMessage.content || `Sent a ${lastMessage.media_type}`;
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
