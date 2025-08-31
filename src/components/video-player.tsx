
"use client";

import type { Post } from "@/lib/data";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Music, Play, Send, Pause } from "lucide-react";
import { VideoDescription } from "./video-description";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { CommentSheet } from "./comment-sheet";
import { ShareSheet } from "./share-sheet";
import Link from "next/link";

type VideoPlayerProps = {
  post: Post;
};

export function VideoPlayer({ post }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlaying(entry.isIntersecting);
        if (entry.isIntersecting) {
            videoRef.current?.play();
        } else {
            videoRef.current?.pause();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const togglePlay = () => {
      if (videoRef.current) {
          if (videoRef.current.paused) {
              videoRef.current.play();
              setIsPlaying(true);
          } else {
              videoRef.current.pause();
              setIsPlaying(false);
          }
      }
  }


  const formatCount = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num;
  };

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black" onClick={togglePlay}>
       {post.media_type === 'video' ? (
           <video
            ref={videoRef}
            src={post.media_url}
            loop
            className="h-full w-full object-cover"
            playsInline // Important for iOS
           />
       ) : (
            <Image
                src={post.media_url}
                alt={`Post by ${post.user.username}`}
                fill
                className="object-cover"
                priority
            />
       )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none",
          isPlaying ? "opacity-0" : "opacity-100"
        )}
      >
        <Play className="h-20 w-20 text-white/50" fill="currentColor" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-20 md:pb-4 text-white">
        <div className="flex items-end justify-between">
          <div className="w-full max-w-[calc(100%-60px)] space-y-3">
             <VideoDescription username={post.user.username} descriptionMyanmar={post.caption} />
             <div className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <p className="text-sm font-medium">Original Sound - {post.user.username}</p>
             </div>
          </div>
          <div className="flex flex-col items-center space-y-6">
            <Link href={`/profile/${post.user.username}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center">
                <Avatar className="h-12 w-12 border-2 border-white">
                  <AvatarImage src={post.user.avatar} data-ai-hint="person portrait" />
                  <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </Link>

            <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center text-center">
              <span className={cn(
                  "flex items-center justify-center h-12 w-12 rounded-full bg-white/20 transition-colors",
                  isLiked && "bg-primary"
                )}>
                  <Heart className={cn("h-7 w-7 transition-transform", isLiked && "scale-110 fill-white")} />
              </span>
              <span className="text-xs font-semibold mt-2">{formatCount(likes)}</span>
            </button>
            <Sheet>
              <SheetTrigger asChild>
                <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center text-center cursor-pointer">
                    <span className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20">
                        <MessageCircle className="h-7 w-7" />
                    </span>
                    <span className="text-xs font-semibold mt-2">{formatCount(post.comments?.length || 0)}</span>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0" onClick={(e) => e.stopPropagation()}>
                  <CommentSheet post={post} />
              </SheetContent>
            </Sheet>
            
            <Sheet>
              <SheetTrigger asChild>
                 <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center text-center cursor-pointer">
                    <span className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20">
                        <Send className="h-7 w-7" />
                    </span>
                    <span className="text-xs font-semibold mt-2">{formatCount(post.shares || 0)}</span>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0" onClick={(e) => e.stopPropagation()}>
                <ShareSheet />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}
