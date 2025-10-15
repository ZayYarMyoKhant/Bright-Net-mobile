
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
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

export default function CheckerChooseOpponentPage() {
    const [friends, setFriends] = useState<Profile[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRequesting, setIsRequesting] = useState<string | null>(null); // Store opponent ID
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
            
            const { data: followingData, error: followingError } = await supabase
                .from('followers')
                .select('profiles!followers_user_id_fkey(*)')
                .eq('follower_id', user.id);

            if (followingError) {
                console.error("Error fetching friends:", followingError);
                toast({ variant: 'destructive', title: 'Error fetching friends' });
            } else if (followingData) {
                const friendProfiles = followingData.map((f: any) => f.profiles).filter(p => p && p.username);
                setFriends(friendProfiles as Profile[]);
            }

            setLoading(false);
        };
        fetchUserAndFriends();
    }, [supabase, router, toast]);

    const handleRequestGame = async (opponentId: string) => {
        if (!currentUser) return;
        setIsRequesting(opponentId);

        // NOTE: This part needs to be implemented. 
        // We will create a 'checker_games' table and a request flow similar to XO Game.
        toast({ title: "Coming Soon!", description: "Checker game is under construction."});
        console.log(`Requesting checker game with ${opponentId}`);
        // Example of what it would look like:
        /*
        const { data, error } = await supabase
            .from('checker_games')
            .insert({
                player1_id: currentUser.id,
                player2_id: opponentId,
                status: 'requesting',
            })
            .select('id')
            .single();
        
        if (error) {
            toast({ variant: 'destructive', title: 'Could not start game', description: error.message });
        } else if (data) {
            router.push(`/bliss-zone/checker-game/requesting/${data.id}`);
        }
        */
        setIsRequesting(null);

    };

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/bliss-zone" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3 mx-auto">
                     <Swords className="h-6 w-6 text-blue-500" />
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
                                <Avatar className="h-12 w-12" profile={friend} />
                                <div className="flex-1">
                                    <p className="font-semibold">{friend.full_name}</p>
                                    <p className="text-sm text-muted-foreground">@{friend.username}</p>
                                </div>
                                <Button onClick={() => handleRequestGame(friend.id)} disabled={!!isRequesting}>
                                    {isRequesting === friend.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Challenge'}
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                        <Users className="h-12 w-12 mb-4" />
                        <p className="font-bold">No friends to play with</p>
                        <p className="text-sm mt-1">Follow some users to challenge them!</p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
