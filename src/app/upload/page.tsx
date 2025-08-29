"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { BottomNav } from "@/components/bottom-nav";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handlePost = () => {
    // Handle post submission logic here
    console.log("Posting:", { caption, file: selectedFile });
    // Reset state after post
    setCaption("");
    handleRemoveImage();
  };

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 relative">
          <h1 className="text-xl font-bold">Create your own post</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/50"
            >
              {previewUrl ? (
                <>
                  <Image
                    src={previewUrl}
                    alt="Selected preview"
                    fill
                    className="object-contain rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImagePlus className="mx-auto h-12 w-12" />
                  <p className="mt-2 text-sm font-medium">Click to upload a video or photo</p>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*"
            />

            <div>
               <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Gallery
               </Button>
            </div>

            <div>
              <Textarea
                placeholder="Write caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>

            <div>
              <Button
                className="w-full"
                onClick={handlePost}
                disabled={!selectedFile || !caption}
              >
                Post
              </Button>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
