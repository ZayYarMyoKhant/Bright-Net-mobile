
"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Search,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { generateMedia, GenerateMediaOutput } from "@/ai/flows/generate-media-flow";
import { useToast } from "@/hooks/use-toast";

function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [results, setResults] = useState<GenerateMediaOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSearch = (newQuery: string) => {
    if (!newQuery || newQuery.trim() === "") return;

    startTransition(async () => {
      setResults(null);
      try {
        const res = await generateMedia({ prompt: newQuery });
        setResults(res);
      } catch (error) {
        console.error("Failed to generate media:", error);
        toast({
          variant: "destructive",
          title: "Search Failed",
          description:
            "Could not generate images. The model may have safety restrictions.",
        });
      }
    });
  };
  
  useState(() => {
    if (query) {
      handleSearch(query);
    }
  });


  if (isPending) {
    return (
      <div className="text-center p-10 text-muted-foreground flex flex-col items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="font-bold">Generating results for "{query}"...</p>
        <p className="text-sm">This may take a moment.</p>
      </div>
    );
  }
  
  if (!query) {
    return (
        <div className="text-center p-10 text-muted-foreground">
            <p>Start searching for images and videos.</p>
        </div>
    )
  }

  if (!results || results.images.length === 0) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        <p>No results found for "{query}". Try another search.</p>
      </div>
    );
  }

  return (
    <div className="p-2 grid grid-cols-3 gap-1">
      {results.images.map((img, index) => (
        <Link
          href={`/search/image/${encodeURIComponent(img.url)}`}
          key={index}
        >
          <div className="relative aspect-square">
            <Image
              src={img.url}
              alt={`AI generated image for ${query}`}
              fill
              className="object-cover rounded-md"
              data-ai-hint="search result"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

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
        placeholder="Search for images..."
        className="pl-10 w-full"
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
          <Link href="/ai-tool" className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Suspense fallback={<div>Loading...</div>}>
            <SearchBar />
          </Suspense>
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
