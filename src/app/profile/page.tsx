
"use client";

import { useState, useEffect, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Settings, UserPlus, Clapperboard, Loader2, CameraOff, Eye, ChevronDown, Plus, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from '@/components/bottom-nav';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Post, Profile } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiAccountContext, StoredAccount } from '@/hooks/use-multi-account';

type ProfileData = Profile & {
  following: number;
  followers: number;
};


export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  const multiAccount = useContext(MultiAccountContext);

  const [user, setUser] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);

  const fetchUserData = useCallback(async (userId?: string) => {
    if (!userId) return;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      if (profileError && profileError.code !== 'PGRST116') {
        toast({ variant: 'destructive', title: 'Error loading profile', description: profileError.message });
      } else {
        router.push('/profile/setup');
      }
      setLoading(false);
      return;
    }

    const { data: statsData, error: statsError } = await supabase
      .rpc('get_user_stats', { user_id_param: userId })
      .single();

    if (statsError) {
        toast({ variant: 'destructive', title: 'Error loading stats', description: statsError.message });
    }
    
    setUser({
        ...profileData,
        followers: statsData?.followers_count || 0,
        following: statsData?.following_count || 0,
    });
    setRequestCount(statsData?.pending_request_count || 0);

    const { data: postDataRes, error: postError } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (postError) {
        toast({ variant: 'destructive', title: 'Error loading posts', description: postError.message });
    } else {
        setPosts(postDataRes as Post[]);
    }

    setLoading(false);
  }, [router, supabase, toast]);
  
  useEffect(() => {
    setLoading(true);
    if(multiAccount?.currentAccount) {
        fetchUserData(multiAccount.currentAccount.id);
    } else if (multiAccount && !multiAccount.isLoading) {
        router.push('/signup');
    }

    if (multiAccount?.currentAccount?.id) {
        const channel = supabase.channel('profile-page-realtime')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'followers',
            filter: `user_id=eq.${multiAccount.currentAccount.id}`
          }, (payload) => {
            fetchUserData(multiAccount.currentAccount?.id);
          })
          .subscribe();
          
        return () => {
            supabase.removeChannel(channel);
        }
    }
  }, [fetchUserData, multiAccount?.currentAccount, multiAccount?.isLoading, router, supabase]);


  const handleSwitchAccount = async (account: StoredAccount) => {
      if (multiAccount) {
          await multiAccount.switchAccount(account.id);
          setLoading(true);
          router.refresh();
      }
  };


  if (loading || multiAccount?.isLoading) {
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 text-base font-bold">
                    {user.username}
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Switch account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {multiAccount && multiAccount.accounts.map((acc) => (
                     <DropdownMenuItem key={acc.id} onClick={() => handleSwitchAccount(acc)} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8" profile={acc} />
                            <span className="font-semibold">{acc.username}</span>
                        </div>
                        {acc.id === multiAccount.currentAccount?.id && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => router.push('/signup')}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add account</span>
                 </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center">
            <Link href="/profile/viewers">
              <Button variant="ghost" size="icon">
                <Eye className="h-5 w-5" />
                <span className="sr-only">Profile Viewers</span>
              </Button>
            </Link>
            <Link href="/profile/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 border-2 border-primary" profile={user}>
            </Avatar>
            <h2 className={cn("mt-3 text-xl", user.is_verified && "font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md px-2 py-1")}>{user.full_name}</h2>
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
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="posts">
                <Grid3x3 className="mr-2 h-4 w-4" />
                Posts
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
          </Tabs>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
