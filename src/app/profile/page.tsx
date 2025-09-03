
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Settings, UserPlus, Clapperboard, Loader2, CameraOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Post } from '@/lib/data';


type ProfileData = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  following: number;
  followers: number;
};


export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const [user, setUser] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
        setLoading(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
                setLoading(false);
                return;
            }

            if (profileData) {
                 setUser({
                    ...profileData,
                    following: 0, // Placeholder
                    followers: 0, // Placeholder
                });
            } else {
                // This case shouldn't be hit often if the flow is correct, but as a fallback:
                router.push('/profile/setup');
            }

        } else {
            router.push('/signup');
        }
        setLoading(false);
    };

    fetchUserData();
  }, [router, supabase, toast]);


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
                <AvatarImage src={user.avatar_url} alt={user.username} data-ai-hint="person portrait" />
                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
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
                <Clapperboard className="mr-2 h-4 w-4" />
                Class
              </TabsTrigger>
            </TabsList>
            <TabsContent value="posts">
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => (
                    <div key={post.id} className="aspect-square w-full relative">
                       {post.media_type === 'video' ? (
                           <video src={post.media_url} className="h-full w-full object-cover" />
                       ) : (
                           <Image
                                src={post.media_url}
                                alt={`Post by ${user.username}`}
                                layout="fill"
                                objectFit="cover"
                                className="h-full w-full"
                                data-ai-hint="lifestyle content"
                            />
                       )}
                    </div>
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
