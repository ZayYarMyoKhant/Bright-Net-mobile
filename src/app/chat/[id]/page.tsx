
// /src/app/chat/[id]/page.tsx
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Loader2 } from 'lucide-react';
import ChatPageContent from './ChatPageContent';

async function getOrCreateConversation(
    supabase: ReturnType<typeof createClient>,
    currentUser: { id: string },
    otherUserId: string
): Promise<{ id: string } | { error: string }> {
    
    // Self-chat (Saved Messages) case
    if (currentUser.id === otherUserId) {
        const { data: selfConvo, error: selfConvoError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

        if (selfConvoError) return { error: selfConvoError.message };

        const selfConvoIds = selfConvo.map(p => p.conversation_id);

        const { data: existing, error: existingError } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id')
            .in('conversation_id', selfConvoIds);

        if (existingError) return { error: existingError.message };

        const convoCounts: { [key: string]: number } = {};
        existing.forEach(p => {
            convoCounts[p.conversation_id] = (convoCounts[p.conversation_id] || 0) + 1;
        });

        const singleParticipantConvo = Object.keys(convoCounts).find(convoId => convoCounts[convoId] === 1);

        if (singleParticipantConvo) {
            return { id: singleParticipantConvo };
        }

    } else {
         // Find existing conversation between the two users
        const { data: existing_convos, error: rpcError } = await supabase.rpc('get_conversation_between_users', {
            user_id_1: currentUser.id,
            user_id_2: otherUserId
        });

        if (rpcError) {
             console.error("RPC error get_conversation_between_users: ", rpcError);
        }
        
        if (existing_convos && existing_convos.length > 0) {
            return { id: existing_convos[0].id };
        }
    }


    // Create new conversation if none exists
    const { data: newConvo, error: newConvoError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();
    
    if (newConvoError) return { error: newConvoError.message };

    // Add participants
    const participants = [{ conversation_id: newConvo.id, user_id: currentUser.id }];
    if (currentUser.id !== otherUserId) {
        participants.push({ conversation_id: newConvo.id, user_id: otherUserId });
    }

    const { error: participantsError } = await supabase.from('conversation_participants').insert(participants);
    if(participantsError) {
        // Attempt to clean up the created conversation if participant insertion fails
        await supabase.from('conversations').delete().eq('id', newConvo.id);
        return { error: participantsError.message };
    }

    return { id: newConvo.id };
}


// This is the Server Page component that handles the route.
export default async function ChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
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
    const initialData = { otherUser: null, conversationId: null, messages: [], isBlocked, isBlockedBy, error: `User with ID ${otherUserId} not found.` };
    return <ChatPageContent params={params} initialData={initialData} />;
  }
  
  if (isSelfChat) {
     otherUserData.full_name = 'Saved Messages';
     otherUserData.username = 'saved';
  }


  // Get or create conversation
  const convoResult = await getOrCreateConversation(supabase, currentUser, otherUserId);
  
  if ('error' in convoResult) {
      const initialData = { otherUser: otherUserData, conversationId: null, messages: [], isBlocked, isBlockedBy, error: convoResult.error || 'Could not start conversation.' };
      return <ChatPageContent params={params} initialData={initialData} />;
  }

  const conversationId = convoResult.id;


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
    
    if (messageIds.length > 0 && !isSelfChat) {
        const { data: readStatuses } = await supabase
            .from('direct_message_read_status')
            .select('message_id')
            .eq('user_id', otherUserId)
            .in('message_id', messageIds);

        if (readStatuses) {
            readMessageIds = new Set(readStatuses.map(s => s.message_id));
        }
    }


    const processedMessages = messagesData.map(msg => ({
        ...msg,
        is_seen_by_other: isSelfChat ? true : readMessageIds.has(msg.id)
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
