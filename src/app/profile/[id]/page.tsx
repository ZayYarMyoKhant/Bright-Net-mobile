
"use client";

import { use, useEffect, useState, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Clapperboard, ArrowLeft, MessageCircle, CameraOff, Loader2, MoreVertical, Trash2, GraduationCap, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Post, Profile } from "@/lib/data";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, isBefore, subMinutes } from "date-fns";

// This function is required for static export
export async function generateStaticParams() {
  return [];
}

type ProfileData = Profile & {
  following: number;
  followers: number;
  is_following: boolean;
  is_private: boolean;
  last_seen: string | null;
  show_active_status: boolean;
  is_in_relationship: boolean;
};

type JoinedClass = {
  id: string;
  name: string;
  avatar_url: string;
};

function PresenceIndicator({ user }: { user: ProfileData | null }) {
    if (!user || !user.show_active_status || !user.last_seen) {
        return null;
    }

    const twoMinutesAgo = subMinutes(new Date(), 2);
    const isOnline = isBefore(twoMinutesAgo, new Date(user.last_seen));

    if (isOnline) {
         return (
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
         )
    }

    return null;
}


export default function UserProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [createdClasses, setCreatedClasses] = useState<JoinedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);


  const fetchProfileData = useCallback(async () => {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    setCurrentUser(authUser);

    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', params.id).single();

    if (profileError || !profileData) {
      console.error("Error fetching user profile:", profileError);
      setProfile(null); 
      setLoading(false);
      return;
    }
    
    setIsOwnProfile(authUser?.id === profileData.id);

    // Parallelize fetches for counts, posts, and classes
    const [followersRes, followingRes, postsRes, createdClassesRes, followStatusRes] = await Promise.all([
        supabase.from('followers').select('follower_id', { count: 'exact' }).eq('user_id', params.id),
        supabase.from('followers').select('user_id', { count: 'exact' }).eq('follower_id', params.id),
        supabase.from('posts').select('*').eq('user_id', params.id).order('created_at', { ascending: false }),
        supabase.from('classes').select('id, name, avatar_url').eq('creator_id', params.id),
        authUser && authUser.id !== params.id 
            ? supabase.from('followers').select('*').eq('user_id', params.id).eq('follower_id', authUser.id).maybeSingle() 
            : Promise.resolve({ data: null })
    ]);
    
    const isFollowingUser = !!followStatusRes?.data;
    setIsFollowing(isFollowingUser);

    setProfile({
      ...profileData,
      bio: profileData.bio || "Another digital creator's bio.",
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
      is_following: isFollowingUser,
      is_private: profileData.is_private || false,
      last_seen: profileData.last_seen,
      show_active_status: profileData.show_active_status,
      is_in_relationship: profileData.is_in_relationship,
    });
    
    setPosts(postsRes.data as Post[] || []);
    
    if (createdClassesRes.error) {
        toast({ variant: 'destructive', title: 'Error loading classes', description: createdClassesRes.error.message });
    } else {
        setCreatedClasses(createdClassesRes.data as JoinedClass[]);
    }
    
    setLoading(false);
  }, [params.id, supabase, toast]);

  useEffect(() => {
    if (params.id) {
      fetchProfileData();
    }
     const channel = supabase.channel(`profile-${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${params.id}` }, (payload) => {
        fetchProfileData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, fetchProfileData, supabase]);
  
  const handleFollowToggle = async () => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Please log in', description: 'You need to be logged in to follow users.' });
        return;
    }
    if (!profile) return;

    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);

    if (newFollowingState) {
        // Follow
        const { error } = await supabase.from('followers').insert({
            user_id: profile.id,
            follower_id: currentUser.id,
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not follow user.' });
            setIsFollowing(false); // Revert UI on error
        } else {
            setProfile(p => p ? {...p, followers: p.followers + 1} : null);
        }
    } else {
        // Unfollow
        const { error } = await supabase.from('followers').delete().match({
            user_id: profile.id,
            follower_id: currentUser.id,
        });
         if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not unfollow user.' });
            setIsFollowing(true); // Revert UI on error
        } else {
            setProfile(p => p ? {...p, followers: p.followers - 1} : null);
        }
    }
  };

  if (loading) {
    return (
       <>
        <div className="flex h-full flex-col bg-background text-foreground pb-16 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
        </div>
        <BottomNav />
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <div className="flex h-full flex-col bg-background text-foreground pb-16 items-center justify-center text-center p-4">
          <p className="text-lg font-semibold">User not found</p>
           <p className="text-sm text-muted-foreground mt-1">The profile you are looking for does not exist.</p>
           <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
        <BottomNav />
      </>
    )
  }
  
  const canViewContent = !profile.is_private || isFollowing || isOwnProfile;
  const isProfileOnline = profile?.show_active_status && profile?.last_seen && isBefore(subMinutes(new Date(), 2), new Date(profile.last_seen));
  const profileLastSeen = profile?.show_active_status && profile?.last_seen ? formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true }) : null;

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold">{profile.username}</h1>
          <Link href={`/chat/${profile.id}`}>
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Message user</span>
            </Button>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center">
            <div className="relative">
                <Link href={`/search/image/${encodeURIComponent(profile.avatar_url)}`}>
                    <Avatar className="h-24 w-24 border-2 border-primary" profile={profile}>
                    </Avatar>
                </Link>
              <PresenceIndicator user={profile} />
            </div>
            <h2 className="mt-3 text-xl font-bold">{profile.full_name}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {isProfileOnline 
                ? <p className="text-xs text-green-500 mt-1">Online</p>
                : profileLastSeen && <p className="text-xs text-muted-foreground mt-1">Active {profileLastSeen}</p>
            }
            <p className="mt-2 text-center text-sm">{profile.bio}</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <Link href={`/profile/${profile.id}/following`}>
              <div>
                <p className="font-bold">{profile.following}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </Link>
             <Link href={`/profile/${profile.id}/followers`}>
              <div>
                <p className="font-bold">{profile.followers}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
            </Link>
            <div>
              <p className="font-bold">{posts.length}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {isOwnProfile ? (
              <Link href="/profile/edit" className="w-full">
                <Button variant="outline" className="w-full">Edit Profile</Button>
              </Link>
            ) : (
              <Button className="w-full" variant={isFollowing ? 'secondary' : 'default'} onClick={handleFollowToggle}>
                  {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>


          <Tabs defaultValue="posts" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">
                <Grid3x3 className="mr-2 h-4 w-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="class">
                 <GraduationCap className="mr-2 h-4 w-4" />
                 Class
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
             {canViewContent ? (
                posts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1 mt-4">
                        {posts.map((post) => (
                        <div key={post.id} className="group relative aspect-square w-full bg-muted">
                            <Link href={`/post/${post.id}`} className="block h-full w-full">
                                <div className="aspect-square w-full relative h-full">
                                    <Image
                                        src={post.media_url}
                                        alt={`Post by ${profile.username}`}
                                        fill
                                        className="object-cover h-full w-full"
                                        data-ai-hint="lifestyle content"
                                    />
                                </div>
                            </Link>
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
                    <CameraOff className="h-12 w-12" />
                    <p className="mt-4 text-sm">{isOwnProfile ? "You have no posts yet." : "This user has no posts yet."}</p>
                    </div>
                )
             ) : (
                <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground border-t mt-4">
                    <Lock className="h-12 w-12 mt-4" />
                    <p className="mt-4 font-semibold">This Account is Private</p>
                    <p className="text-sm">Follow this account to see their photos and videos.</p>
                </div>
             )}
            </TabsContent>
            <TabsContent value="class">
               {canViewContent ? (
                    createdClasses.length > 0 ? (
                        <div className="divide-y mt-4 border-t">
                            {createdClasses.map((cls) => (
                                <Link href={`/class/${cls.id}`} key={cls.id}>
                                    <div className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer">
                                        <Avatar className="h-14 w-14 rounded-md" src={cls.avatar_url} />
                                        <div className="flex-1">
                                            <p className="font-semibold text-primary">{cls.name}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
                            <GraduationCap className="h-12 w-12" />
                            <p className="mt-4 text-sm">{isOwnProfile ? "You haven't created any classes." : "This user hasn't created any classes."}</p>
                        </div>
                    )
               ) : (
                 <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground border-t mt-4">
                    <Lock className="h-12 w-12 mt-4" />
                    <p className="mt-4 font-semibold">This Account is Private</p>
                    <p className="text-sm">Follow this account to see their classes.</p>
                </div>
               )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
