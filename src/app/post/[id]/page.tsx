
"use client";

import { use, Suspense, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Heart, MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CommentSheet } from "@/components/comment-sheet";
import { ShareSheet } from "@/components/share-sheet";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Post } from "@/lib/data";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function PostViewerContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        const { data: postData, error } = await supabase
            .from('posts')
            .select(`
                *,
                user:profiles(*),
                likes:post_likes(count),
                comments:post_comments(count)
            `)
            .eq('id', params.id)
            .single();

        if (error || !postData) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load the post.' });
            setLoading(false);
            return;
        }

        const formattedPost = {
            ...postData,
            user: Array.isArray(postData.user) ? postData.user[0] : postData.user,
            likes: { count: postData.likes[0]?.count || 0 },
            comments: { count: postData.comments[0]?.count || 0 },
        } as Post;
        
        setPost(formattedPost);
        setLikes(formattedPost.likes.count);
        
        if (user) {
            const { data: likeData, error: likeError } = await supabase
                .from('post_likes')
                .select('id')
                .eq('post_id', params.id)
                .eq('user_id', user.id)
                .single();
            if (likeData) setIsLiked(true);
        }

        setLoading(false);
    }
    init();
  }, [params.id, supabase, toast]);

  const handleLike = async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "You must be logged in to like a post." });
      return;
    }
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes(newLikedState ? likes + 1 : likes - 1);
    
    if (newLikedState) {
        await supabase.from('post_likes').insert({ post_id: post!.id, user_id: currentUser.id });
    } else {
        await supabase.from('post_likes').delete().match({ post_id: post!.id, user_id: currentUser.id });
    }
  };


  if (loading) {
     return (
        <div className="flex h-dvh w-full items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
    );
  }

  if (!post) {
     return (
        <div className="flex h-dvh w-full items-center justify-center bg-background p-4 text-center">
            <div>
              <p className="text-lg font-semibold">Post not found</p>
              <p className="text-muted-foreground">This post may have been deleted or the link is incorrect.</p>
              <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-black">
      <Card className="rounded-xl overflow-hidden w-full max-w-lg max-h-[95dvh] flex flex-col">
        <CardHeader className="p-4 flex-row items-center gap-3">
          <Link href={`/profile/${post.user.username}`}>
              <Avatar>
                <AvatarImage src={post.user.avatar_url} data-ai-hint="person portrait" />
                <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
          </Link>
          <div className="flex-1">
              <Link href={`/profile/${post.user.username}`}>
                  <p className="font-semibold hover:underline">{post.user.username}</p>
              </Link>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft />
          </Button>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 min-h-0">
           <div className="relative w-full h-full bg-muted">
            {post.media_type === 'video' ? (
                <video src={post.media_url} controls autoPlay loop className="w-full h-full object-contain" />
            ) : (
                <Image 
                    src={post.media_url}
                    alt={`Post by ${post.user.username}`}
                    fill
                    className="object-contain"
                    data-ai-hint="user content"
                    priority
                />
            )}
            </div>
        </CardContent>

        <div className="p-4 border-t">
          <p className="text-sm">{post.caption}</p>
        </div>

        <CardFooter className="p-2 flex justify-between border-t">
          <div className="flex items-center gap-2">
              <Button variant="ghost" className="flex items-center gap-2" onClick={handleLike}>
                  <Heart className={cn("h-6 w-6", isLiked && "fill-red-500 text-red-500")} />
                  <span className="text-sm">{likes}</span>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                      <MessageCircle className="h-6 w-6" />
                      <span className="text-sm">{post.comments.count}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0">
                    <CommentSheet post={post} currentUser={currentUser} />
                </SheetContent>
              </Sheet>
          </div>
          <Sheet>
              <SheetTrigger asChild>
                  <Button variant="ghost">
                      <Send className="h-6 w-6" />
                  </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0">
                  <ShareSheet post={post} currentUser={currentUser} />
              </SheetContent>
          </Sheet>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function FullScreenPostPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);

    return (
        <Suspense fallback={
            <div className="flex h-dvh w-full items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        }>
          <PostViewerContent params={params} />
        </Suspense>
    );
}
