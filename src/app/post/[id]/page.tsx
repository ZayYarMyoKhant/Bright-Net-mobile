

"use client";

import { use, Suspense, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Heart, MessageCircle, Send, MoreVertical, Trash2 } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


function PostViewerContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);


  const fetchPost = useCallback(async (user: User | null) => {
    setLoading(true);
    const { data: postData, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*), likes:post_likes(count), comments:post_comments(count)')
      .eq('id', params.id)
      .single();

    if (error || !postData) {
      toast({ variant: "destructive", title: "Post not found", description: error?.message });
      setPost(null);
    } else {
        const { data: userLike } = user ? await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .eq('post_id', postData.id)
          .single() : { data: null };
        
        // @ts-ignore
        setIsOwner(user?.id === postData.profiles.id);

        const processedPost: Post = {
          id: postData.id,
          // @ts-ignore
          user: postData.profiles,
          media_url: postData.media_url,
          media_type: postData.media_type,
          caption: postData.caption,
          created_at: postData.created_at,
          // @ts-ignore
          likes: postData.likes[0]?.count || 0,
          // @ts-ignore
          comments: postData.comments[0]?.count || 0,
          isLiked: !!userLike,
        };
        setPost(processedPost);
        setLikesCount(processedPost.likes);
        setCommentsCount(processedPost.comments);
        setIsLiked(processedPost.isLiked);
    }
    setLoading(false);
  }, [params.id, supabase, toast]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
        fetchPost(user);
    });
  }, [fetchPost, supabase.auth]);

  const handleLike = async () => {
    if (!currentUser || !post) {
      toast({ variant: "destructive", title: "You must be logged in to like a post." });
      return;
    }
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);

    if (newLikedState) {
        const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id });
        if (error) {
            toast({ variant: "destructive", title: "Failed to like post", description: error.message });
            setIsLiked(false); // Revert
            setLikesCount(likesCount); // Revert
        }
    } else {
        const { error } = await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUser.id });
        if (error) {
            toast({ variant: "destructive", title: "Failed to unlike post", description: error.message });
            setIsLiked(true); // Revert
            setLikesCount(likesCount); // Revert
        }
    }
  };
  
  const handleDeletePost = async () => {
    if (!post) return;

    // 1. Delete from DB
    const { error: dbError } = await supabase.from('posts').delete().eq('id', post.id);

    if (dbError) {
        toast({ variant: "destructive", title: "Delete Failed", description: dbError.message });
        return;
    }

    // 2. Delete from Storage
    const filePath = post.media_url.substring(post.media_url.lastIndexOf('public/') + 'public/'.length);
    const { error: storageError } = await supabase.storage.from('posts').remove([filePath]);

     if (storageError) {
        // Log this error, but don't block the user, as the main DB entry is gone.
        console.error("Storage deletion failed:", storageError);
    }

    toast({ title: "Post Deleted", description: "Your post has been removed." });
    router.push('/home'); // Redirect after deletion
    router.refresh();
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
          <Link href={`/profile/${post.user.id}`}>
              <Avatar>
                <AvatarImage src={post.user.avatar_url} data-ai-hint="person portrait" />
                <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
          </Link>
          <div className="flex-1">
              <Link href={`/profile/${post.user.id}`}>
                  <p className="font-semibold hover:underline">{post.user.username}</p>
              </Link>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <AlertDialog>
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                             </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your post.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft />
            </Button>
          </div>
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
                  <span className="text-sm">{likesCount}</span>
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                      <MessageCircle className="h-6 w-6" />
                      <span className="text-sm">{commentsCount}</span>
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
