
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
): Promise<{ id: string, pinned_message_id: string | null } | { error: string }> {
    
    // 1. Find existing conversation between the two users
    try {
        const { data: userConvos, error: userConvosError } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

        if (userConvosError) throw userConvosError;
        if (!userConvos) {
             // This should not happen if user is logged in
             return { error: "Could not fetch user conversations." };
        }

        const convoIds = userConvos.map(c => c.conversation_id);

        if (convoIds.length > 0) {
            const { data: otherUserConvos, error: otherUserConvosError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', otherUserId)
                .in('conversation_id', convoIds);
            
            if (otherUserConvosError) throw otherUserConvosError;

            // Find a matching conversation ID
            if (otherUserConvos && otherUserConvos.length > 0) {
                 const matchingConvoId = userConvos.find(uc => 
                    otherUserConvos.some(ouc => ouc.conversation_id === uc.conversation_id)
                 )?.conversation_id;

                 if (matchingConvoId) {
                    const { data: convoDetails, error: convoDetailsError } = await supabase
                        .from('conversations')
                        .select('id, pinned_message_id, conversation_participants(count)')
                        .eq('id', matchingConvoId)
                        .single();
                    
                    if (convoDetailsError) throw convoDetailsError;
                    
                    // @ts-ignore
                    if (convoDetails.conversation_participants[0].count === 2) {
                         return { id: convoDetails.id, pinned_message_id: convoDetails.pinned_message_id };
                    }
                 }
            }
        }
    } catch(e: any) {
        return { error: "Error finding existing conversation: " + e.message };
    }


    // 2. Create new conversation if none exists
    const { data: newConvo, error: newConvoError } = await supabase
        .from('conversations')
        .insert({})
        .select('id, pinned_message_id')
        .single();
    
    if (newConvoError) return { error: newConvoError.message };

    // 3. Add participants
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

    return newConvo;
}


async function getOrCreateSelfConversation(
    supabase: ReturnType<typeof createClient>,
    currentUser: { id: string }
): Promise<{ id: string, pinned_message_id: string | null } | { error: string }> {
     try {
        const { data: userConvos, error: userConvosError } = await supabase
            .from('conversation_participants')
            .select('conversation:conversation_id(id, pinned_message_id)')
            .eq('user_id', currentUser.id);

        if (userConvosError) throw userConvosError;
        if (!userConvos) return { error: "Could not fetch user conversations." };

        const convoIds = userConvos.map(c => c.conversation?.id).filter(Boolean) as string[];
        
        if (convoIds.length > 0) {
            const { data: convoParticipants, error: participantsError } = await supabase
                .from('conversation_participants')
                .select('conversation_id, user_id')
                .in('conversation_id', convoIds);
            
            if (participantsError) throw participantsError;
            
            const conversationCounts: Record<string, number> = {};
            for (const participant of convoParticipants) {
                conversationCounts[participant.conversation_id] = (conversationCounts[participant.conversation_id] || 0) + 1;
            }
            
            for (const convo of userConvos) {
                if(convo.conversation && conversationCounts[convo.conversation.id] === 1) {
                    return { id: convo.conversation.id, pinned_message_id: convo.conversation.pinned_message_id };
                }
            }
        }
    } catch(e: any) {
        return { error: "Error finding self conversation: " + e.message };
    }

    // Create new self-conversation if none exists
    const { data: newConvo, error: newConvoError } = await supabase
        .from('conversations')
        .insert({})
        .select('id, pinned_message_id')
        .single();
    
    if (newConvoError) return { error: newConvoError.message };

    const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: newConvo.id, user_id: currentUser.id });
    
    if(participantsError) {
        await supabase.from('conversations').delete().eq('id', newConvo.id);
        return { error: participantsError.message };
    }

    return newConvo;
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
    .select('id, username, full_name, avatar_url, last_seen, show_active_status, is_verified, active_conversation_id')
    .eq('id', otherUserId)
    .single();

  if (otherUserError) {
    const initialData = { otherUser: null, conversationId: null, messages: [], isBlocked, isBlockedBy, error: `User with ID ${otherUserId} not found.`, pinnedMessage: null };
    return <ChatPageContent params={params} initialData={initialData} />;
  }
  
  if (isSelfChat) {
     otherUserData.full_name = 'Saved Messages';
     otherUserData.username = 'saved';
  }


  // Get or create conversation
  const convoResult = isSelfChat 
    ? await getOrCreateSelfConversation(supabase, currentUser)
    : await getOrCreateConversation(supabase, currentUser, otherUserId);
  
  if ('error' in convoResult) {
      const initialData = { otherUser: otherUserData, conversationId: null, messages: [], isBlocked, isBlockedBy, error: convoResult.error || 'Could not start conversation.', pinnedMessage: null };
      return <ChatPageContent params={params} initialData={initialData} />;
  }

  const { id: conversationId, pinned_message_id: pinnedMessageId } = convoResult;


  // Fetch messages
  const { data: messagesData, error: messagesError } = await supabase
    .from('direct_messages')
    .select('*, profiles:sender_id(*), direct_message_reactions(*, profiles:user_id(*)), parent_message:parent_message_id(content, media_type, profiles:sender_id(full_name))')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    const initialData = { otherUser: otherUserData, conversationId, messages: [], isBlocked, isBlockedBy, error: messagesError.message, pinnedMessage: null };
    return <ChatPageContent params={params} initialData={initialData} />;
  }
  
    // Fetch pinned message details
    let pinnedMessage = null;
    if (pinnedMessageId) {
        const { data: pinnedData, error: pinnedError } = await supabase
            .from('direct_messages')
            .select('id, content, media_type, profiles:sender_id(*)')
            .eq('id', pinnedMessageId)
            .single();
        if (!pinnedError && pinnedData) {
            pinnedMessage = pinnedData;
        }
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
    pinnedMessage,
  };

  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
      <ChatPageContent params={params} initialData={initialData} />
    </Suspense>
  );
}
