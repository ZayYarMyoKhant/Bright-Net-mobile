
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "./ui/avatar";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Send } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function PostCard({ post }: { post: Post }) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
    });
  }, [supabase.auth]);
  
  const handleLike = async () => {
    if (!currentUser) {
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
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardHeader className="p-4 flex-row items-center gap-3">
        <Link href={`/profile/${post.user.id}`}>
            <Avatar className="h-10 w-10" profile={post.user}>
            </Avatar>
        </Link>
        <div className="flex-1">
            <Link href={`/profile/${post.user.id}`}>
                <p className="font-semibold hover:underline">{post.user.username}</p>
            </Link>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
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
