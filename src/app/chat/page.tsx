
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const chats = [
    {
      id: "aungaung",
      name: "Aung Aung",
      avatar: "https://i.pravatar.cc/150?u=aungaung",
      lastMessage: "ပို့ထားတဲ့နောက်ဆုံးစာ",
      status: "Active 1h ago",
      online: false,
    },
    {
      id: "susu",
      name: "Su Su",
      avatar: "https://i.pravatar.cc/150?u=susu",
      lastMessage: "ပို့ထားတဲ့နောက်ဆုံးစာ",
      status: "Active Now",
      online: true,
    },
    {
      id: "myomyint",
      name: "Myo Myint",
      avatar: "https://i.pravatar.cc/150?u=myomyint",
      lastMessage: "ပို့ထားတဲ့နောက်ဆုံးစာ",
      status: "Active 1m ago",
      online: false,
    },
    {
      id: "thuzar",
      name: "Thuzar",
      avatar: "https://i.pravatar.cc/150?u=thuzar",
      lastMessage: "ပို့ထားတဲ့နောက်ဆုံးစာ",
      status: "Active yesterday",
      online: false,
    },
     {
      id: "kyawkyaw",
      name: "Kyaw Kyaw",
      avatar: "https://i.pravatar.cc/150?u=kyawkyaw",
      lastMessage: "ပို့ထားတဲ့နောက်ဆုံးစာ",
      status: "Active 2d ago",
      online: false,
    },
  ];

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); // Prevents the parent Link from firing
    router.push(`/profile/${userId}`);
  };

  return (
    <>
    <div className="flex h-full flex-col bg-background text-foreground pb-16">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-xl font-bold">Chat</h1>
      </header>
      
      <div className="flex-shrink-0 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search" className="pl-10" />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {chats.map((chat) => (
            <Link href={`/chat/${chat.id}`} key={chat.id} className="block">
                <div className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer">
                  <div className="relative" onClick={(e) => handleProfileClick(e, chat.id)}>
                      <Avatar className="h-14 w-14">
                      <AvatarImage src={chat.avatar} alt={chat.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {chat.online && (
                          <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background"></span>
                      )}
                  </div>
                  <div className="flex-1">
                      <p className="font-semibold">{chat.name}</p>
                      <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
                  </div>
                  <p className="text-xs text-muted-foreground self-start">{chat.status}</p>
                </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
    <BottomNav/>
    </>
  );
}
