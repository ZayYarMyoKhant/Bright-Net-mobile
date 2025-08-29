
"use client";

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from 'react';


const initialBlockedUsers = [
  {
    id: 'myomyint',
    name: "Myo Myint",
    avatar: "https://i.pravatar.cc/150?u=myomyint",
  },
  {
    id: 'thuzar',
    name: "Thuzar",
    avatar: "https://i.pravatar.cc/150?u=thuzar",
  },
];


export default function BlockedAccountsPage() {
    const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers);

    const handleUnblock = (userId: string) => {
        setBlockedUsers(prev => prev.filter(user => user.id !== userId));
    };

    return (
        <div className="flex h-full flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/profile/settings" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">Blocked Accounts</h1>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="divide-y">
                    {blockedUsers.map((user) => (
                        <div key={user.id} className="p-4 flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{user.name}</p>
                            </div>
                            <Button variant="outline" onClick={() => handleUnblock(user.id)}>
                                Unblock
                            </Button>
                        </div>
                    ))}
                </div>
                 {blockedUsers.length === 0 && (
                    <div className="text-center p-10 text-muted-foreground">
                        <p>You haven't blocked any accounts.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
