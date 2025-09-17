
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";

type Conversation = {
  conversation_id: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
  };
  last_message: {
    content: string | null;
    media_type: string | null;
    created_at: string;
  } | null;
};

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndConversations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signup');
        return;
      }
      setCurrentUser(user);

      // Fetch conversations for the current user
      const { data: convosData, error: convosError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (convosError) {
        console.error("Error fetching conversations:", convosError);
        setLoading(false);
        return;
      }

      const convoIds = convosData.map(c => c.conversation_id);
      if (convoIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch other participants and last message for each conversation
      const convoPromises = convoIds.map(async (convoId) => {
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('profiles(*)')
          .eq('conversation_id', convoId)
          .neq('user_id', user.id)
          .single();

        if (participantError || !participantData.profiles) return null;

        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('direct_messages')
          .select('content, media_type, created_at')
          .eq('conversation_id', convoId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          conversation_id: convoId,
          other_user: participantData.profiles as any,
          last_message: lastMessageData,
        };
      });

      const resolvedConvos = (await Promise.all(convoPromises)).filter(Boolean) as Conversation[];
      resolvedConvos.sort((a, b) => {
          if (!a.last_message) return 1;
          if (!b.last_message) return -1;
          return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
      });

      setConversations(resolvedConvos);
      setLoading(false);
    };

    fetchUserAndConversations();
    
    // Setup realtime subscription
    const channel = supabase.channel('public:direct_messages').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'direct_messages' },
      (payload) => {
        console.log('Realtime change received!', payload);
        fetchUserAndConversations(); // Refetch all on change
      }
    ).subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }

  }, [supabase, router]);

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); // Prevents the parent Link from firing
    router.push(`/profile/${userId}`);
  };

  const getLastMessageDisplay = (msg: Conversation['last_message']) => {
    if (!msg) return "No messages yet";
    if (msg.content) return msg.content;
    if (msg.media_type) return `Sent a ${msg.media_type}`;
    return "No content";
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
                <p className="text-sm mt-1">Find someone on their profile to start a conversation!</p>
            </div>
          ) : (
            <div className="divide-y">
              {conversations.map((chat) => (
                <Link href={`/chat/${chat.other_user.id}`} key={chat.conversation_id}>
                  <div className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer">
                    <div className="relative" onClick={(e) => handleProfileClick(e, chat.other_user.id)}>
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={chat.other_user.avatar_url} alt={chat.other_user.username} data-ai-hint="person portrait" />
                        <AvatarFallback>{chat.other_user.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {/* Add online status logic if available */}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold truncate">{chat.other_user.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{getLastMessageDisplay(chat.last_message)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground self-start shrink-0">
                      {chat.last_message ? formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true }) : ''}
                    </p>
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
