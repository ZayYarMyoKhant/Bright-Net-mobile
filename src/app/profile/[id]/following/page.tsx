
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UserX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

type FollowingProfile = Profile & { is_also_following: boolean };


export default function FollowingPage({ params }: { params: { id: string } }) {
    const profileId = params.id;
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    
    const [profileUsername, setProfileUsername] = useState("");
    const [following, setFollowing] = useState<FollowingProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

     const fetchFollowing = useCallback(async (currentUserId: string | undefined) => {
        setLoading(true);

        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", profileId)
            .single();
            
        if (profileError || !profileData) {
            toast({ variant: "destructive", title: "Profile not found" });
            router.push("/home");
            return;
        }
        setProfileUsername(profileData.username);

        // 1. Fetch all users the profile is following
        const { data: followingData, error: followingError } = await supabase
            .from('followers')
            .select('profiles!followers_user_id_fkey(*)')
            .eq('follower_id', profileId);
            
        if (followingError) {
             toast({ variant: "destructive", title: "Error fetching following list" });
             console.error(followingError);
             setFollowing([]);
             setLoading(false);
             return;
        }
        
        // @ts-ignore
        const followingProfiles: Profile[] = followingData.map(f => f.profiles);

        if (followingProfiles.length === 0 || !currentUserId) {
            setFollowing(followingProfiles.map(p => ({ ...p, is_also_following: false })));
            setLoading(false);
            return;
        }

        // 2. Check which of these users the current user is also following
        const followingIds = followingProfiles.map(p => p.id);
        const { data: followingBackData, error: followingBackError } = await supabase
            .from('followers')
            .select('user_id')
            .eq('follower_id', currentUserId)
            .in('user_id', followingIds);
        
        if (followingBackError) {
            toast({ variant: "destructive", title: "Error checking follow status" });
            setFollowing(followingProfiles.map(p => ({ ...p, is_also_following: false })));
        } else {
             const followingBackIds = new Set(followingBackData.map(f => f.user_id));
             const combinedData = followingProfiles.map(p => ({
                ...p,
                is_also_following: followingBackIds.has(p.id),
            }));
            setFollowing(combinedData);
        }

        setLoading(false);
    }, [profileId, supabase, toast, router]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUser(user);
            fetchFollowing(user?.id);
        });
    }, [fetchFollowing, supabase.auth]);

    const handleFollowToggle = async (targetId: string, isCurrentlyFollowing: boolean) => {
        if (!currentUser) return;
        
        // Optimistically update UI
        setFollowing(following.map(f => f.id === targetId ? {...f, is_also_following: !isCurrentlyFollowing} : f));

        if (isCurrentlyFollowing) {
            // Unfollow
            const { error } = await supabase.from('followers').delete().match({ user_id: targetId, follower_id: currentUser.id });
            if (error) {
                toast({ variant: 'destructive', title: 'Failed to unfollow'});
                // Revert on error
                setFollowing(prev => prev.map(f => f.id === targetId ? {...f, is_also_following: true} : f));
            }
        } else {
            // Follow
            const { error } = await supabase.from('followers').insert({ user_id: targetId, follower_id: currentUser.id });
             if (error) {
                toast({ variant: 'destructive', title: 'Failed to follow'});
                // Revert on error
                setFollowing(prev => prev.map(f => f.id === targetId ? {...f, is_also_following: false} : f));
            }
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-bold text-lg">{profileUsername ? `@${profileUsername}` : "..."}</h1>
                <div className="w-10"></div>
            </header>

            <Tabs defaultValue="following" onValueChange={(value) => value === 'followers' && router.push(`/profile/${profileId}/followers`)} className="w-full">
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
                ) : following.length > 0 ? (
                    <div className="divide-y">
                        {following.map(user => (
                            <div key={user.id} className="p-4 flex items-center gap-4">
                               <Link href={`/profile/${user.id}`} className="flex-shrink-0">
                                    <Avatar className="h-12 w-12" profile={user}>
                                    </Avatar>
                                </Link>
                                <Link href={`/profile/${user.id}`} className="flex-1">
                                    <div>
                                        <p className="font-semibold">{user.full_name}</p>
                                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                                    </div>
                                </Link>
                                {currentUser?.id !== user.id && (
                                     <Button 
                                        variant={user.is_also_following ? "outline" : "default"}
                                        onClick={() => handleFollowToggle(user.id, user.is_also_following)}
                                     >
                                        {user.is_also_following ? "Following" : "Follow"}
                                     </Button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                        <UserX className="h-12 w-12 mb-4" />
                        <p className="font-bold">Not following anyone yet</p>
                        <p className="text-sm mt-1">When they follow people, they'll appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
