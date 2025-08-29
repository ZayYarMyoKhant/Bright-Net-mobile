
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const incomingRequests = [
  {
    id: 1,
    name: "Su Su",
    avatar: "https://i.pravatar.cc/150?u=susu",
  },
  {
    id: 2,
    name: "Thuzar",
    avatar: "https://i.pravatar.cc/150?u=thuzar",
  },
];

const outgoingRequests = [
    {
        id: 3,
        name: "Myo Myint",
        avatar: "https://i.pravatar.cc/150?u=myomyint",
    }
]

export default function FriendRequestPage() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Link href="/profile" className="p-2 -ml-2 absolute left-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold mx-auto">Friend Request</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Tabs defaultValue="to_you" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none h-12">
            <TabsTrigger value="to_you" className="rounded-none text-base">Request to you</TabsTrigger>
            <TabsTrigger value="your_request" className="rounded-none text-base">Your Request</TabsTrigger>
          </TabsList>
          <TabsContent value="to_you">
            <div className="divide-y">
                {incomingRequests.map((req) => (
                    <div key={req.id} className="p-4 flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                            <AvatarImage src={req.avatar} alt={req.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{req.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{req.name}</p>
                            <p className="text-sm text-muted-foreground">Request to you</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="destructive">Decline</Button>
                            <Button size="sm">Accept</Button>
                        </div>
                    </div>
                ))}
            </div>
             {incomingRequests.length === 0 && (
                <div className="text-center p-10 text-muted-foreground">
                    <p>No incoming friend requests.</p>
                </div>
            )}
          </TabsContent>
          <TabsContent value="your_request">
            <div className="divide-y">
                {outgoingRequests.map((req) => (
                    <div key={req.id} className="p-4 flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                            <AvatarImage src={req.avatar} alt={req.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{req.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{req.name}</p>
                             <p className="text-sm text-muted-foreground">Request sent</p>
                        </div>
                        <Button size="sm" variant="outline">Cancel</Button>
                    </div>
                ))}
            </div>
            {outgoingRequests.length === 0 && (
                <div className="text-center p-10 text-muted-foreground">
                    <p>You haven't sent any friend requests.</p>
                </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
