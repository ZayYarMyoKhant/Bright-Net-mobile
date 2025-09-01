
"use client";

import { useState, useRef, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createPost } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SubmitButton() {
  const [state, formAction, isPending] = useActionState(createPost, null);
  
  return (
     <>
      {state?.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Upload Failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button
        className="w-full"
        type="submit"
        disabled={isPending}
        onClick={(e) => {
          const form = e.currentTarget.form;
          if (form) {
            formAction(new FormData(form));
          }
        }}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Post
      </Button>
    </>
  );
}

export default function UploadPostPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if(file.type.startsWith("image/")){
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Only images are allowed for now.");
        handleRemoveMedia();
      }
    }
  };

  const handleRemoveMedia = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
          <form action={createPost} className="space-y-4">
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
                    data-ai-hint="user upload"
                  />
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
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImagePlus className="mx-auto h-12 w-12" />
                  <p className="mt-2 text-sm font-medium">Click to upload a photo</p>
                </div>
              )}
            </div>

            <input
              type="file"
              name="media"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              required
            />

            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                Gallery
              </Button>
            </div>

            <div>
              <Textarea
                name="caption"
                placeholder="Write caption"
                className="min-h-[100px] text-base"
                required
              />
            </div>
            
             <div className="pt-4">
              <SubmitButton />
            </div>

          </form>
        </main>
      </div>
    </>
  );
}

