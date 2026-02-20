
"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, ArrowLeft, CameraOff, Loader2, Lock, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Post, Profile } from "@/lib/data";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  profile_design: boolean | null;
};

type InitialProfileData = {
    profile: ProfileData | null;
    posts: Post[];
    error: string | null;
}

function PresenceIndicator({ user }: { user: ProfileData | null }) {
    if (!user || !user.show_active_status || !user.last_seen) return null;
    const twoMinutesAgo = subMinutes(new Date(), 2);
    const isOnline = isBefore(twoMinutesAgo, new Date(user.last_seen));
    if (isOnline) return <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />;
    return null;
}

const ProfileHeader = ({ profile, postsCount }: { profile: ProfileData; postsCount: number }) => {
    const isProfileOnline = profile?.show_active_status && profile?.last_seen && isBefore(subMinutes(new Date(), 2), new Date(profile.last_seen));
    const profileLastSeen = profile?.show_active_status && profile?.last_seen ? formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true }) : null;
    const baseClasses = "relative overflow-hidden flex flex-col items-center p-4 rounded-b-3xl mb-4 bg-black text-white shadow-lg";
    return (
        <div className={cn(baseClasses, profile.profile_design === true ? "bg-gradient-to-br from-amber-800/80 via-black to-yellow-800/80" : profile.profile_design === null ? "bg-gradient-to-br from-cyan-900/80 via-black to-sky-900/80" : "bg-muted")}>
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                    <Avatar className="h-24 w-24" profile={profile} />
                    <PresenceIndicator user={profile} />
                </div>
                <h2 className={cn("mt-3 text-xl", profile.is_verified && "font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md px-2 py-1")}>{profile.full_name}</h2>
                <p className="text-sm opacity-70">@{profile.username}</p>
                {isProfileOnline ? <p className="text-xs text-green-300 mt-1">Online</p> : profileLastSeen && <p className="text-xs opacity-60 mt-1">Active {profileLastSeen}</p>}
                <p className="mt-2 text-center text-sm px-4">{profile.bio}</p>
            </div>
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-4 text-center w-full max-w-sm">
                <Link href={`/profile/${profile.id}/following`}><div><p className="font-bold text-lg">{profile.following}</p><p className="text-xs opacity-70">Following</p></div></Link>
                <Link href={`/profile/${profile.id}/followers`}><div><p className="font-bold text-lg">{profile.followers}</p><p className="text-xs opacity-70">Followers</p></div></Link>
                <div><p className="font-bold text-lg">{postsCount}</p><p className="text-xs opacity-70">Posts</p></div>
            </div>
        </div>
    );
};

export default function UserProfilePageContent({ initialData, params }: { initialData: InitialProfileData, params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(initialData.profile);
  const [posts] = useState<Post[]>(initialData.posts);
  const [isFollowing, setIsFollowing] = useState(initialData.profile?.is_following ?? false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  useEffect(() => {
      supabase.auth.getUser().then(({data: { user }}) => setCurrentUser(user));
  }, [supabase]);

  const handleFollowToggle = async () => {
    if (!currentUser || !profile || isTogglingFollow) return;
    setIsTogglingFollow(true);
    if (isFollowing) {
        const { error } = await supabase.from('followers').delete().match({ user_id: profile.id, follower_id: currentUser.id });
        if (!error) { setIsFollowing(false); setProfile(p => p ? {...p, followers: p.followers - 1} : null); }
    } else {
        const { error } = await supabase.from('followers').insert({ user_id: profile.id, follower_id: currentUser.id });
        if (!error) { setIsFollowing(true); setProfile(p => p ? {...p, followers: p.followers + 1} : null); }
    }
    setIsTogglingFollow(false);
  };

  if (!profile) return <div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  
  const isOwnProfile = currentUser?.id === profile.id;
  const canViewContent = !profile.is_private || isFollowing || isOwnProfile;

  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="font-bold">{profile.username}</h1>
          <div className="w-10"></div>
        </header>
        <main className="flex-1 overflow-y-auto">
            <ProfileHeader profile={profile} postsCount={posts.length} />
            <div className="mt-4 px-4">
                {isOwnProfile ? <Link href="/profile/edit" className="w-full"><Button variant="outline" className="w-full">Edit Profile</Button></Link> : <Button className="w-full" variant={isFollowing ? 'secondary' : 'default'} onClick={handleFollowToggle} disabled={isTogglingFollow}>{isTogglingFollow ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}</Button>}
            </div>
            <Tabs defaultValue="posts" className="mt-6">
                <TabsList className="grid w-full grid-cols-1"><TabsTrigger value="posts"><Grid3x3 className="mr-2 h-4 w-4" />Posts</TabsTrigger></TabsList>
                <TabsContent value="posts">
                    {canViewContent ? (posts.length > 0 ? <div className="grid grid-cols-3 gap-1 mt-4">{posts.map((post) => <Link href={`/post/${post.id}`} key={post.id} className="aspect-square relative"><Image src={post.media_url} alt="post" fill className="object-cover" /></Link>)}</div> : <div className="text-center pt-10 text-muted-foreground"><CameraOff className="h-12 w-12 mx-auto" /><p className="mt-2">No posts yet.</p></div>) : <div className="text-center pt-10 text-muted-foreground"><Lock className="h-12 w-12 mx-auto" /><p className="mt-4 font-semibold">This Account is Private</p></div>}
                </TabsContent>
            </Tabs>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
