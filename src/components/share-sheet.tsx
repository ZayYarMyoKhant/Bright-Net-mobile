

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
      // This is a placeholder for actual friend logic.
      // Fetching all profiles for now.
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .not('id', 'eq', currentUser.id); // Exclude self
      
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
    if (!currentUser) return;
    setSending(true);

    const postUrl = `${window.location.origin}/post/${post.id}`; // Assuming a post page exists
    const messageContent = `Check out this post: ${postUrl}`;

    // This is a simplified share logic. In a real app, you'd create
    // new chat messages for each selected friend.
    console.log("Sharing with:", selectedFriends);
    console.log("Message:", messageContent);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Shared Successfully!",
      description: `Your post has been shared with ${selectedFriends.length} friend(s).`
    });

    setSending(false);
    setSelectedFriends([]);
    // Optionally close the sheet after sharing
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
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
                      <p className="font-semibold">{friend.username || 'Unknown User'}</p>
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
            Share
        </Button>
      </footer>
    </>
  );
}
