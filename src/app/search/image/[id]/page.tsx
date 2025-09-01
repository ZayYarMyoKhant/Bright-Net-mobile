
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";

export default function ImageViewerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const imageUrl = `https://picsum.photos/1080/1920?random=${params.id}`;

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
          alt={`Image ${params.id}`}
          fill
          className="object-contain"
          data-ai-hint="full screen image"
        />
      </main>

      <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <a href={imageUrl} download={`image-${params.id}.jpg`}>
          <Button className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </a>
      </footer>
    </div>
  );
}
