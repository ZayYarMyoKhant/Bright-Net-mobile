
"use client";

import { use, useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Clapperboard, ArrowLeft, MessageCircle, CameraOff, Loader2, Eye, Trash2, MoreVertical, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Post, PostWithViews } from "@/lib/data";
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
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type ProfileData = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  following: number;
  followers: number;
  bio: string;
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
  const [posts, setPosts] = useState<PostWithViews[]>([]);
  const [createdClasses, setCreatedClasses] = useState<CreatedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);


  const isOwnProfile = currentUser?.id === profile?.id;

  const fetchProfileData = useCallback(async () => {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    setCurrentUser(authUser);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio')
      .eq('username', params.id)
      .single();

    if (profileError || !profileData) {
      console.error("Error fetching user profile:", profileError);
      setProfile(null);
      setLoading(false);
      return;
    }

    // TODO: Fetch real follower/following counts
    setProfile({
      id: profileData.id,
      username: profileData.username,
      full_name: profileData.full_name || 'No Name',
      avatar_url: profileData.avatar_url || `https://i.pravatar.cc/150?u=${profileData.id}`,
      bio: profileData.bio || "Another digital creator's bio.",
      following: 0,
      followers: 0,
    });
    
    const [postsResult, classesResult] = await Promise.all([
        supabase
            .from('posts')
            .select('*, post_views(view_count)')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false }),
        supabase
            .from('classes')
            .select('*, class_members!left(user_id)')
            .eq('created_by', profileData.id)
    ]);


    if (postsResult.error) {
      console.error("Error fetching posts:", postsResult.error);
    } else {
      const postsWithViews = postsResult.data.map((p: any) => ({
          ...p,
          views: p.post_views[0]?.view_count || 0
      }));
      setPosts(postsWithViews);
    }

    if (classesResult.error) {
        console.error("Error fetching created classes:", classesResult.error);
    } else if (classesResult.data) {
        const processedClasses = classesResult.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            is_member: authUser ? c.class_members.some((m: any) => m.user_id === authUser.id) : false
        }));
        setCreatedClasses(processedClasses);
    }

    setLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    if (params.id) {
      fetchProfileData();
    }
  }, [params.id, fetchProfileData]);
  
  const handleJoinClass = async (classId: string) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not logged in', description: 'You must be logged in to join a class.' });
      return;
    }

    setJoiningClassId(classId);

    const { error } = await supabase.from('class_members').insert({
        class_id: classId,
        user_id: currentUser.id,
    });

    if (error) {
      console.error("Error joining class:", error);
      toast({ variant: 'destructive', title: 'Failed to Join', description: error.message });
    } else {
      toast({ title: 'Successfully Joined!', description: 'You are now a member of the class.' });
      setCreatedClasses(prev => prev.map(c => c.id === classId ? { ...c, is_member: true } : c));
    }
    setJoiningClassId(null);
  }

  const handleDeletePost = async (postId: string | number, mediaUrl: string) => {
    // Optimistic UI update
    setPosts(prev => prev.filter(p => p.id !== postId));
    
    // Delete from storage
    const filePath = mediaUrl.split('/public/')[1];
    if (filePath) {
        const { error: storageError } = await supabase.storage.from('posts').remove([filePath.replace('posts/','')]);
        if (storageError) {
            console.error("Failed to delete from storage:", storageError);
            toast({ variant: "destructive", title: "Storage Error", description: "Could not delete the post media." });
            // Re-fetch to revert UI change
            fetchProfileData();
            return;
        }
    }
    
    // Delete from database
    const { error: dbError } = await supabase.from('posts').delete().eq('id', postId);
    if (dbError) {
      console.error("Error deleting post from db:", dbError);
      toast({ variant: "destructive", title: "Database Error", description: "Could not delete the post." });
      fetchProfileData(); // Revert
    } else {
      toast({ title: "Post Deleted", description: "Your post has been successfully removed." });
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
        <div className="flex h-full flex-col bg-background text-foreground pb-16 items-center justify-center">
          <p>User not found</p>
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
          <Link href={`/chat/${profile.username}`}>
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
            {!isOwnProfile && <Button className="w-full">Follow</Button>}
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
                <div className="grid grid-cols-3 gap-1">
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
                                        objectFit="cover"
                                        className="h-full w-full"
                                        data-ai-hint="lifestyle content"
                                    />
                                )}
                            </div>
                        </Link>
                        
                        <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/50 px-1 py-0.5 text-white text-xs pointer-events-none">
                           <Eye className="h-3 w-3" />
                           <span className="font-bold">{post.views}</span>
                        </div>
                        
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
              {createdClasses.length > 0 ? (
                 <div className="space-y-4 pt-4">
                    {createdClasses.map(classItem => (
                         <Card key={classItem.id}>
                              <CardHeader>
                                  <CardTitle>{classItem.name}</CardTitle>
                                  {classItem.description && <p className="text-sm text-muted-foreground pt-2">{classItem.description}</p>}
                              </CardHeader>
                              <CardFooter>
                                  {isOwnProfile || classItem.is_member ? (
                                      <Link href={`/class/${classItem.id}`} className="w-full">
                                        <Button variant="secondary" className="w-full">
                                            View Channel
                                        </Button>
                                      </Link>
                                  ) : (
                                    <Button 
                                      className="w-full" 
                                      onClick={() => handleJoinClass(classItem.id)}
                                      disabled={joiningClassId === classItem.id}
                                    >
                                      {joiningClassId === classItem.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Join"}
                                    </Button>
                                  )}
                              </CardFooter>
                         </Card>
                    ))}
                 </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
                    <BookOpen className="h-12 w-12" />
                    <p className="mt-4 text-sm">{isOwnProfile ? "You haven't created any classes." : "This user hasn't created any classes."}</p>
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
