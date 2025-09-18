
"use client";

import { ArrowLeft, Loader2, UserX } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/data';

type BlockedUser = {
  blocked_id: string;
  profiles: Profile;
};

export default function BlockedAccountsPage() {
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const supabase = createClient();
    const { toast } = useToast();

    const fetchBlockedUsers = useCallback(async (user: User) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blocks')
            .select('blocked_id, profiles!blocks_blocked_id_fkey(*)')
            .eq('blocker_id', user.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching blocked users', description: error.message });
            setBlockedUsers([]);
        } else {
            setBlockedUsers(data as unknown as BlockedUser[]);
        }
        setLoading(false);
    }, [supabase, toast]);
    
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setCurrentUser(user);
                fetchBlockedUsers(user);
            }
        });
    }, [supabase, fetchBlockedUsers]);
    
     useEffect(() => {
        if (!currentUser) return;
        
        const channel = supabase.channel('blocked-users-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'blocks',
                filter: `blocker_id=eq.${currentUser.id}`
            }, (payload) => {
                fetchBlockedUsers(currentUser);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, supabase, fetchBlockedUsers]);


    const handleUnblock = async (blockedId: string) => {
        if (!currentUser) return;
        
        const { error } = await supabase.from('blocks').delete().match({ blocker_id: currentUser.id, blocked_id: blockedId });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to unblock', description: error.message });
        } else {
            toast({ title: 'User unblocked' });
            setBlockedUsers(prev => prev.filter(u => u.blocked_id !== blockedId));
        }
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
                 {loading ? (
                    <div className="flex items-center justify-center h-full pt-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                 ) : blockedUsers.length > 0 ? (
                    <div className="divide-y">
                        {blockedUsers.map((user) => (
                            <div key={user.blocked_id} className="p-4 flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.profiles.avatar_url} alt={user.profiles.username} data-ai-hint="person portrait" />
                                    <AvatarFallback>{user.profiles.username?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{user.profiles.full_name}</p>
                                    <p className="text-sm text-muted-foreground">@{user.profiles.username}</p>
                                </div>
                                <Button variant="outline" onClick={() => handleUnblock(user.blocked_id)}>
                                    Unblock
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                        <UserX className="h-12 w-12 mb-4" />
                        <p className="font-bold">No blocked users</p>
                        <p className="text-sm mt-1">When you block someone, they'll appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
