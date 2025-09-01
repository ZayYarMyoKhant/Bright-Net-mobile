
"use client";

import { useState } from 'react';
import { getVideoPosts } from '@/lib/data';
import { VideoDescription } from '@/components/video-description';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send } from 'lucide-react';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CommentSheet } from "./comment-sheet";
import { ShareSheet } from "./share-sheet";
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/data';


const VideoPost = ({ post, index }: { post: Post; index: number }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(post.likes || 0);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
    };

    return (
        <div key={post.id} className="relative h-full w-full snap-start flex-shrink-0" id={`post-${post.id}`}>
            <Image
                src={post.media_url}
                alt={`Video by ${post.user.username}`}
                fill
                className="object-cover"
                priority={index === 0}
                data-ai-hint="dance video"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-20 left-4 right-16">
                <VideoDescription
                    username={post.user.username}
                    descriptionMyanmar={post.caption}
                />
            </div>
            <div className="absolute bottom-20 right-2 flex flex-col items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={post.user.avatar} data-ai-hint="person portrait" />
                    <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-1 text-white">
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20" onClick={handleLike}>
                        <Heart className={cn("h-8 w-8", isLiked && "fill-red-500 text-red-500")} />
                    </Button>
                    <span className="text-sm">{likes}</span>
                </div>
                 <div className="flex flex-col items-center gap-1 text-white">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20">
                                <MessageCircle className="h-8 w-8" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0">
                            <CommentSheet post={post} />
                        </SheetContent>
                    </Sheet>
                    <span className="text-sm">{post.comments.length}</span>
                </div>
                 <div className="flex flex-col items-center gap-1 text-white">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20">
                                <Send className="h-8 w-8" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0">
                            <ShareSheet />
                        </SheetContent>
                    </Sheet>
                     <span className="text-sm">{post.shares}</span>
                </div>
            </div>
        </div>
    )
}

export function VideoFeed() {
    const posts = getVideoPosts();

    if (posts.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-center p-10">
                <p className="text-muted-foreground">Lite version is coming soon. <br/> Stay tuned!</p>
            </div>
        )
    }

    return (
        <div className="relative h-[calc(100dvh-8rem)] w-full snap-y snap-mandatory overflow-y-scroll">
            {posts.map((post, index) => (
                <VideoPost key={post.id} post={post} index={index} />
            ))}
        </div>
    );
}
