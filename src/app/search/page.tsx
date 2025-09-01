
"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

const mockImages = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  url: `https://picsum.photos/300/300?random=${i + 1}`,
  source: "picsum.photos",
}));

const mockVideos = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    thumbnail: `https://picsum.photos/300/200?random=${i + 20}`,
    title: `Educational Video Title ${i + 1}`
}));


function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  if (!query) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        <p>Start searching for images and videos.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="images" className="w-full">
        <div className="px-4 py-2 border-b">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="images">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Images
                </TabsTrigger>
                <TabsTrigger value="videos">
                    <Video className="mr-2 h-4 w-4" />
                    Videos
                </TabsTrigger>
            </TabsList>
        </div>

      <TabsContent value="images">
        <div className="p-2 grid grid-cols-3 gap-1">
          {mockImages.map((img) => (
            <div key={img.id} className="relative aspect-square">
              <Image
                src={img.url}
                alt={`Search result for ${query}`}
                fill
                className="object-cover rounded-md"
                data-ai-hint="search result"
              />
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="videos">
        <div className="p-2 grid grid-cols-2 gap-2">
           {mockVideos.map((video) => (
            <div key={video.id} className="relative group">
                <div className="relative aspect-video w-full overflow-hidden rounded-md">
                    <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        data-ai-hint="video thumbnail"
                    />
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Video className="h-8 w-8 text-white/80" />
                    </div>
                </div>
                <p className="text-xs mt-1 font-medium truncate">{video.title}</p>
            </div>
           ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function SearchPage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4 text-center">
          <Link href="/ai-tool">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Educational Search</h1>
          <div className="w-10"></div> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<p>Loading...</p>}>
            <SearchResultsComponent />
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
