
"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Clapperboard, ArrowLeft, CameraOff, Loader2, MoreVertical, Trash2, Lock, AlertTriangle, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Post, Profile } from "@/lib/data";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, isBefore, subMinutes } from "date-fns";
import { cn } from "@/lib/utils";

type ProfileData = Profile & {
  following: number;
  followers: number;
  is_following: boolean;
  is_private: boolean;
  last_seen: string | null;
  show_active_status: boolean;
  is_in_relationship: boolean;
};

type InitialProfileData = {
    profile: ProfileData | null;
    posts: Post[];
    error: string | null;
}


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


export default function UserProfilePageContent({ initialData, params }: { initialData: InitialProfileData, params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(initialData.profile);
  const [posts, setPosts] = useState<Post[]>(initialData.posts);
  const [error, setError] = useState<string | null>(initialData.error);
  
  const [isFollowing, setIsFollowing] = useState(initialData.profile?.is_following ?? false);
  const isOwnProfile = currentUser?.id === profile?.id;

  useEffect(() => {
      supabase.auth.getUser().then(({data: { user }}) => {
          setCurrentUser(user);
      });
  }, [supabase]);

  // Track profile view
  useEffect(() => {
    if (profile && currentUser && !isOwnProfile) {
        const trackView = async () => {
            // Upsert ensures we only record one view per user, updating the timestamp
            await supabase.from('profile_views').upsert({
                profile_id: profile.id,
                viewer_id: currentUser.id,
                viewed_at: new Date().toISOString()
            }, { onConflict: 'profile_id, viewer_id' });
        };
        trackView();
    }
  }, [profile, currentUser, isOwnProfile, supabase]);


  useEffect(() => {
     if (!profile?.id) return;
     const channel = supabase.channel(`profile-${profile?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${profile?.id}` }, (payload) => {
        setProfile(prev => prev ? { ...prev, ...(payload.new as Profile) } : null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase]);
  
  const handleFollowToggle = async () => {
    if (!currentUser || !profile) {
      toast({ variant: 'destructive', title: 'Please log in', description: 'You need to be logged in to follow users.' });
      return;
    }
    if (isOwnProfile) return;

    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);

    if (newFollowingState) {
        // Follow action
        const { error: followError } = await supabase.from('followers').insert({
            user_id: profile.id,
            follower_id: currentUser.id,
        });
        
        if (followError) {
            toast({ variant: 'destructive', title: 'Could not follow user.', description: followError.message });
            setIsFollowing(false); // Revert UI on error
        } else {
            setProfile(p => p ? {...p, followers: p.followers + 1} : null);
            // Send notification from the app side
            await supabase.from('notifications').insert({
                recipient_id: profile.id,
                actor_id: currentUser.id,
                type: 'new_follower',
            });
        }
    } else {
        // Unfollow action
        const { error } = await supabase.from('followers').delete().match({
            user_id: profile.id,
            follower_id: currentUser.id,
        });

         if (error) {
            toast({ variant: 'destructive', title: 'Could not unfollow user.', description: error.message });
            setIsFollowing(true); // Revert UI on error
        } else {
            setProfile(p => p ? {...p, followers: p.followers - 1} : null);
        }
    }
  };

  if (error) {
    return (
      <>
        <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
             <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    <p>{error}</p>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </AlertDescription>
            </Alert>
        </div>
        <BottomNav />
      </>
    )
  }

  if (!profile) {
    return (
         <>
            <div className="flex h-dvh w-full items-center justify-center text-center">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          <div className="w-10"></div>
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
            <h2 className={cn("mt-3 text-xl", profile.is_verified && "font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md px-2 py-1")}>{profile.full_name}</h2>
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
              <>
                <Button className="flex-1" variant={isFollowing ? 'secondary' : 'default'} onClick={handleFollowToggle}>
                    {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Link href={`/chat/${profile.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message
                    </Button>
                </Link>
              </>
            )}
          </div>


          <Tabs defaultValue="posts" className="mt-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="posts">
                <Grid3x3 className="mr-2 h-4 w-4" />
                Posts
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
             {canViewContent ? (
                posts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1 mt-4">
                        {posts.map((post) => (
                        <div key={post.id} className="group relative aspect-square w-full bg-muted">
                            <Link href={`/post/${post.id}`} className="block h-full w-full">
                                {post.media_type === 'video' ? (
                                    <video src={post.media_url} className="h-full w-full object-cover" />
                                ) : (
                                    <Image
                                        src={post.media_url}
                                        alt={`Post by ${profile.username}`}
                                        fill
                                        className="object-cover h-full w-full"
                                        data-ai-hint="lifestyle content"
                                    />
                                )}
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
          </Tabs>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
