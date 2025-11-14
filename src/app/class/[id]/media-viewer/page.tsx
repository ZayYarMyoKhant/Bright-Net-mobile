
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { Suspense } from "react";

// This function is required for static export
export async function generateStaticParams() {
  return [];
}

function MediaViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mediaUrl = searchParams.get('url');
  const mediaType = searchParams.get('type');

  if (!mediaUrl || !mediaType) {
    return (
      <div className="flex h-dvh flex-col bg-black text-white items-center justify-center">
        <p>Media not found.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `class-media-${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download media.");
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <header className="absolute top-0 left-0 right-0 z-10 flex h-16 flex-shrink-0 items-center justify-between px-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold">Media Preview</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        {mediaType.startsWith('image') ? (
          <Image
            src={mediaUrl}
            alt="Class Media"
            fill
            className="object-contain"
            data-ai-hint="full screen image"
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

      <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <Button className="w-full" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </footer>
    </div>
  );
}

export default function MediaViewerPage() {
    return (
        <Suspense fallback={<div>Loading media...</div>}>
            <MediaViewerContent />
        </Suspense>
    )
}
