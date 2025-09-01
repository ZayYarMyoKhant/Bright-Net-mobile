
"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Video, Image as ImageIcon } from "lucide-react";
import { generateMedia } from "@/ai/flows/generate-media-flow";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SearchResultsComponent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<{ imageUrl: string; videoUrl: string; } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      startTransition(async () => {
        setError(null);
        setResults(null);
        try {
          const mediaResult = await generateMedia(query);
          setResults(mediaResult);
        } catch (e) {
          console.error(e);
          setError("Failed to generate media. The model may be unavailable. Please try again later.");
        }
      });
    }
  }, [query]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center pt-10 text-center text-muted-foreground space-y-4">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="font-semibold">Generating media for "{query}"...</p>
        <p className="text-sm">This may take a minute, especially the video.</p>
      </div>
    );
  }
  
  if (error) {
     return (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
     )
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center pt-10 text-center">
        <p className="mt-4 text-sm text-muted-foreground">Start by searching for a topic.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {results.imageUrl && (
        <Card>
          <CardContent className="p-2">
            <div className="relative aspect-video w-full">
              <ImageIcon className="absolute top-2 left-2 h-5 w-5 text-white/80 bg-black/50 p-1 rounded" />
              <img src={results.imageUrl} alt={`Generated image for ${query}`} className="w-full h-full object-cover rounded-md" />
            </div>
          </CardContent>
        </Card>
      )}
      {results.videoUrl && (
        <Card>
          <CardContent className="p-2">
             <div className="relative aspect-video w-full">
              <Video className="absolute top-2 left-2 h-5 w-5 text-white/80 bg-black/50 p-1 rounded" />
              <video src={results.videoUrl} className="w-full h-full object-cover rounded-md" autoPlay loop muted playsInline />
            </div>
          </CardContent>
        </Card>
      )}
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
          <h1 className="text-xl font-bold">Educational Search</h1>
          <div className="w-10"></div> {/* Spacer */}
        </header>
        
        <main className="flex-1 overflow-y-auto px-4">
           <Suspense fallback={<p>Loading...</p>}>
              <SearchResultsComponent />
           </Suspense>
        </main>
      </div>
      <BottomNav />
    </>
  )
}
