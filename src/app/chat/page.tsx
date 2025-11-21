
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

    // 1. Get all conversation IDs the user is a part of.
    const { data: userConvoLinks, error: convoLinksError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (convoLinksError) {
      console.error('Error fetching conversation links:', convoLinksError);
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationIds = userConvoLinks.map(link => link.conversation_id);

    if (conversationIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }
    
    // 2. Fetch all conversation details for those IDs
    const { data: convosData, error: convosError } = await supabase
        .from('conversations')
        .select(`
            id,
            is_group_chat,
            participants:conversation_participants (
                user_id,
                profiles (*)
            ),
            last_message:direct_messages (
                content,
                media_type,
                created_at,
                sender_id
            )
        `)
        .in('id', conversationIds)
        .order('created_at', { referencedTable: 'direct_messages', ascending: false })
        .limit(1, { referencedTable: 'direct_messages' });


    if (convosError) {
        console.error('Error fetching conversations:', convosError);
        setConversations([]);
        setLoading(false);
        return;
    }

    // 3. Check read status for all last messages in one go
    const lastMessageIds = convosData
        .map(c => c.last_message.length > 0 ? c.last_message[0].id : null)
        .filter(id => id !== null);

    let readMessageIds = new Set();
    if (lastMessageIds.length > 0) {
        const { data: readStatuses, error: readStatusError } = await supabase
            .from('direct_message_read_status')
            .select('message_id')
            .eq('user_id', user.id)
            .in('message_id', lastMessageIds as string[]);
        
        if (!readStatusError && readStatuses) {
            readMessageIds = new Set(readStatuses.map(s => s.message_id));
        }
    }


    const formattedConversations: Conversation[] = convosData
        .map(conversation => {
            if (!conversation) return null;
            
            if (conversation.is_group_chat === false) {
                 const participants = conversation.participants;
                 const selfParticipant = participants.find(p => p.user_id === user.id);
                 if (participants.length === 1 && selfParticipant) {
                     return {
                        id: conversation.id,
                        other_user: {
                            id: user.id,
                            username: 'saved_messages',
                            full_name: 'Saved Messages',
                            avatar_url: '',
                            last_seen: null,
                            show_active_status: false,
                        },
                        last_message: conversation.last_message[0] ? {
                            ...conversation.last_message[0],
                             is_seen: true,
                        } : null
                     }
                 }
            }


            const otherParticipant = conversation.participants.find(p => p.user_id !== user.id);
            if (!otherParticipant || !otherParticipant.profiles) return null;

            const lastMessage = conversation.last_message[0];
            const isSeen = lastMessage ? readMessageIds.has(lastMessage.id) : true;

            return {
                id: conversation.id,
                other_user: {
                    ...(otherParticipant.profiles as Profile),
                    last_seen: otherParticipant.profiles.last_seen,
                    show_active_status: otherParticipant.profiles.show_active_status
                },
                last_message: lastMessage ? {
                    content: lastMessage.content,
                    media_type: lastMessage.media_type,
                    created_at: lastMessage.created_at,
                    sender_id: lastMessage.sender_id,
                    is_seen: isSeen
                } : null
            };
        })
        .filter((c): c is Conversation => c !== null)
        .sort((a, b) => {
            if (a.other_user.username === 'saved_messages') return -1;
            if (b.other_user.username === 'saved_messages') return 1;
            if (!a.last_message) return 1;
            if (!b.last_message) return -1;
            return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
        });
        
    setConversations(formattedConversations);
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

    const changes = supabase.channel('public:direct_messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'direct_messages' },
        (payload) => {
            fetchConversations(currentUser);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${currentUser.id}` },
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
                if (!convo.other_user) return null; // Skip if other_user is null
                
                const isSavedMessages = convo.other_user.username === 'saved_messages';
                const lastMessage = convo.last_message;
                const isUnread = !isSavedMessages && lastMessage && lastMessage.sender_id !== currentUser?.id && !lastMessage.is_seen;
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
                           <p className="font-semibold">{convo.other_user.full_name}</p>
                           {lastMessage && <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}</p>}
                        </div>
                        <p className={`text-sm truncate ${isUnread ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                           {lastMessagePreview}
                        </p>
                      </div>
                       {isUnread && <div className="h-3 w-3 rounded-full bg-primary flex-shrink-0" />}
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

    