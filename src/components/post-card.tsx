
"use client";

import type { Post } from "@/lib/data";
import { useState } from "react";
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


export function PostCard({ post }: { post: Post }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Card className="rounded-xl overflow-hidden">
      <CardHeader className="p-4 flex-row items-center gap-3">
        <Link href={`/profile/${post.user.username}`}>
            <Avatar>
              <AvatarImage src={post.user.avatar} data-ai-hint="person portrait" />
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
      </CardContent>

      <CardFooter className="p-2 flex justify-between">
         <div className="flex items-center gap-2">
            <Button variant="ghost" className="flex items-center gap-2" onClick={handleLike}>
                <Heart className={cn("h-6 w-6", isLiked && "fill-red-500 text-red-500")} />
                <span className="text-sm">{likes}</span>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-sm">{post.comments?.length || 0}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0">
                  <CommentSheet post={post} />
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
                <ShareSheet />
            </SheetContent>
         </Sheet>
      </CardFooter>
    </Card>
  )
}
