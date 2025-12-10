
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";

export default function UploadPostPage() {
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const mediaDataUrl = localStorage.getItem('customizedMedia');
    const mediaType = localStorage.getItem('customizedMediaType');

    if (mediaDataUrl && mediaType) {
      fetch(mediaDataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "customized_media", { type: mediaType });
          setMediaFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        });
      
      localStorage.removeItem('customizedMedia');
      localStorage.removeItem('customizedMediaType');
    } else {
      // If no media is passed, redirect back to create flow
      toast({ variant: 'destructive', title: 'No Media Found', description: 'Please create or select media first.' });
      router.push('/upload/customize');
    }
  }, [router, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) {
      toast({ variant: "destructive", title: "No media selected", description: "Please select a file to upload." });
      return;
    }

    startTransition(async () => {
      setUploadProgress(0);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ variant: "destructive", title: "Not authenticated", description: "You must be logged in to post." });
        setUploadProgress(null);
        return;
      }
      
      const fileExtension = mediaFile.name.split('.').pop() || (mediaFile.type.startsWith('image') ? 'jpg' : 'mp4');
      const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, mediaFile, {
        cacheControl: '3600',
        upsert: false
      });
      setUploadProgress(100);

      if (uploadError) {
        toast({ variant: "destructive", title: "Upload failed", description: uploadError.message });
        setUploadProgress(null);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaFile.type.startsWith('image') ? 'image' : 'video',
        caption: caption,
      });

      if (insertError) {
        toast({ variant: "destructive", title: "Failed to create post", description: insertError.message });
        setUploadProgress(null);
        return;
      }

      toast({ title: "Post created successfully!" });
      router.push("/home");
      router.refresh();
      setUploadProgress(null);
    });
  };

  const isVideo = mediaFile?.type.startsWith("video");

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground">
        <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
          <button onClick={() => router.back()} className="p-2 -ml-2 absolute left-4">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold mx-auto">Create your own post</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/50 overflow-hidden"
            >
              {previewUrl ? (
                <>
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      className="h-full w-full object-contain"
                      controls={false}
                      autoPlay
                      loop
                      muted
                    />
                  ) : (
                    <Image
                      src={previewUrl}
                      alt="Selected preview"
                      fill
                      className="object-contain"
                      data-ai-hint="user upload"
                    />
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                  <p className="mt-2 text-sm font-medium">Loading media...</p>
                </div>
              )}
            </div>

            <div>
              <Textarea
                name="caption"
                placeholder="Write caption"
                className="min-h-[100px] text-base"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isPending}
              />
            </div>
            
            <div className="pt-4 space-y-4">
               {isPending && uploadProgress !== null ? (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-center text-sm text-muted-foreground">
                      Uploading... {uploadProgress.toFixed(0)}%
                    </p>
                  </div>
                ) : (
                  <Button className="w-full" type="submit" disabled={isPending || !mediaFile}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Post"
                    )}
                  </Button>
                )}
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
