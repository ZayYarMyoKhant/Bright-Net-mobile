
"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Settings, UserPlus, Clapperboard, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';

type ProfileData = {
  fullName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  following: number;
  followers: number;
  postsCount: number;
};

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url, bio')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      toast({ variant: 'destructive', title: 'Error fetching profile' });
      setLoading(false);
      return;
    }

    if (data) {
      setUser({
        fullName: data.full_name || '',
        username: data.username || '',
        avatarUrl: data.avatar_url || `https://i.pravatar.cc/150?u=${authUser.id}`,
        bio: data.bio || '',
        // These are still mock, would need tables for this
        following: Math.floor(Math.random() * 200),
        followers: Math.floor(Math.random() * 500),
        postsCount: 15, 
      });
    }
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const posts = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    imageUrl: `https://picsum.photos/400/400?random=${i + 10}`,
  }));

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
                <p>Could not load profile. Please try again.</p>
                <Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
            </div>
            <BottomNav />
        </>
    )
  }


  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
          <Link href="/profile/friend-request">
            <Button variant="ghost" size="icon">
              <UserPlus className="h-5 w-5" />
              <span className="sr-only">Add Friend</span>
            </Button>
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
            <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="person portrait" />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="mt-3 text-xl font-bold">{user.fullName}</h2>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <p className="mt-2 text-center text-sm">{user.bio}</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                  <p className="font-bold">{user.following}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
              </div>
              <div>
                  <p className="font-bold">{user.followers}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
              </div>
               <div>
                  <p className="font-bold">{user.postsCount}</p>
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
                <Clapperboard className="mr-2 h-4 w-4" />
                Class
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
              <div className="grid grid-cols-3 gap-1">
                {posts.map((post) => (
                  <div key={post.id} className="aspect-square w-full relative">
                    <Image
                      src={post.imageUrl}
                      alt={`Post ${post.id}`}
                      layout="fill"
                      objectFit="cover"
                      className="h-full w-full"
                      data-ai-hint="lifestyle content"
                    />
                  </div>
                ))}
              </div>
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

    