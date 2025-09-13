
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Loader2, Users, Swords } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

type Profile = {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
}

export default function TypingBattleSetupPage() {
    const [friends, setFriends] = useState<Profile[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRequesting, setIsRequesting] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const fetchUserAndFriends = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ variant: 'destructive', title: 'Not Authenticated' });
                router.push('/signup');
                return;
            }
            setCurrentUser(user);
            
            // Placeholder: Fetching all other users as "friends"
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, full_name')
                .not('id', 'eq', user.id);
            
            if (error) {
                console.error("Error fetching friends:", error);
                toast({ variant: 'destructive', title: 'Error fetching friends' });
            } else if (profiles) {
                // Filter out profiles that don't have a username to prevent errors.
                const validFriends = profiles.filter(p => p.username);
                setFriends(validFriends as Profile[]);
            }

            setLoading(false);
        };
        fetchUserAndFriends();
    }, [supabase, router, toast]);

    const handleRequestBattle = async (opponentId: string) => {
        if (!currentUser) return;
        setIsRequesting(true);

        const { data, error } = await supabase
            .from('typing_battles')
            .insert({
                player1_id: currentUser.id,
                player2_id: opponentId,
                status: 'requesting',
            })
            .select('id')
            .single();
        
        setIsRequesting(false);

        if (error) {
            console.error("Error creating battle:", error);
            toast({ variant: 'destructive', title: 'Could not start battle', description: error.message });
        } else if (data) {
            router.push(`/ai-tool/typing-battle/${data.id}/requesting`);
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/ai-tool" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3 mx-auto">
                    <Swords className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">Choose your opponent</h1>
                </div>
            </header>

            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-full pt-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : friends.length > 0 ? (
                    <div className="divide-y">
                        {friends.map(friend => (
                            <div key={friend.id} className="p-4 flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={friend.avatar_url} alt={friend.username} />
                                    <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{friend.full_name}</p>
                                    <p className="text-sm text-muted-foreground">@{friend.username}</p>
                                </div>
                                <Button onClick={() => handleRequestBattle(friend.id)} disabled={isRequesting}>
                                    {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Battle'}
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                        <Users className="h-12 w-12 mb-4" />
                        <p className="font-bold">No friends to battle</p>
                        <p className="text-sm mt-1">Find some friends to start a typing battle!</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
