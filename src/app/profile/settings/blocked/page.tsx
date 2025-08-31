
"use client";

import { ArrowLeft, UserX } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from 'react';

// In a real app, this would be fetched from a 'blocks' table in Supabase
const initialBlockedUsers: any[] = [];


export default function BlockedAccountsPage() {
    const [blockedUsers, setBlockedUsers] = useState(initialBlockedUsers);

    const handleUnblock = (userId: string) => {
        // In a real app, this would call a server action to remove the block
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
                {blockedUsers.length > 0 ? (
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
                ) : (
                    <div className="text-center p-10 text-muted-foreground flex flex-col items-center">
                        <UserX className="h-12 w-12 mb-4" />
                        <p className="font-bold">No blocked users</p>
                        <p className="text-sm mt-1">When you block someone, they'll appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
