
"use client";

import { use, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

function VideoPlayerPageContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const videoUrl = decodeURIComponent(params.id);

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <header className="absolute top-0 left-0 right-0 z-10 flex h-16 flex-shrink-0 items-center justify-between px-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold">Video Preview</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          className="w-full h-auto max-h-full"
        />
      </main>

      <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <a href={videoUrl} download>
          <Button className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </a>
      </footer>
    </div>
  );
}

export default function VideoViewerPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  return (
    <Suspense fallback={
        <div className="flex h-dvh w-full items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
    }>
      <VideoPlayerPageContent params={params} />
    </Suspense>
  );
}

