
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";

export default function VideoViewerPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  // Using a placeholder video URL. In a real app, you'd fetch this based on the ID.
  const videoUrl = `https://videos.pexels.com/video-files/2022395/2022395-hd_1280_720_25fps.mp4`;

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
        <a href={videoUrl} download={`video-${params.id}.mp4`}>
          <Button className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </a>
      </footer>
    </div>
  );
}
