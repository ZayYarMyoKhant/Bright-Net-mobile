
"use client";

import { use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

type MediaViewerParams = {
    type: 'image' | 'video';
    url: string;
};

function MediaViewerContent({ params }: { params: MediaViewerParams }) {
  const router = useRouter();
  const mediaUrl = decodeURIComponent(params.url);
  const mediaType = params.type;

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <header className="absolute top-0 left-0 right-0 z-10 flex h-16 flex-shrink-0 items-center justify-between px-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold capitalize">{mediaType} Preview</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        {mediaType === 'image' ? (
             <Image
                src={mediaUrl}
                alt="Fullscreen Media"
                fill
                className="object-contain"
                data-ai-hint="fullscreen content"
            />
        ) : (
            <video
                src={mediaUrl}
                controls
                autoPlay
                loop
                className="w-full h-auto max-h-full"
            />
        )}
      </main>
    </div>
  );
}

export default function MediaViewerPage({ params: paramsPromise }: { params: Promise<MediaViewerParams> }) {
    const params = use(paramsPromise);

    return (
        <Suspense fallback={
            <div className="flex h-dvh w-full items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        }>
          <MediaViewerContent params={params} />
        </Suspense>
    );
}

    