
'use client';

import { Suspense, useState } from 'react';
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";
import { getVideoPosts } from '@/lib/data';
import { VideoDescription } from '@/components/video-description';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send } from 'lucide-react';
import Image from 'next/image';

function VideoFeed() {
    const posts = getVideoPosts();
    const [currentPostIndex, setCurrentPostIndex] = useState(0);

    if (posts.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-white">
                <p>No videos to show.</p>
            </div>
        )
    }

    const currentPost = posts[currentPostIndex];

    return (
        <div className="relative h-full w-full snap-y snap-mandatory overflow-y-scroll">
            <div className="relative h-full w-full snap-start" id={`post-${currentPost.id}`}>
                <Image
                    src={currentPost.media_url}
                    alt={`Video by ${currentPost.user.username}`}
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="dance video"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-20 left-4 right-16">
                    <VideoDescription
                        username={currentPost.user.username}
                        descriptionMyanmar={currentPost.caption}
                    />
                </div>
                <div className="absolute bottom-20 right-2 flex flex-col items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white">
                        <AvatarImage src={currentPost.user.avatar} data-ai-hint="person portrait" />
                        <AvatarFallback>{currentPost.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-center gap-1 text-white">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20">
                             <Heart className="h-8 w-8" />
                        </Button>
                        <span className="text-sm">{currentPost.likes}</span>
                    </div>
                     <div className="flex flex-col items-center gap-1 text-white">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20">
                            <MessageCircle className="h-8 w-8" />
                        </Button>
                        <span className="text-sm">{currentPost.comments.length}</span>
                    </div>
                     <div className="flex flex-col items-center gap-1 text-white">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-white/20">
                            <Send className="h-8 w-8" />
                        </Button>
                         <span className="text-sm">{currentPost.shares}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}


function FeedFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center pt-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function HomePage() {
  
  return (
    <>
      <div className="flex h-full flex-col bg-black text-foreground pb-16">
        <header className="fixed top-0 left-0 right-0 z-10 flex h-16 flex-shrink-0 items-center justify-center border-b border-zinc-800 bg-background/80 px-4 text-center backdrop-blur-sm">
           <h1 className="text-xl font-bold text-white">Bright-Net</h1>
        </header>

        <main className="flex-1 overflow-y-auto pt-16">
            <Suspense fallback={<FeedFallback />}>
              <VideoFeed />
            </Suspense>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
