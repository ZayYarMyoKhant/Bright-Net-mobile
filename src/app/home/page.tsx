
'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { BottomNav } from "@/components/bottom-nav";
import { Loader2, Headphones } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostFeed } from '@/components/post-feed';
import { VideoFeed } from '@/components/video-feed';
import { createClient } from '@/lib/supabase/client';
import type { Post } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function FeedFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center pt-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function HomePageContent() {
  const [imagePosts, setImagePosts] = useState<Post[]>([]);
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const lastViewedTimestamp = localStorage.getItem('lastViewedPostTimestamp');

    let query = supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*), likes:post_likes(count), comments:post_comments(count)')
      .order('created_at', { ascending: false });

    if (lastViewedTimestamp) {
      query = query.gt('created_at', lastViewedTimestamp);
    }
    
    const { data: posts, error } = await query;
    

    if (error) {
      console.error("Error fetching posts:", error);
      toast({ variant: "destructive", title: "Failed to fetch posts", description: error.message });
      setLoading(false);
      return;
    } 
    
    if (!posts || posts.length === 0) {
        const { data: fallbackPosts, error: fallbackError } = await supabase
            .from('posts')
            .select('*, profiles!posts_user_id_fkey(*), likes:post_likes(count), comments:post_comments(count)')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (fallbackError) {
             console.error("Error fetching fallback posts:", fallbackError);
        } else if (fallbackPosts) {
             processAndSetPosts(fallbackPosts, currentUser);
        }
        setLoading(false);
        return;
    }
    
    processAndSetPosts(posts, currentUser);
    
    if (posts.length > 0) {
        localStorage.setItem('lastViewedPostTimestamp', posts[0].created_at);
    }

    setLoading(false);
  }, [supabase, toast]);

  const processAndSetPosts = async (posts: any[], currentUser: any) => {
      const postIds = posts.map(p => p.id);
      const { data: userLikes } = currentUser ? await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser.id)
        .in('post_id', postIds) : { data: [] };
      
      const likedPostIds = new Set(userLikes?.map(like => like.post_id));

      const processedPosts: Post[] = posts.map((post: any) => ({
        id: post.id,
        user: post.profiles,
        media_url: post.media_url,
        media_type: post.media_type,
        caption: post.caption,
        created_at: post.created_at,
        likes: post.likes[0]?.count || 0,
        comments: post.comments[0]?.count || 0,
        isLiked: likedPostIds.has(post.id),
      }));

      setImagePosts(processedPosts.filter(p => p.media_type === 'image'));
      setVideoPosts(processedPosts.filter(p => p.media_type === 'video'));
  }

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <>
      <Tabs defaultValue="news" className="w-full">
        <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
          <header className="fixed top-0 left-0 right-0 z-10 flex h-16 flex-shrink-0 items-center justify-center bg-background/80 px-4 text-center backdrop-blur-sm">
              <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="news">News</TabsTrigger>
                  <TabsTrigger value="relax" onClick={() => router.push('/relax')}>
                      <Headphones className="h-5 w-5 mr-1.5"/>
                      Relax
                  </TabsTrigger>
                  <TabsTrigger value="lite">Lite</TabsTrigger>
              </TabsList>
          </header>

          <main className="flex-1 overflow-y-auto pt-16">
              <TabsContent value="news">
                  <PostFeed posts={imagePosts} loading={loading} />
              </TabsContent>
              <TabsContent value="lite">
                  <VideoFeed posts={videoPosts} loading={loading} />
              </TabsContent>
          </main>
        </div>
        <BottomNav />
      </Tabs>
    </>
  );
}


export default function HomePage() {
    return (
        <Suspense fallback={<FeedFallback />}>
            <HomePageContent />
        </Suspense>
    )
}
