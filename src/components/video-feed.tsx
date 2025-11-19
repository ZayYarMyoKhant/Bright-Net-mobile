
"use client";

import { useState, useRef, useEffect } from 'react';
import { VideoDescription } from '@/components/video-description';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Loader2, VideoOff, VolumeOff, Music } from 'lucide-react';
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
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

const VideoPost = ({ post, index }: { post: Post; index: number }) => {
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likes);
    const [commentsCount, setCommentsCount] = useState(post.comments);
    const [isMuted, setIsMuted] = useState(index !== 0); 
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

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5 
        };

        const callback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const playPromise = entry.target.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => console.error("Autoplay failed", e));
                    }
                    if (!isMuted) {
                      (entry.target as HTMLVideoElement).muted = false;
                    }
                } else {
                    entry.target.pause();
                }
            });
        };

        const observer = new IntersectionObserver(callback, options);
        observer.observe(video);

        return () => {
            if (video) {
              observer.unobserve(video);
            }
        };
    }, [isMuted]);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
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
                muted={isMuted}
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
                    <span className="text-sm font-semibold shadow-black [text-shadow:0_1px_2px_var(--tw-shadow-color)]">{commentsCount}</span>
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
