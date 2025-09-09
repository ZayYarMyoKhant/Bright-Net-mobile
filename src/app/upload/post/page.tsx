
"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, ArrowLeft, Loader2, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function UploadPostPage() {
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setMediaFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        toast({
          variant: "destructive",
          title: "Unsupported File Type",
          description: "Please select an image or video file.",
        });
        handleRemoveMedia();
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) {
      toast({ variant: "destructive", title: "No media selected", description: "Please select a file to upload." });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated", description: "You need to be logged in to post." });
      return;
    }

    startTransition(async () => {
      setUploadProgress(10); 
      const mediaType = mediaFile.type.startsWith("image") ? "image" : "video";
      const filePath = `posts/${user.id}/${Date.now()}_${mediaFile.name}`;

      setUploadProgress(30);
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, mediaFile);

      if (uploadError) {
        toast({ variant: "destructive", title: "Upload Error", description: uploadError.message });
        setUploadProgress(0);
        return;
      }
      
      setUploadProgress(70);

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath);
      const media_url = urlData.publicUrl;

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        caption,
        media_url,
        media_type: mediaType,
      });

      if (insertError) {
        toast({ variant: "destructive", title: "Database Error", description: insertError.message });
        setUploadProgress(0);
        // Attempt to delete the orphaned file from storage
        await supabase.storage.from('posts').remove([filePath]);
        return;
      }
      
      setUploadProgress(100);
      toast({ title: "Post created successfully!" });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.push("/home");
      router.refresh();
    });
  };

  const isVideo = mediaFile?.type.startsWith("video");

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground">
        <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
          <Link href="/upload" className="p-2 -ml-2 absolute left-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold mx-auto">Create your own post</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onClick={() => !isPending && fileInputRef.current?.click()}
              className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/50 overflow-hidden"
            >
              {previewUrl ? (
                <>
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      className="h-full w-full object-contain"
                      controls
                      autoPlay
                      muted
                      loop
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
                  {!isPending && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMedia();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImagePlus className="mx-auto h-12 w-12" />
                  <p className="mt-2 text-sm font-medium">Click to upload a photo or video</p>
                </div>
              )}
            </div>

            <input
              type="file"
              name="media"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*"
              disabled={isPending}
            />

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
            
            {isPending && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">Uploading: {Math.round(uploadProgress)}%</p>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="pt-4">
              <Button className="w-full" type="submit" disabled={isPending || !mediaFile}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
