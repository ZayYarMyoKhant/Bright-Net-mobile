
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { SheetHeader, SheetTitle } from "./ui/sheet";
import { Send } from "lucide-react";

const friends = [
  {
    id: 'susu',
    username: "Su Su",
    avatar: "https://i.pravatar.cc/150?u=susu",
  },
  {
    id: 'myomyint',
    username: "Myo Myint",
    avatar: "https://i.pravatar.cc/150?u=myomyint",
  },
  {
    id: 'thuzar',
    username: "Thuzar",
    avatar: "https://i.pravatar.cc/150?u=thuzar",
  },
   {
    id: 'kyawkyaw',
    username: "Kyaw Kyaw",
    avatar: "https://i.pravatar.cc/150?u=kyawkyaw",
  },
   {
    id: 'aungaung',
    username: "Aung Aung",
    avatar: "https://i.pravatar.cc/150?u=aungaung",
  },
];

export function ShareSheet() {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const handleSelectFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(friendId => friendId !== id) : [...prev, id]
    );
  };

  const handleShare = () => {
    console.log("Sharing with:", selectedFriends);
    // Add sharing logic here
  };

  return (
    <>
      <SheetHeader className="h-12 flex-shrink-0 items-center justify-center border-b px-4 relative text-center">
        <SheetTitle>Share to</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {friends.map((friend) => (
             <div key={friend.id} className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar} data-ai-hint="person portrait" />
                    <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold">{friend.username}</p>
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
      </ScrollArea>
      <footer className="flex-shrink-0 border-t p-4">
        <Button className="w-full" disabled={selectedFriends.length === 0} onClick={handleShare}>
            Share
            <Send className="ml-2 h-4 w-4" />
        </Button>
      </footer>
    </>
  );
}
