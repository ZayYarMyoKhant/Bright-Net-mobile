
"use client";

import { Suspense, useState, useTransition, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  Users,
  MessageSquare,
  GraduationCap,
  FileText,
  Image as ImageIcon,
  Video
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Post, Profile } from "@/lib/data";


type SearchableClass = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  members_count: number;
  is_member: boolean;
};


function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('q', query.trim());
      router.push(`${pathname}?${newParams.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Search for posts, classes, or users..."
        className="w-full pl-10"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}

function SearchPlaceholder() {
  return (
     <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
        <Search className="h-12 w-12" />
        <p className="mt-4 text-lg">Search for anything</p>
        <p className="text-sm">Find posts, classes, and other users.</p>
      </div>
  )
}

function UserResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<Profile[]>([]);
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (query) {
      startTransition(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${query}%`); // Case-insensitive search
        
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
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
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

function ClassResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q");
    const [isPending, startTransition] = useTransition();
    const [classes, setClasses] = useState<SearchableClass[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { toast } = useToast();
    const supabase = createClient();
    
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user }}) => setCurrentUser(user));
    }, [supabase]);

    useEffect(() => {
        if (query) {
            startTransition(async () => {
                const { data, error } = await supabase
                    .from('classes')
                    .select('*, members_count:class_members(count)')
                    .ilike('name', `%${query}%`);
                
                if (error) {
                    toast({ variant: 'destructive', title: "Search failed", description: error.message });
                } else if (data) {
                    const classIds = data.map(c => c.id);
                    let userMemberships: string[] = [];

                    if (currentUser && classIds.length > 0) {
                        const { data: membershipData } = await supabase
                            .from('class_members')
                            .select('class_id')
                            .eq('user_id', currentUser.id)
                            .in('class_id', classIds);
                        userMemberships = membershipData?.map(m => m.class_id) || [];
                    }

                    const processedClasses = data.map(c => ({
                        ...c,
                        members_count: c.members_count[0]?.count || 0,
                        is_member: userMemberships.includes(c.id),
                    })) as SearchableClass[];
                    setClasses(processedClasses);
                }
            });
        } else {
            setClasses([]);
        }
    }, [query, supabase, toast, currentUser]);

    const handleJoin = async (classId: string) => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Not authenticated'});
            return;
        }
        const { error } = await supabase.from('class_members').insert({ class_id: classId, user_id: currentUser.id });
        if (error) {
             toast({ variant: 'destructive', title: 'Failed to join class', description: error.message });
        } else {
            toast({ title: 'Successfully joined class!'});
            // Re-fetch or update state to reflect the change
            setClasses(prev => prev.map(c => c.id === classId ? {...c, is_member: true} : c));
        }
    }

    if (isPending) {
        return <div className="flex justify-center items-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (classes.length === 0 && query) {
        return (
            <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12" />
                <p className="mt-4 text-lg">No classes found for "{query}"</p>
            </div>
        )
    }

    return (
        <div className="divide-y">
            {classes.map(cls => (
                <div key={cls.id} className="p-4 flex items-center gap-4">
                    <Link href={`/class/${cls.id}`} className="flex-1 flex items-center gap-4">
                        <Avatar className="h-14 w-14 rounded-md">
                            <AvatarImage src={cls.avatar_url ?? undefined} />
                            <AvatarFallback><GraduationCap /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold text-primary">{cls.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{cls.description}</p>
                            <p className="text-xs text-muted-foreground">{cls.members_count} members</p>
                        </div>
                    </Link>
                    <Button onClick={() => handleJoin(cls.id)} disabled={cls.is_member}>
                        {cls.is_member ? 'Joined' : 'Join'}
                    </Button>
                </div>
            ))}
        </div>
    )
}

function PostResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q");
    const [isPending, startTransition] = useTransition();
    const [posts, setPosts] = useState<Post[]>([]);
    const { toast } = useToast();
    const supabase = createClient();
    
    useEffect(() => {
        if (query) {
            startTransition(async () => {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*, profiles!posts_user_id_fkey(*)')
                    .ilike('caption', `%${query}%`)
                    .order('created_at', { ascending: false });

                if (error) {
                    toast({ variant: 'destructive', title: "Search failed", description: error.message });
                } else {
                    // @ts-ignore
                    setPosts(data);
                }
            });
        } else {
            setPosts([]);
        }
    }, [query, supabase, toast]);

    const imagePosts = posts.filter(p => p.media_type === 'image');
    const videoPosts = posts.filter(p => p.media_type === 'video');

    if (isPending) {
        return <div className="flex justify-center items-center pt-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    if (posts.length === 0 && query) {
        return (
            <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
                <FileText className="h-12 w-12" />
                <p className="mt-4 text-lg">No posts found for "{query}"</p>
            </div>
        )
    }

    return (
        <Tabs defaultValue="news" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mt-2">
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="lite">Lite</TabsTrigger>
            </TabsList>
            <TabsContent value="news" className="mt-0">
                <div className="grid grid-cols-3 gap-1 py-2">
                    {imagePosts.map(post => (
                        <Link href={`/post/${post.id}`} key={post.id} className="relative aspect-square">
                            <Image src={post.media_url} alt={post.caption || 'post'} fill className="object-cover" />
                        </Link>
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="lite" className="mt-0">
                 <div className="grid grid-cols-3 gap-1 py-2">
                    {videoPosts.map(post => (
                        <Link href={`/post/${post.id}`} key={post.id} className="relative aspect-square bg-black">
                            <video src={post.media_url} className="object-cover h-full w-full" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Video className="h-6 w-6 text-white/80" />
                            </div>
                        </Link>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    )

}


export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b px-4">
          <h1 className="text-xl font-bold">Search</h1>
        </header>

         <div className="p-4 border-b">
            <Suspense fallback={<div>Loading...</div>}>
                <SearchBar />
            </Suspense>
        </div>

        <Tabs defaultValue="posts" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0 rounded-none">
            <TabsTrigger value="posts" className="pb-3">
              <FileText className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="classes" className="pb-3">
              <GraduationCap className="mr-2 h-4 w-4" />
              Classes
            </TabsTrigger>
             <TabsTrigger value="users" className="pb-3">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>
          <main className="flex-1 overflow-y-auto">
            <TabsContent value="posts" className="mt-0">
               <Suspense fallback={<Loader2 className="m-auto mt-10 h-8 w-8 animate-spin" />}>
                  {query ? <PostResults /> : <SearchPlaceholder />}
               </Suspense>
            </TabsContent>
             <TabsContent value="classes" className="mt-0">
               <Suspense fallback={<Loader2 className="m-auto mt-10 h-8 w-8 animate-spin" />}>
                  {query ? <ClassResults /> : <SearchPlaceholder />}
               </Suspense>
            </TabsContent>
             <TabsContent value="users" className="mt-0">
               <Suspense fallback={<Loader2 className="m-auto mt-10 h-8 w-8 animate-spin" />}>
                  {query ? <UserResults /> : <SearchPlaceholder />}
               </Suspense>
            </TabsContent>
          </main>
        </Tabs>
      </div>
      <BottomNav />
    </>
  );
}

    