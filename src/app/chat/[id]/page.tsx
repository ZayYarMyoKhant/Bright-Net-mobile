
// /src/app/chat/[id]/page.tsx
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Loader2 } from 'lucide-react';
import ChatPageContent from './ChatPageContent';

// This is the Server Page component that handles the route.
export default async function ChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient(cookies());
  const otherUserId = params.id;

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    // Or redirect to a login page
    return <div className="flex h-dvh w-full items-center justify-center"><p>Please log in to view chats.</p></div>;
  }
  
  const isSelfChat = currentUser.id === otherUserId;

  // Fetch block status
  const { data: blockData } = await supabase
    .from('blocks')
    .select('*')
    .or(`(blocker_id.eq.${currentUser.id},blocked_id.eq.${otherUserId}),(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUser.id})`);

  const isBlocked = blockData?.some(b => b.blocker_id === currentUser.id) ?? false;
  const isBlockedBy = blockData?.some(b => b.blocked_id === currentUser.id) ?? false;

  // Fetch other user's data (or own data for saved messages)
  const { data: otherUserData, error: otherUserError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, last_seen, show_active_status')
    .eq('id', otherUserId)
    .single();

  if (otherUserError) {
    const initialData = { otherUser: null, conversationId: null, messages: [], isBlocked, isBlockedBy, error: otherUserError.message };
    return <ChatPageContent params={params} initialData={initialData} />;
  }
  
  if (isSelfChat) {
     otherUserData.full_name = 'Saved Messages';
     otherUserData.username = 'saved';
  }


  // Get or create conversation
  const { data: convoData, error: convoError } = await supabase.rpc('get_or_create_conversation', { 
    p_user_2_id: otherUserId,
    p_is_self_chat: isSelfChat
  });

  if (convoError || !convoData) {
    const initialData = { otherUser: otherUserData, conversationId: null, messages: [], isBlocked, isBlockedBy, error: convoError?.message || 'Could not start conversation.' };
    return <ChatPageContent params={params} initialData={initialData} />;
  }
  const conversationId = convoData.id;

  // Fetch messages
  const { data: messagesData, error: messagesError } = await supabase
    .from('direct_messages')
    .select('*, profiles:sender_id(*), direct_message_reactions(*, profiles:user_id(*)), parent_message:parent_message_id(content, media_type, profiles:sender_id(full_name))')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    const initialData = { otherUser: otherUserData, conversationId, messages: [], isBlocked, isBlockedBy, error: messagesError.message };
    return <ChatPageContent params={params} initialData={initialData} />;
  }
  
    const messageIds = messagesData.map(msg => msg.id);
    let readMessageIds = new Set();
    
    if (messageIds.length > 0) {
        const { data: readStatuses } = await supabase
            .from('direct_message_read_status')
            .select('message_id')
            .eq('user_id', otherUserId)
            .in('message_id', messageIds);

        readMessageIds = new Set(readStatuses?.map(s => s.message_id) || []);
    }


    const processedMessages = messagesData.map(msg => ({
        ...msg,
        is_seen_by_other: readMessageIds.has(msg.id)
    }));


  const initialData = {
    otherUser: otherUserData,
    conversationId,
    messages: processedMessages,
    isBlocked,
    isBlockedBy,
    error: null,
  };

  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <ChatPageContent params={params} initialData={initialData} />
    </Suspense>
  );
}
