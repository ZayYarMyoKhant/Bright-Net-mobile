"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Post, Profile } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/post-card";
import { VideoFeed } from "@/components/video-feed";
import { AdsterraBanner } from "@/components/adsterra-banner";
import Link from "next/link";

function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      newParams.set('q', query.trim());
    } else {
      newParams.delete('q');
    }
    router.push(`${pathname}?${newParams.toString()}`);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex w-full items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="w-full pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Button type="submit">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}

function SearchPlaceholder() {
  return (
     <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
        <Search className="h-12 w-12" />
        <p className="mt-4 text-lg">Search for posts and users</p>
        <p className="text-sm">Find content and connect with friends.</p>
      </div>
  )
}

function PostResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q");
    const [isPending, startTransition] = useTransition();
    const [imagePosts, setImagePosts] = useState<Post[]>([]);
    const [videoPosts, setVideoPosts] = useState<Post[]>([]);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        if (query) {
            startTransition(async () => {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*, profiles!posts_user_id_fkey(*), likes:post_likes(count), comments:post_comments(count)')
                    .textSearch('caption', query, { type: 'websearch', config: 'english' });
                
                if (error) {
                    toast({ variant: 'destructive', title: "Search failed", description: error.message });
                } else {
                    const allPosts: Post[] = data.map((p: any) => ({
                        id: p.id,
                        user: p.profiles,
                        media_url: p.media_url,
                        media_type: p.media_type,
                        caption: p.caption,
                        created_at: p.created_at,
                        likes: p.likes[0]?.count || 0,
                        comments: p.comments[0]?.count || 0,
                        isLiked: false
                    }));
                    setImagePosts(allPosts.filter(p => p.media_type === 'image'));
                    setVideoPosts(allPosts.filter(p => p.media_type === 'video'));
                }
            });
        }
    }, [query, supabase, toast]);

    if (isPending) return <div className="flex justify-center items-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
    
    return (
        <Tabs defaultValue="news" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="lite">Lite</TabsTrigger>
            </TabsList>
            <TabsContent value="news" className="mt-4">
                {imagePosts.length > 0 ? (
                    <div className="w-full max-w-lg mx-auto space-y-4">
                        {imagePosts.map((post) => <PostCard key={post.id} post={post} />)}
                    </div>
                ) : <div className="text-center pt-10 text-muted-foreground">No posts found</div>}
            </TabsContent>
            <TabsContent value="lite" className="mt-0">
                 <VideoFeed posts={videoPosts} loading={isPending} />
            </TabsContent>
        </Tabs>
    );
}

function UserResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<Profile[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (query) {
      startTransition(async () => {
        const { data } = await supabase.from('profiles').select('*').or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
        if (data) setUsers(data as Profile[]);
      });
    }
  }, [query, supabase]);

  if (isPending) return <div className="flex justify-center items-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
      <div className="divide-y">
        {users.map((user) => (
            <div key={user.id} className="p-4 flex items-center gap-4">
                <Link href={`/profile/${user.id}`}>
                    <Avatar className="h-12 w-12" profile={user} />
                </Link>
                <div className="flex-1">
                     <Link href={`/profile/${user.id}`}>
                        <p className="font-semibold hover:underline">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </Link>
                </div>
            </div>
        ))}
      </div>
  )
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const hasQuery = searchParams.has("q");

  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4">
          <h1 className="text-xl font-bold">Search</h1>
        </header>
         <div className="p-4 border-b">
            <SearchBar />
            {/* Adsterra Banner under header */}
            <AdsterraBanner />
         </div>
        <main className="flex-1 overflow-y-auto">
            {!hasQuery ? <SearchPlaceholder /> : (
                <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="posts">Posts</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                    </TabsList>
                    <TabsContent value="posts"><PostResults /></TabsContent>
                    <TabsContent value="users"><UserResults /></TabsContent>
                </Tabs>
            )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SearchPageContent />
        </Suspense>
    )
}
