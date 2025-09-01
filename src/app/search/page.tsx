
"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Video, Image as ImageIcon, Globe, FileText } from "lucide-react";
import { googleSearch, GoogleSearchOutput } from "@/ai/flows/google-search-flow";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<GoogleSearchOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      startTransition(async () => {
        setError(null);
        setResults(null);
        try {
          const searchResult = await googleSearch({ query });
          setResults(searchResult);
        } catch (e) {
          console.error(e);
          setError("Failed to fetch search results. Please try again.");
        }
      });
    }
  }, [query]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center pt-10 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Searching for "{query}"...</p>
      </div>
    );
  }
  
  if (error) {
     return (
        <div className="flex flex-col items-center justify-center pt-10 text-center text-destructive">
            <p>{error}</p>
        </div>
     )
  }

  if (!results || results.results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-10 text-center">
        <p className="mt-4 text-sm text-muted-foreground">No results found for "{query}".</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
        {results.results.map((item, index) => (
             <a href={item.link} target="_blank" rel="noopener noreferrer" key={index} className="block">
                <Card className="hover:bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base text-blue-600 dark:text-blue-400">{item.title}</CardTitle>
                         <p className="text-xs text-green-700 dark:text-green-500 truncate">{item.link}</p>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{item.snippet}</p>
                    </CardContent>
                </Card>
            </a>
        ))}
    </div>
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
          <h1 className="text-xl font-bold">Search anything</h1>
          <div className="w-10"></div> {/* Spacer */}
        </header>
        
        <main className="flex-1 overflow-y-auto px-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-background z-10">
              <TabsTrigger value="all">
                <Globe className="mr-2 h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="mr-2 h-4 w-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon className="mr-2 h-4 w-4" />
                Image
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
                <Suspense fallback={<p>Loading...</p>}>
                    <SearchResultsComponent />
                </Suspense>
            </TabsContent>
            <TabsContent value="video">
              <div className="flex flex-col items-center justify-center pt-10 text-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Video search is coming soon.</p>
              </div>
            </TabsContent>
            <TabsContent value="image">
              <div className="flex flex-col items-center justify-center pt-10 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">Image search is coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <BottomNav />
    </>
  )
}
