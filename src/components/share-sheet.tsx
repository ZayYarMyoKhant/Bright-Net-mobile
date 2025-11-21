
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { SheetHeader, SheetTitle } from "./ui/sheet";
import { Send, Loader2, Users, Bookmark } from "lucide-react";
import { Post, Profile } from "@/lib/data";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type ShareSheetProps = {
  post: Post;
  currentUser: User | null;
}

export function ShareSheet({ post, currentUser }: ShareSheetProps) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [shareToSaved, setShareToSaved] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

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
            const { data: convos, error: convoError } = await supabase.rpc('get_or_create_conversation', { user_2_id: friendId });
            if (convoError || !convos || convos.length === 0) {
                throw new Error(`Could not get conversation with friend ${friendId}: ${convoError?.message}`);
            }
            const conversationId = convos[0].id;
            
            const { error: messageError } = await supabase.from('direct_messages').insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: post.caption,
                media_url: post.media_url,
                media_type: post.media_type,
                is_shared_post: true
            });
            if (messageError) {
                throw new Error(`Could not send message to friend ${friendId}: ${messageError.message}`);
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
                    onCheckedChange={() => setShareToSaved(!shareToSaved)}
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
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatar_url} data-ai-hint="person portrait" />
                        <AvatarFallback>{friend.username ? friend.username.charAt(0).toUpperCase() : '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold">{friend.full_name || friend.username}</p>
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
