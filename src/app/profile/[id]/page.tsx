

"use client";

import { use, useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Clapperboard, ArrowLeft, MessageCircle, CameraOff, Loader2, MoreVertical, Trash2 } from "lucide-react";
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


type ProfileData = Profile & {
  following: number;
  followers: number;
  is_following: boolean;
};

type CreatedClass = {
  id: string;
  name: string;
  description: string | null;
  is_member: boolean;
};

export default function UserProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [createdClasses, setCreatedClasses] = useState<CreatedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);


  const isOwnProfile = currentUser?.id === profile?.id;

  const fetchProfileData = useCallback(async () => {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    setCurrentUser(authUser);

    // Fetch profile, followers, and following in parallel
    const [profileRes, followersRes, followingRes, postsRes, classesRes] = await Promise.all([
        supabase.from('profiles').select('*, win_streak_3, win_streak_10').eq('id', params.id).single(),
        supabase.from('followers').select('user_id', { count: 'exact' }).eq('user_id', params.id),
        supabase.from('followers').select('follower_id', { count: 'exact' }).eq('follower_id', params.id),
        supabase.from('posts').select('*').eq('user_id', params.id).order('created_at', { ascending: false }),
        supabase.from('classes').select('*, is_member:class_members!inner(user_id)').eq('created_by', params.id),
    ]);

    if (profileRes.error || !profileRes.data) {
      console.error("Error fetching user profile:", profileRes.error);
      setProfile(null); 
      setLoading(false);
      return;
    }
    
    let isFollowingUser = false;
    if (authUser && authUser.id !== params.id) {
        const { data: followData, error: followError } = await supabase
            .from('followers')
            .select('*')
            .eq('user_id', params.id)
            .eq('follower_id', authUser.id)
            .single();
        if (followData) isFollowingUser = true;
    }
    setIsFollowing(isFollowingUser);


    setProfile({
      ...profileRes.data,
      bio: profileRes.data.bio || "Another digital creator's bio.",
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
      is_following: isFollowingUser,
    });
    
    setPosts(postsRes.data as Post[] || []);
    
    setCreatedClasses(classesRes.data as CreatedClass[] || []);

    setLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    if (params.id) {
      fetchProfileData();
    }
  }, [params.id, fetchProfileData]);
  
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

  const handleJoinClass = async (classId: string) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not logged in', description: 'You must be logged in to join a class.' });
      return;
    }

    setJoiningClassId(classId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCreatedClasses(prev => prev.map(c => c.id === classId ? { ...c, is_member: true } : c));
    setJoiningClassId(null);
  }

  const handleDeletePost = async (postId: string, mediaUrl: string) => {
    // Optimistically remove from UI
    setPosts(prev => prev.filter(p => p.id !== postId));

    // Delete from DB
    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
        toast({ variant: "destructive", title: "Delete Failed", description: error.message });
        // Re-fetch to revert UI
        fetchProfileData();
    } else {
        toast({ title: "Post Deleted", description: "Your post has been removed." });
        // Optionally, also delete from storage
        const filePath = mediaUrl.substring(mediaUrl.lastIndexOf('public/') + 'public/'.length);
        supabase.storage.from('posts').remove([filePath]);
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
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={profile.avatar_url} alt={profile.username} data-ai-hint="person portrait" />
              <AvatarFallback>{profile.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="mt-3 text-xl font-bold">{profile.full_name}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
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
                <Clapperboard className="mr-2 h-4 w-4" />
                Class
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
             {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 mt-4">
                    {posts.map((post) => (
                    <div key={post.id} className="group relative aspect-square w-full bg-muted">
                        <Link href={`/post/${post.id}`} className="block h-full w-full">
                            <div className="aspect-square w-full relative h-full">
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
                            </div>
                        </Link>
                        
                        {isOwnProfile && (
                            <div className="absolute top-1 right-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white bg-black/30 hover:bg-black/50 hover:text-white">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your post.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeletePost(post.id, post.media_url)} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
                  <CameraOff className="h-12 w-12" />
                  <p className="mt-4 text-sm">{isOwnProfile ? "You have no posts yet." : "This user has no posts yet."}</p>
                </div>
             )}
            </TabsContent>
            <TabsContent value="class">
               <div className="flex flex-col items-center justify-center pt-10">
                  <Clapperboard className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">No classes yet.</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
