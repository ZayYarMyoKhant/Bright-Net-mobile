
"use client";

import { Suspense, useState, useTransition, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video as VideoIcon,
  Search,
  Loader2,
  ImageOff,
  VideoOff,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { pexelsImageSearch } from "@/ai/flows/pexels-search-flow";
import { pexelsVideoSearch } from "@/ai/flows/pexels-search-flow";
import { useToast } from "@/hooks/use-toast";


type ImageResult = {
    id: number;
    url: string;
    alt: string | null;
    photographer: string;
};

type VideoResult = {
    id: number;
    url: string;
    image: string;
    user: { name: string };
};

function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Search for images and videos..."
        className="w-full pl-10"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}


function ImageResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<ImageResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (query) {
      startTransition(async () => {
        try {
          const result = await pexelsImageSearch({ query });
          setImages(result.images);
        } catch (error) {
          console.error("Image search failed", error);
          toast({
            variant: "destructive",
            title: "Image Search Failed",
            description: "Could not fetch images. Please check your API key or network.",
          });
        }
      });
    }
  }, [query, toast]);


  if (isPending) {
    return (
        <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="mt-4 text-lg">Searching for images of "{query}"...</p>
        </div>
    )
  }

  if (images.length === 0 && query) {
      return (
        <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
          <ImageOff className="h-12 w-12" />
          <p className="mt-4 text-lg">No images found for "{query}"</p>
          <p className="text-sm">Try a different search term.</p>
        </div>
      )
  }

  return (
      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img) => (
          <Link
            href={`/search/image/${encodeURIComponent(img.url)}`}
            key={img.id}
          >
            <div className="relative aspect-square group">
              <Image
                src={img.url}
                alt={img.alt || `Photo by ${img.photographer}`}
                fill
                className="object-cover rounded-md"
                data-ai-hint="search result"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-xs truncate">by {img.photographer}</p>
                </div>
            </div>
          </Link>
        ))}
      </div>
  )
}

function VideoResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [isPending, startTransition] = useTransition();
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (query) {
      startTransition(async () => {
        try {
          const result = await pexelsVideoSearch({ query });
          setVideos(result.videos);
        } catch (error) {
          console.error("Video search failed", error);
          toast({
            variant: "destructive",
            title: "Video Search Failed",
            description: "Could not fetch videos. Please check your API key or network.",
          });
        }
      });
    }
  }, [query, toast]);


  if (isPending) {
    return (
        <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="mt-4 text-lg">Searching for videos of "{query}"...</p>
        </div>
    )
  }

  if (videos.length === 0 && query) {
      return (
        <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
          <VideoOff className="h-12 w-12" />
          <p className="mt-4 text-lg">No videos found for "{query}"</p>
          <p className="text-sm">Try a different search term.</p>
        </div>
      )
  }

  return (
      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {videos.map((vid) => (
          <Link
            href={`/search/video/${encodeURIComponent(vid.url)}`}
            key={vid.id}
          >
            <div className="relative aspect-video group rounded-md overflow-hidden bg-muted">
              <Image
                src={vid.image}
                alt={`Video by ${vid.user.name}`}
                fill
                className="object-cover"
                data-ai-hint="video thumbnail"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <VideoIcon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-xs truncate font-semibold">by {vid.user.name}</p>
                </div>
            </div>
          </Link>
        ))}
      </div>
  )
}

function SearchPlaceholder() {
  return (
     <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
        <Search className="h-12 w-12" />
        <p className="mt-4 text-lg">Search for anything</p>
        <p className="text-sm">Enter a query above to start searching for images and videos.</p>
      </div>
  )
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b px-4">
          <Link href="/">
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
               <Suspense fallback={<Loader2 className="m-auto mt-10 h-8 w-8 animate-spin" />}>
                  {query ? <ImageResults /> : <SearchPlaceholder />}
               </Suspense>
            </TabsContent>
             <TabsContent value="videos" className="mt-0">
               <Suspense fallback={<Loader2 className="m-auto mt-10 h-8 w-8 animate-spin" />}>
                  {query ? <VideoResults /> : <SearchPlaceholder />}
               </Suspense>
            </TabsContent>
          </main>
        </Tabs>
      </div>
      <BottomNav />
    </>
  );
}
