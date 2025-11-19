
"use client";

import { Suspense, useState, useTransition, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  Users,
  Clapperboard,
  CameraOff,
  MessageSquare,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Post, Profile } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { PostCard } from "@/components/post-card";
import { VideoFeed } from "@/components/video-feed";
import { Card, CardContent } from "@/components/ui/card";
import { User as AuthUser } from "@supabase/supabase-js";


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
                    const { data: { user: currentUser } } = await supabase.auth.getUser();

                    const allPosts: Post[] = await Promise.all(data.map(async (p: any) => {
                         const { data: userLikes } = currentUser ? await supabase
                            .from('post_likes')
                            .select('post_id')
                            .eq('user_id', currentUser.id)
                            .eq('post_id', p.id) : { data: [] };

                        const likedPostIds = new Set(userLikes?.map(like => like.post_id));
                        
                        return {
                            id: p.id,
                            user: p.profiles,
                            media_url: p.media_url,
                            media_type: p.media_type,
                            caption: p.caption,
                            created_at: p.created_at,
                            likes: p.likes[0]?.count || 0,
                            comments: p.comments[0]?.count || 0,
                            isLiked: likedPostIds.has(p.id)
                        }
                    }));
                    
                    setImagePosts(allPosts.filter(p => p.media_type === 'image'));
                    setVideoPosts(allPosts.filter(p => p.media_type === 'video'));
                }
            });
        } else {
            setImagePosts([]);
            setVideoPosts([]);
        }
    }, [query, supabase, toast]);

    if (isPending) {
        return <div className="flex justify-center items-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }
    
    if (imagePosts.length === 0 && videoPosts.length === 0 && !isPending && query) {
        return (
             <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
                <CameraOff className="h-12 w-12" />
                <p className="mt-4 text-sm">No posts found for "{query}"</p>
            </div>
        )
    }

    return (
        <Tabs defaultValue="news" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="lite">Lite</TabsTrigger>
            </TabsList>
            <TabsContent value="news" className="mt-4">
                {imagePosts.length > 0 ? (
                    <div className="w-full max-w-lg mx-auto space-y-4">
                        {imagePosts.map((post) => (
                           <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
                        <CameraOff className="h-12 w-12" />
                        <p className="mt-4 text-sm">No image posts found for "{query}"</p>
                    </div>
                )}
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
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (query) {
      startTransition(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
        
        if (error) {
            toast({ variant: 'destructive', title: "Search failed", description: error.message });
        } else {
            setUsers(data as Profile[]);
        }
      });
    } else {
        setUsers([]);
    }
  }, [query, supabase, toast]);

  if (isPending) {
    return <div className="flex justify-center items-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (users.length === 0 && query) {
      return (
        <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
          <Users className="h-12 w-12" />
          <p className="mt-4 text-lg">No users found for "{query}"</p>
        </div>
      )
  }

  return (
      <div className="divide-y">
        {users.map((user) => (
            <div key={user.id} className="p-4 flex items-center gap-4">
                <Link href={`/profile/${user.id}`}>
                    <Avatar className="h-12 w-12" profile={user}>
                    </Avatar>
                </Link>
                <div className="flex-1">
                     <Link href={`/profile/${user.id}`}>
                        <p className="font-semibold hover:underline">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </Link>
                </div>
                <Link href={`/chat/${user.id}`}>
                    <Button variant="ghost" size="icon">
                        <MessageSquare className="h-5 w-5" />
                    </Button>
                </Link>
            </div>
        ))}
      </div>
  )
}

type ClassResult = {
    id: string;
    name: string;
    avatar_url: string | null;
    is_enrolled: boolean;
}

const ClassResultItem = ({ item, currentUser }: { item: ClassResult; currentUser: AuthUser | null }) => {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [isEnrolled, setIsEnrolled] = useState(item.is_enrolled);
    const [isJoining, setIsJoining] = useState(false);

    const handleJoin = async () => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'You must be logged in to join a class.' });
            return;
        }
        setIsJoining(true);
        const { error } = await supabase.from('class_members').insert({
            class_id: item.id,
            user_id: currentUser.id
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to join class', description: error.message });
        } else {
            toast({ title: 'Successfully joined!', description: `Welcome to ${item.name}.` });
            setIsEnrolled(true);
        }
        setIsJoining(false);
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-12 w-12" src={item.avatar_url} alt={item.name} />
                <div className="flex-1">
                    <p className="font-bold truncate">{item.name}</p>
                </div>
                {isEnrolled ? (
                    <Link href={`/class/${item.id}`}>
                        <Button variant="outline">View</Button>
                    </Link>
                ) : (
                    <Button onClick={handleJoin} disabled={isJoining}>
                        {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};


function ClassResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [isPending, startTransition] = useTransition();
  const [classes, setClasses] = useState<ClassResult[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, [supabase]);

  useEffect(() => {
    if (query && currentUser) {
      startTransition(async () => {
        const { data, error } = await supabase
            .from('classes')
            .select('id, name, avatar_url');

        if (error) {
            toast({ variant: 'destructive', title: "Class search failed", description: error.message });
        } else {
            const classIds = data.map(c => c.id);
            const { data: enrollments, error: enrollmentError } = await supabase
                .from('class_members')
                .select('class_id')
                .eq('user_id', currentUser.id)
                .in('class_id', classIds);

            if (enrollmentError) {
                toast({ variant: 'destructive', title: "Could not check enrollments", description: enrollmentError.message });
                setClasses(data.map(c => ({...c, is_enrolled: false})));
            } else {
                const enrolledClassIds = new Set(enrollments.map(e => e.class_id));
                const results = data.map(c => ({
                    ...c,
                    is_enrolled: enrolledClassIds.has(c.id)
                }));
                setClasses(results);
            }
        }
      });
    } else {
        setClasses([]);
    }
  }, [query, supabase, toast, currentUser]);

  if (isPending) {
    return <div className="flex justify-center items-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (classes.length === 0 && query) {
      return (
        <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12" />
          <p className="mt-4 text-lg">No classes found for "{query}"</p>
        </div>
      )
  }

  return (
      <div className="space-y-4 p-4">
        {classes.map((cls) => (
            <ClassResultItem key={cls.id} item={cls} currentUser={currentUser} />
        ))}
      </div>
  )
}


function SearchPageContent() {
  const searchParams = useSearchParams();
  const [hasQuery, setHasQuery] = useState(false);

  useEffect(() => {
    setHasQuery(searchParams.has("q"));
  }, [searchParams]);

  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4">
          <h1 className="text-xl font-bold">Search</h1>
        </header>

         <div className="p-4 border-b">
            <SearchBar />
        </div>

        <main className="flex-1 overflow-y-auto">
            {!hasQuery ? <SearchPlaceholder /> : (
                <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="posts">Posts</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="classes">Classes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="posts">
                        <PostResults />
                    </TabsContent>
                    <TabsContent value="users">
                        <UserResults />
                    </TabsContent>
                    <TabsContent value="classes">
                        <ClassResults />
                    </TabsContent>
                </Tabs>
            )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}

function SearchPageFallback() {
    return (
        <>
            <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
                <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4">
                    <h1 className="text-xl font-bold">Search</h1>
                </header>
                <div className="p-4 border-b">
                    <div className="h-10 w-full bg-muted rounded-md animate-pulse" />
                </div>
                <main className="flex-1 overflow-y-auto flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </main>
            </div>
            <BottomNav />
        </>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageFallback />}>
            <SearchPageContent />
        </Suspense>
    )
}
