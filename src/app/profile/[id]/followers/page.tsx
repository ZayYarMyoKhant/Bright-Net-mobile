
"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

type FollowerProfile = Profile & { is_following_back: boolean };

export default function FollowersPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const [profileUsername, setProfileUsername] = useState("");
    const [followers, setFollowers] = useState<FollowerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const fetchFollowers = useCallback(async (currentUserId: string | undefined) => {
        setLoading(true);

        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", params.id)
            .single();

        if (profileError || !profileData) {
            toast({ variant: "destructive", title: "Profile not found" });
            router.push("/home");
            return;
        }
        setProfileUsername(profileData.username);

        const { data, error } = await supabase.rpc('get_followers_with_follow_status', {
            profile_id: params.id,
            current_user_id: currentUserId
        });

        if (error) {
            toast({ variant: "destructive", title: "Error fetching followers" });
            console.error(error);
            setFollowers([]);
        } else {
            setFollowers(data as FollowerProfile[]);
        }
        setLoading(false);
    }, [params.id, supabase, toast, router]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUser(user);
            fetchFollowers(user?.id);
        });
    }, [fetchFollowers, supabase.auth]);
    
    const handleFollowToggle = async (targetId: string, isCurrentlyFollowing: boolean) => {
        if (!currentUser) return;

        // Optimistically update UI
        setFollowers(followers.map(f => f.id === targetId ? {...f, is_following_back: !isCurrentlyFollowing} : f));

        if (isCurrentlyFollowing) {
            // Unfollow
            const { error } = await supabase.from('followers').delete().match({ user_id: targetId, follower_id: currentUser.id });
            if (error) {
                toast({ variant: 'destructive', title: 'Failed to unfollow'});
                // Revert on error
                setFollowers(followers.map(f => f.id === targetId ? {...f, is_following_back: true} : f));
            }
        } else {
            // Follow
            const { error } = await supabase.from('followers').insert({ user_id: targetId, follower_id: currentUser.id });
             if (error) {
                toast({ variant: 'destructive', title: 'Failed to follow'});
                // Revert on error
                setFollowers(followers.map(f => f.id === targetId ? {...f, is_following_back: false} : f));
            }
        }
    }


    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-bold text-lg">{profileUsername ? `@${profileUsername}` : "..."}</h1>
                <div className="w-10"></div>
            </header>

            <Tabs defaultValue="followers" onValueChange={(value) => value === 'following' && router.push(`/profile/${params.id}/following`)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none h-12">
                    <TabsTrigger value="following" className="text-base">Following</TabsTrigger>
                    <TabsTrigger value="followers" className="text-base">Followers</TabsTrigger>
                </TabsList>
            </Tabs>

            <main className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center pt-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : followers.length > 0 ? (
                    <div className="divide-y">
                        {followers.map(user => (
                            <div key={user.id} className="p-4 flex items-center gap-4">
                                <Link href={`/profile/${user.id}`} className="flex-1 flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={user.avatar_url} alt={user.username} data-ai-hint="person portrait" />
                                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.full_name}</p>
                                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                                    </div>
                                </Link>
                                 {currentUser?.id !== user.id && (
                                     <Button 
                                        variant={user.is_following_back ? "outline" : "default"}
                                        onClick={() => handleFollowToggle(user.id, user.is_following_back)}
                                     >
                                        {user.is_following_back ? "Following" : "Follow"}
                                     </Button>
                                 )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                        <UserX className="h-12 w-12 mb-4" />
                        <p className="font-bold">No followers yet</p>
                        <p className="text-sm mt-1">When someone follows them, they'll appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
