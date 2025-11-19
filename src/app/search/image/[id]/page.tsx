
"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

function ImageViewer({ imageUrl }: { imageUrl: string }) {
    const router = useRouter();

    const handleDownload = async () => {
        try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        } catch (error) {
        console.error("Download failed:", error);
        alert("Failed to download image.");
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-black text-white">
        <header className="absolute top-0 left-0 right-0 z-10 flex h-16 flex-shrink-0 items-center justify-between px-4 bg-gradient-to-b from-black/50 to-transparent">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-bold">Image Preview</h1>
            <div className="w-10"></div>
        </header>

        <main className="flex-1 relative">
            <Image
            src={imageUrl}
            alt={`AI Generated Image`}
            fill
            className="object-contain"
            data-ai-hint="full screen image"
            />
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


export default function ImageViewerPage({ params }: { params: { id: string } }) {
  const imageUrl = decodeURIComponent(params.id);

  return (
    <Suspense fallback={
        <div className="flex h-dvh w-full items-center justify-center bg-black">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
    }>
        <ImageViewer imageUrl={imageUrl} />
    </Suspense>
  );
}
