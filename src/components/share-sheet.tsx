
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { SheetHeader, SheetTitle } from "./ui/sheet";
import { Send, Loader2, Users } from "lucide-react";
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
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .not('id', 'eq', currentUser.id); 
      
      if (error) {
        console.error("Error fetching friends:", error);
      } else {
        setFriends(data as Profile[]);
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
    if (!currentUser || selectedFriends.length === 0) return;
    setSending(true);

    try {
        for (const friendId of selectedFriends) {
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
                is_shared_post: true // Use the new boolean flag
            });
            if (messageError) {
                throw new Error(`Could not send message to friend ${friendId}: ${messageError.message}`);
            }
        }
        
        toast({
            title: "Shared Successfully!",
            description: `Your post has been sent to ${selectedFriends.length} friend(s).`
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
        // This is a bit of a hack to close the sheet. A better way would be to control the sheet's open state from a parent component.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }
  };

  return (
    <>
      <SheetHeader className="h-12 flex-shrink-0 items-center justify-center border-b px-4 relative text-center">
        <SheetTitle>Share to</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1">
        {loading ? (
           <div className="flex justify-center items-center h-full pt-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : friends.length > 0 ? (
          <div className="p-4 space-y-4">
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
          </div>
        ) : (
            <div className="text-center p-10 text-muted-foreground flex flex-col items-center">
                <Users className="h-12 w-12 mb-4" />
                <p className="font-bold">No friends to share with</p>
                <p className="text-sm mt-1">When you have friends, they'll appear here.</p>
            </div>
        )}
      </ScrollArea>
      <footer className="flex-shrink-0 border-t p-4">
        <Button className="w-full" disabled={selectedFriends.length === 0 || sending} onClick={handleShare}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send
        </Button>
      </footer>
    </>
  );
}
