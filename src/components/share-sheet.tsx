
"use client";

import { useState, useEffect } from "react";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { SheetHeader, SheetTitle } from "./ui/sheet";
import { Send, Loader2, Users, Bookmark } from "lucide-react";
import { Post, Profile } from "@/lib/data";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ShareSheetProps = {
  post: Post;
  currentUser: User | null;
}

async function getOrCreateConversationForSharing(supabase: ReturnType<typeof createClient>, currentUserId: string, otherUserId: string): Promise<string | null> {
    const isSelfChat = currentUserId === otherUserId;

    // 1. Find existing conversation
    const { data: userConvosData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

    if (userConvosData && userConvosData.length > 0) {
        const convoIds = userConvosData.map(c => c.conversation_id);
        
        const { data: participants } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id')
            .in('conversation_id', convoIds);

        if (participants) {
            const convoParticipantMap: { [key: string]: string[] } = {};
            for (const p of participants) {
                if (!convoParticipantMap[p.conversation_id]) {
                    convoParticipantMap[p.conversation_id] = [];
                }
                convoParticipantMap[p.conversation_id].push(p.user_id);
            }

            for (const convoId in convoParticipantMap) {
                const participantIds = convoParticipantMap[convoId];
                const isCorrectChat = isSelfChat
                    ? participantIds.length === 1 && participantIds[0] === currentUserId
                    : participantIds.length === 2 && participantIds.includes(currentUserId) && participantIds.includes(otherUserId);
                
                if (isCorrectChat) {
                    return convoId;
                }
            }
        }
    }

    // 2. If no conversation exists, create a new one
    const { data: newConvo, error: newConvoError } = await supabase
        .from('conversations')
        .insert({})
        .select('id')
        .single();
    
    if (newConvoError) {
        console.error("Error creating new conversation:", newConvoError);
        return null;
    }

    const participantsToInsert = [{ conversation_id: newConvo.id, user_id: currentUserId }];
    if (!isSelfChat) {
        participantsToInsert.push({ conversation_id: newConvo.id, user_id: otherUserId });
    }

    const { error: participantsError } = await supabase.from('conversation_participants').insert(participantsToInsert);
    
    if (participantsError) {
        console.error("Error inserting participants:", participantsError);
        // Cleanup created conversation if participant insertion fails
        await supabase.from('conversations').delete().eq('id', newConvo.id);
        return null;
    }

    return newConvo.id;
}


export function ShareSheet({ post, currentUser }: ShareSheetProps) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [shareToSaved, setShareToSaved] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      };
      
      const { data, error } = await supabase
        .from('followers')
        .select('profiles!followers_user_id_fkey(*)')
        .eq('follower_id', currentUser.id);

      if (error) {
        console.error("Error fetching friends:", error);
      } else {
        const followingProfiles = data.map((item: any) => item.profiles).filter(Boolean);
        setFriends(followingProfiles as Profile[]);
      }
      setLoading(false);
    }
    fetchFriends();
  }, [currentUser, supabase]);


  const handleSelectFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(friendId => friendId !== id) : [...prev, id]
    );
  };

  const handleShare = async () => {
    if (!currentUser || (selectedFriends.length === 0 && !shareToSaved)) return;
    setSending(true);

    try {
        const shareTargets = [...selectedFriends];
        if (shareToSaved) {
            shareTargets.push(currentUser.id); // Add self for saved messages
        }

        for (const friendId of shareTargets) {
            const conversationId = await getOrCreateConversationForSharing(supabase, currentUser.id, friendId);

            if (!conversationId) {
                 throw new Error(`Could not get or create a conversation with user ${friendId}`);
            }
            
            const { error: messageError } = await supabase.from('direct_messages').insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: post.caption,
                media_url: post.media_url,
                media_type: post.media_type,
                is_shared_post: true
            });

            if (messageError) {
                throw new Error(`Could not send message to user ${friendId}: ${messageError.message}`);
            }
        }
        
        toast({
            title: "Shared Successfully!",
            description: `Your post has been sent.`
        });

    } catch (error) {
        console.error("Sharing failed:", error);
        toast({
            variant: "destructive",
            title: "Sharing Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setSending(false);
        setSelectedFriends([]);
        setShareToSaved(false);
        // A bit of a hack to close the sheet, but it works
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }
  };

  return (
    <>
      <SheetHeader className="h-12 flex-shrink-0 items-center justify-center border-b px-4 relative text-center">
        <SheetTitle>Share to</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary rounded-md flex items-center justify-center">
                    <Bookmark className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold">Saved Messages</p>
                </div>
                <Checkbox 
                    id="saved-messages"
                    checked={shareToSaved}
                    onCheckedChange={(checked) => setShareToSaved(!!checked)}
                    className="h-6 w-6"
                />
            </div>
            {loading ? (
            <div className="flex justify-center items-center h-full pt-10">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            ) : friends.length > 0 ? (
            <>
                {friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-4">
                    <Avatar className="h-10 w-10" profile={friend}>
                    </Avatar>
                    <div className="flex-1">
                        <p className={cn("font-semibold", friend.is_verified && "text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md px-2 py-1 inline-block")}>{friend.full_name || friend.username}</p>
                    </div>
                    <Checkbox 
                        id={`friend-${friend.id}`}
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => handleSelectFriend(friend.id)}
                        className="h-6 w-6"
                    />
                </div>
                ))}
            </>
            ) : (
                <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-10">
                    <Users className="h-12 w-12 mb-4" />
                    <p className="font-bold">You're not following anyone</p>
                    <p className="text-sm mt-1">Follow some people to share posts with them.</p>
                </div>
            )}
        </div>
      </ScrollArea>
      <footer className="flex-shrink-0 border-t p-4">
        <Button className="w-full" disabled={(selectedFriends.length === 0 && !shareToSaved) || sending} onClick={handleShare}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send
        </Button>
      </footer>
    </>
  );
}
