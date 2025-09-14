
"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ImagePlus, X, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function CreateClassPage() {
  const [isPending, startTransition] = useTransition();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      toast({
        variant: "destructive",
        title: "Unsupported File Type",
        description: "Please select an image file for the thumbnail.",
      });
      handleRemoveMedia();
    }
  };

  const handleRemoveMedia = () => {
    setThumbnailFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thumbnailFile) {
      toast({
        variant: "destructive",
        title: "No thumbnail selected",
        description: "Please select a thumbnail image for your class.",
      });
      return;
    }
    startTransition(() => {
      // Mock API call
      console.log("Creating class...");
      setTimeout(() => {
        toast({ title: "Class created successfully! (mock)" });
        router.push("/class");
      }, 1500);
    });
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Button variant="ghost" size="icon" className="absolute left-4" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold mx-auto">Create a New Class</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onClick={() => !isPending && fileInputRef.current?.click()}
            className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/50 overflow-hidden"
          >
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="Selected preview"
                  fill
                  className="object-cover"
                  data-ai-hint="class thumbnail"
                />
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
                <p className="mt-2 text-sm font-medium">
                  Click to upload a class thumbnail
                </p>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isPending}
          />

          <div className="space-y-2">
            <label htmlFor="name">Class Name</label>
            <Input id="name" placeholder="e.g., Advanced Graphic Design" disabled={isPending} />
          </div>

           <div className="space-y-2">
            <label htmlFor="description">Description</label>
            <Textarea
                id="description"
                placeholder="Tell students about your class..."
                className="min-h-[100px]"
                disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="price">Price (MMK)</label>
            <Input id="price" type="number" placeholder="e.g., 50000" disabled={isPending} />
          </div>

          <div className="pt-4">
            <Button className="w-full" type="submit" disabled={isPending || !thumbnailFile}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Class...
                </>
              ) : (
                "Create Class"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
