
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Heart, MessageCircle, Send, MoreVertical, Trash2, AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function PostViewerContent({ post: initialPost, error: initialError, currentUser }: { post: Post | null, error: string | null, currentUser: User | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(initialPost);
  const [error, setError] = useState<string | null>(initialError);
  const [isLiked, setIsLiked] = useState(initialPost?.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(initialPost?.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(initialPost?.comments ?? 0);
  const isOwner = currentUser?.id === post?.user.id;

  const handleLike = async () => {
    if (!currentUser || !post) {
      toast({ variant: "destructive", title: "You must be logged in to like a post." });
      return;
    }
    
    // Optimistic update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    if (newLikedState) {
      // Like the post
      const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id });
      if (error) {
        toast({ variant: "destructive", title: "Failed to like post", description: error.message });
        // Revert optimistic update
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } else {
      // Unlike the post
      const { error } = await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUser.id });
      if (error) {
        toast({ variant: "destructive", title: "Failed to unlike post", description: error.message });
        // Revert optimistic update
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
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

  if (error) {
     return (
        <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    <p>Could not load this post.</p>
                    <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs font-mono">{error}</pre>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  if (!post) {
     return (
        <div className="flex h-dvh w-full items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-black">
      <Card className="rounded-xl overflow-hidden w-full max-w-lg max-h-[95dvh] flex flex-col">
        <CardHeader className="p-4 flex-row items-center gap-3">
          <Link href={`/profile/${post.user.id}`}>
              <Avatar profile={post.user}>
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
        
        <CardContent className="p-0 flex-shrink flex-grow-0 basis-auto">
           <div className="relative w-full aspect-[4/3] bg-muted flex-1">
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

    