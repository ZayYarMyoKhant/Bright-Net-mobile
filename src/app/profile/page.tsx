

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Settings, UserPlus, Clapperboard, Loader2, CameraOff, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Post, Profile } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

type Class = {
  id: string;
  name: string;
  creator_id: string;
  avatar_url: string;
};

type ProfileData = Profile & {
  following: number;
  followers: number;
};


export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [user, setUser] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [createdClasses, setCreatedClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);

  const fetchUserData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/signup');
      setLoading(false);
      return;
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast({ variant: 'destructive', title: 'Error loading profile', description: error.message });
      setLoading(false);
      return;
    }

    if (profileData) {
      // Correct queries for follower/following counts
      const [followersRes, followingRes, postDataRes, createdClassesRes, requestCountRes] = await Promise.all([
        supabase.from('followers').select('*', { count: 'exact' }).eq('user_id', authUser.id).eq('is_accepted', true),
        supabase.from('followers').select('*', { count: 'exact' }).eq('follower_id', authUser.id).eq('is_accepted', true),
        supabase.from('posts').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
        supabase.from('classes').select('*').eq('creator_id', authUser.id),
        supabase.from('followers').select('*', { count: 'exact' }).eq('user_id', authUser.id).eq('is_accepted', false)
      ]);
      
      setUser({
        ...profileData,
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      });

      setRequestCount(requestCountRes.count || 0);
      
      if (postDataRes.error) {
        toast({ variant: 'destructive', title: 'Error loading posts', description: postDataRes.error.message });
      } else {
        setPosts(postDataRes.data as Post[]);
      }
      
      if (createdClassesRes.error) {
        toast({ variant: 'destructive', title: 'Error loading classes', description: createdClassesRes.error.message });
      } else {
        setCreatedClasses(createdClassesRes.data as Class[]);
      }
    } else {
      router.push('/profile/setup');
      return; 
    }

    setLoading(false);
  }, [router, supabase, toast]);
  
  useEffect(() => {
    setLoading(true);
    fetchUserData();

    const channel = supabase.channel('profile-page-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'followers'
      }, (payload) => {
        // Re-fetch all data on any change in followers table for simplicity
        fetchUserData();
      })
      .subscribe();
      
    return () => {
        supabase.removeChannel(channel);
    }
  }, [fetchUserData, supabase]);


  if (loading) {
    return (
      <>
        <div className="flex h-full flex-col bg-background text-foreground pb-16 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <BottomNav />
      </>
    )
  }

  if (!user) {
    return (
         <>
            <div className="flex h-full flex-col bg-background text-foreground pb-16 items-center justify-center">
                <p>Could not load profile. Please try logging in again.</p>
                 <Button onClick={() => router.push('/signup')} className="mt-4">Go to Sign Up</Button>
            </div>
            <BottomNav />
        </>
    )
  }


  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
          <Link href="/profile/friend-request" className="relative">
            <Button variant="ghost" size="icon">
              <UserPlus className="h-5 w-5" />
              <span className="sr-only">Add Friend</span>
            </Button>
            {requestCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
                    {requestCount}
                </Badge>
            )}
          </Link>
          <h1 className="font-bold">{user.username}</h1>
          <Link href="/profile/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 border-2 border-primary" profile={user}>
            </Avatar>
            <h2 className="mt-3 text-xl font-bold">{user.full_name}</h2>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <p className="mt-2 text-center text-sm">{user.bio}</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <Link href={`/profile/${user.id}/following`}>
                <div>
                    <p className="font-bold">{user.following}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </Link>
              <Link href={`/profile/${user.id}/followers`}>
                <div>
                    <p className="font-bold">{user.followers}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                </div>
              </Link>
               <div>
                  <p className="font-bold">{posts.length}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
              </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
              <Link href="/profile/edit" className="flex-1">
                <Button className="w-full">Edit Profile</Button>
              </Link>
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
            <TabsContent value="posts" className="mt-4">
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => (
                    <Link href={`/post/${post.id}`} key={post.id} className="aspect-square w-full relative">
                       {post.media_type === 'video' ? (
                           <video src={post.media_url} className="h-full w-full object-cover" />
                       ) : (
                           <Image
                                src={post.media_url}
                                alt={`Post by ${user.username}`}
                                fill
                                className="object-cover h-full w-full"
                                data-ai-hint="lifestyle content"
                            />
                       )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
                  <CameraOff className="h-12 w-12" />
                  <p className="mt-4 text-sm">You have no posts yet.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="class">
               {createdClasses.length > 0 ? (
                 <div className="divide-y mt-4">
                    {createdClasses.map((cls) => (
                        <Link href={`/class/${cls.id}`} key={cls.id}>
                            <div className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer">
                                <Avatar className="h-14 w-14 rounded-md">
                                    <AvatarImage src={cls.avatar_url} />
                                    <AvatarFallback>
                                        <GraduationCap/>
                                    </AvatarFallback>
                                </Avatar>
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
                      <p className="mt-4 text-sm">You haven't created any classes yet.</p>
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
