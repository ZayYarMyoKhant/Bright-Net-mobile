
"use client";

import { useState, useRef, useEffect } from 'react';
import { VideoDescription } from '@/components/video-description';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Loader2, VideoOff, VolumeOff, Music } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

const VideoPost = ({ post, index }: { post: Post; index: number }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes.count || 0);
    const [isMuted, setIsMuted] = useState(index !== 0); // Mute all videos except the first one
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, [supabase]);

     useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5 // 50% of the video is visible
        };

        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.play().catch(e => console.error("Autoplay failed", e));
                    setIsMuted(false);
                    (entry.target as HTMLVideoElement).muted = false;
                } else {
                    entry.target.pause();
                }
            });
        };

        const observer = new IntersectionObserver(callback, options);
        observer.observe(video);

        return () => {
            observer.unobserve(video);
        };
    }, []);

    const handleLike = () => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "You must be logged in to like a post." });
            return;
        }
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            const newMutedState = !videoRef.current.muted;
            videoRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
        }
    };


    return (
        <div key={post.id} className="relative h-full w-full snap-start flex-shrink-0" id={`post-${post.id}`} onClick={toggleMute}>
            <video
                ref={videoRef}
                src={post.media_url}
                loop
                playsInline
                className="w-full h-full object-cover"
            />
             {isMuted && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full pointer-events-none">
                    <VolumeOff className="h-8 w-8 text-white" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-20 left-4 right-16 pointer-events-none">
                 <VideoDescription
                    username={post.user.username}
                    descriptionMyanmar={post.caption}
                />
                 <div className="flex items-center gap-2 mt-2">
                    <Music className="h-4 w-4 text-white" />
                    <p className="text-sm text-white">Original sound - {post.user.username}</p>
                </div>
            </div>
            <div className="absolute bottom-20 right-2 flex flex-col items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={post.user.avatar_url} data-ai-hint="person portrait" />
                    <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-1 text-white">
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20" onClick={(e) => { e.stopPropagation(); handleLike(); }}>
                        <Heart className={cn("h-8 w-8", isLiked && "fill-red-500 text-red-500")} />
                    </Button>
                    <span className="text-sm font-semibold shadow-black [text-shadow:0_1px_2px_var(--tw-shadow-color)]">{likesCount}</span>
                </div>
                 <div className="flex flex-col items-center gap-1 text-white">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20" onClick={(e) => e.stopPropagation()}>
                                <MessageCircle className="h-8 w-8" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0">
                            <CommentSheet post={post} currentUser={currentUser}/>
                        </SheetContent>
                    </Sheet>
                    <span className="text-sm font-semibold shadow-black [text-shadow:0_1px_2px_var(--tw-shadow-color)]">{post.comments.count}</span>
                </div>
                 <div className="flex flex-col items-center gap-1 text-white">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20" onClick={(e) => e.stopPropagation()}>
                                <Send className="h-8 w-8" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0">
                            <ShareSheet post={post} currentUser={currentUser} />
                        </SheetContent>
                    </Sheet>
                     <span className="text-sm font-semibold shadow-black [text-shadow:0_1px_2px_var(--tw-shadow-color)]">Share</span>
                </div>
            </div>
        </div>
    )
}

export function VideoFeed({ posts, loading }: { posts: Post[], loading: boolean }) {
    
    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center pt-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center pt-20 text-center text-muted-foreground">
                 <VideoOff className="h-12 w-12" />
                <p className="mt-4 font-semibold">No Lite Posts Yet</p>
                <p className="text-sm">Be the first to upload a video!</p>
            </div>
        )
    }

    return (
        <div className="relative h-[calc(100dvh-8rem)] w-full snap-y snap-mandatory overflow-y-scroll bg-black">
            {posts.map((post, index) => (
                <VideoPost key={post.id} post={post} index={index} />
            ))}
        </div>
    );
}
