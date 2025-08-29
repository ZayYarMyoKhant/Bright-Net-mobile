
"use client";

import { use, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Settings, Clapperboard, ArrowLeft, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';
import { useRouter } from "next/navigation";
import { getVideoPosts } from "@/lib/data";


export default function UserProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // In a real app, you would fetch user data based on params.id
    // For now, we find the user from our mock data
    const allPosts = getVideoPosts();
    const foundUser = allPosts.find(p => p.user.username === params.id)?.user;
    
    if (foundUser) {
        setUser({
            ...foundUser,
            following: Math.floor(Math.random() * 200),
            followers: Math.floor(Math.random() * 100),
            postsCount: allPosts.filter(p => p.user.username === params.id).length,
            bio: "Another digital creator's bio.",
        });
    }

  }, [params.id]);


  const posts = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    imageUrl: `https://picsum.photos/400/400?random=${i + 20}`,
  }));

  if (!user) {
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
          <h1 className="font-bold">{user.username}</h1>
          <Link href={`/chat/${user.username}`}>
            <Button variant="ghost" size="icon">
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Message user</span>
            </Button>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={user.avatar} alt={user.username} data-ai-hint="person portrait" />
                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="mt-3 text-xl font-bold">{user.username}</h2>
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
            <Button className="w-full">Follow</Button>
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
