
"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const images = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  url: `https://picsum.photos/300/300?random=${i + 1}`,
}));

const videos = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  title: `Educational Video ${i + 1}`,
  thumbnail: `https://picsum.photos/400/225?random=${i + 20}`,
}));

function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // In a real app, this would trigger the search
      console.log("Searching for:", query);
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full">
      <Input
        placeholder="Search for images and videos..."
        className="w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}

export default function SearchPage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b px-4">
          <Link href="/ai-tool">
            <Button variant="ghost" size="icon" className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Educational Search</h1>
        </header>

         <div className="p-4 border-b">
            <Suspense fallback={<div>Loading...</div>}>
                <SearchBar />
            </Suspense>
        </div>

        <Tabs defaultValue="images" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0 rounded-none">
            <TabsTrigger value="images" className="pb-3">
              <ImageIcon className="mr-2 h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="videos" className="pb-3">
              <VideoIcon className="mr-2 h-4 w-4" />
              Videos
            </TabsTrigger>
          </TabsList>
          <main className="flex-1 overflow-y-auto">
            <TabsContent value="images" className="mt-0">
              <div className="p-2 grid grid-cols-3 gap-1">
                {images.map((img) => (
                  <Link
                    href={`/search/image/${encodeURIComponent(img.url)}`}
                    key={img.id}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={img.url}
                        alt={`Search result image ${img.id}`}
                        fill
                        className="object-cover rounded-md"
                        data-ai-hint="search result"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="videos" className="mt-0">
              <div className="p-2 grid grid-cols-2 gap-2">
                {videos.map((video) => (
                   <Link href={`/search/video/${video.id}`} key={video.id}>
                      <div className="rounded-lg overflow-hidden group">
                          <div className="relative aspect-video bg-muted">
                              <Image 
                                  src={video.thumbnail} 
                                  alt={video.title} 
                                  fill
                                  className="object-cover"
                                  data-ai-hint="video thumbnail"
                              />
                          </div>
                          <div className="p-2">
                              <p className="text-sm font-semibold truncate group-hover:underline">{video.title}</p>
                          </div>
                      </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </main>
        </Tabs>
      </div>
      <BottomNav />
    </>
  );
}
