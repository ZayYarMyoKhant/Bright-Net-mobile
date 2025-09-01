
'use client';

import { Suspense } from 'react';
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostFeed } from '@/components/post-feed';
import { VideoFeed } from '@/components/video-feed';

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
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="fixed top-0 left-0 right-0 z-10 flex h-16 flex-shrink-0 items-center justify-center bg-background/80 px-4 text-center backdrop-blur-sm">
           <Tabs defaultValue="news" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="lite">Lite</TabsTrigger>
            </TabsList>
           </Tabs>
        </header>

        <main className="flex-1 overflow-y-auto pt-16">
           <Tabs defaultValue="news" className="w-full">
            <TabsContent value="news">
                 <Suspense fallback={<FeedFallback />}>
                    <PostFeed />
                </Suspense>
            </TabsContent>
            <TabsContent value="lite">
                 <Suspense fallback={<FeedFallback />}>
                    <VideoFeed />
                 </Suspense>
            </TabsContent>
           </Tabs>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
