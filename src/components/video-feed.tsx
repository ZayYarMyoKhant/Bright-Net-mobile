
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoDescription } from '@/components/video-description';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Loader2, VideoOff, VolumeOff, Music, Info, Volume2, Play } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CommentSheet } from "./comment-sheet";
import { ShareSheet } from "./share-sheet";
import { NativeAd } from "./native-ad";
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Card } from './ui/card';

const AdPost = () => {
    return (
        <div className="relative h-full w-full flex-shrink-0 bg-black flex flex-col items-center justify-center p-4">
             <Card className="w-full max-w-md bg-muted/20 border-muted/30 text-white">
                <div className="p-4 flex items-center gap-3">
                    <Info className="h-5 w-5 text-blue-400" />
                    <p className="text-sm font-semibold">Sponsored Content</p>
                </div>
                <NativeAd />
            </Card>
        </div>
    )
}

const VideoPost = ({ post, isActive }: { post: Post; isActive: boolean }) => {
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likes);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUser(user);
        });
    }, [supabase.auth]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isActive) {
            video.play().then(() => {
                setIsPlaying(true);
            }).catch(e => {
                if (e.name !== 'AbortError') {
                    setIsPlaying(false);
                }
            });
        } else {
            video.pause();
            video.currentTime = 0;
            setIsPlaying(false);
        }
    }, [isActive]);
    
    const handleVideoClick = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };


    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) {
          toast({ variant: "destructive", title: "You must be logged in to like a post." });
          return;
        }
        
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    
        if (newLikedState) {
          const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUser.id });
          if (error) {
            toast({ variant: "destructive", title: "Failed to like post", description: error.message });
            setIsLiked(false);
            setLikesCount(prev => prev - 1);
          }
        } else {
          const { error } = await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUser.id });
          if (error) {
            toast({ variant: "destructive", title: "Failed to unlike post", description: error.message });
            setIsLiked(true);
            setLikesCount(prev => prev + 1);
          }
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            const newMutedState = !isMuted;
            videoRef.current.muted = newMutedState;
            setIsMuted(newMutedState);
        }
    };


    return (
        <div className="relative h-full w-full flex-shrink-0" id={`post-${post.id}`} onClick={handleVideoClick}>
            <video
                ref={videoRef}
                src={post.media_url}
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
                preload="auto"
                loading="lazy"
            />
             {!isPlaying && isActive && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full pointer-events-none">
                    <Play className="h-12 w-12 text-white" />
                </div>
            )}
             <button onClick={toggleMute} className="absolute top-5 right-5 bg-black/40 p-2 rounded-full z-10">
                {isMuted ? <VolumeOff className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
             </button>
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
                <Avatar className="h-12 w-12 border-2 border-white" profile={post.user}>
                </Avatar>
                <div className="flex flex-col items-center gap-1 text-white">
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20" onClick={handleLike}>
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
                    <span className="text-sm font-semibold shadow-black [text-shadow:0_1px_2px_var(--tw-shadow-color)]">{post.comments}</span>
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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const touchStartY = useRef(0);

    const items = [];
    for (let i = 0; i < posts.length; i++) {
        items.push({ type: 'post', component: <VideoPost key={posts[i].id} post={posts[i]} isActive={false} /> }); // isActive will be handled later
        if ((i + 1) % 3 === 0 && i < posts.length - 1) {
            items.push({ type: 'ad', component: <AdPost key={`ad-${i}`} /> });
        }
    }

    const handleWheel = (e: React.WheelEvent) => {
        if (isScrolling) return;

        setIsScrolling(true);
        if (e.deltaY > 0) {
            // Scrolling down
            setCurrentIndex(prev => Math.min(prev + 1, items.length - 1));
        } else if (e.deltaY < 0) {
            // Scrolling up
            setCurrentIndex(prev => Math.max(0, prev - 1));
        }
        setTimeout(() => setIsScrolling(false), 500); // Debounce
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isScrolling) return;

        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY.current - touchEndY;

        if (Math.abs(deltaY) > 50) { // Threshold to detect swipe
            setIsScrolling(true);
            if (deltaY > 0) {
                // Swiping up
                setCurrentIndex(prev => Math.min(prev + 1, items.length - 1));
            } else {
                // Swiping down
                setCurrentIndex(prev => Math.max(0, prev - 1));
            }
            setTimeout(() => setIsScrolling(false), 500); // Debounce
        }
    };
    
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
        <div 
            className="relative h-[calc(100dvh-8rem)] w-full overflow-hidden bg-black"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="h-full w-full transition-transform duration-500 ease-out"
                style={{ transform: `translateY(-${currentIndex * 100}%)` }}
            >
                {items.map((item, index) => (
                    <div key={index} className="h-full w-full">
                        {React.cloneElement(item.component, { isActive: index === currentIndex })}
                    </div>
                ))}
            </div>
        </div>
    );
}

