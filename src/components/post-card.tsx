
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Send, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CommentSheet } from "./comment-sheet";
import { ShareSheet } from "./share-sheet";
import type { Post } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

export function PostCard({ post: initialPost }: { post: Post }) {
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(initialPost.isLiked);
  const [likesCount, setLikesCount] = useState(initialPost.likes.count);
  const [commentsCount, setCommentsCount] = useState(initialPost.comments.count);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    fetchUser();
  }, [supabase]);
  
  const handleLike = async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "You must be logged in to like a post." });
      return;
    }
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(newLikedState ? likesCount + 1 : likesCount - 1);

    if (newLikedState) {
      // Add like to the database
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: currentUser.id });
      if (error) {
        // Revert UI on error
        setIsLiked(false);
        setLikesCount(likesCount);
        console.error("Error liking post:", error);
      }
    } else {
      // Remove like from the database
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .match({ post_id: post.id, user_id: currentUser.id });
      if (error) {
        // Revert UI on error
        setIsLiked(true);
        setLikesCount(likesCount);
        console.error("Error unliking post:", error);
      }
    }
  };
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Card className="rounded-xl overflow-hidden">
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
        <Button variant="ghost" size="icon">
            <MoreHorizontal />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        <p className="px-4 pb-3 text-sm">{post.caption}</p>
        <Link href={`/post/${post.id}`}>
            <div className="relative w-full aspect-[4/3] bg-muted">
                <Image 
                    src={post.media_url}
                    alt={`Post by ${post.user.username}`}
                    fill
                    className="object-cover"
                    data-ai-hint="user content"
                    priority
                />
            </div>
        </Link>
      </CardContent>

      <CardFooter className="p-2 flex justify-between">
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
  )
}
