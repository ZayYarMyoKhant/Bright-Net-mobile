
"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { pexelsSearch } from "@/ai/flows/pexels-search-flow";
import { useToast } from "@/hooks/use-toast";


type ImageResult = {
    id: number;
    url: string;
    alt: string | null;
    photographer: string;
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


function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<ImageResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (query) {
      startTransition(async () => {
        try {
          const result = await pexelsSearch({ query });
          setImages(result.images);
        } catch (error) {
          console.error("Search failed", error);
          toast({
            variant: "destructive",
            title: "Search Failed",
            description: "Could not fetch images from Pexels. Please check your API key.",
          });
        }
      });
    }
  }, [query, toast]);


  if (!query) {
    return (
       <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
          <Search className="h-12 w-12" />
          <p className="mt-4 text-lg">Search for anything</p>
          <p className="text-sm">Enter a query above to start searching for images.</p>
        </div>
    )
  }

  if (isPending) {
    return (
        <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="mt-4 text-lg">Searching for "{query}"...</p>
        </div>
    )
  }

  if (images.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground">
          <ImageOff className="h-12 w-12" />
          <p className="mt-4 text-lg">No results found for "{query}"</p>
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
            <TabsTrigger value="videos" className="pb-3" disabled>
              <VideoIcon className="mr-2 h-4 w-4" />
              Videos
            </TabsTrigger>
          </TabsList>
          <main className="flex-1 overflow-y-auto">
            <TabsContent value="images" className="mt-0">
               <Suspense fallback={<div>Loading search component...</div>}>
                  <SearchResultsComponent />
               </Suspense>
            </TabsContent>
          </main>
        </Tabs>
      </div>
      <BottomNav />
    </>
  );
}
