
"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Camera, X, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                 <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Avatar className="relative h-32 w-32 border-2 border-primary">
                        <AvatarImage src={previewUrl ?? undefined} alt="Class Thumbnail" data-ai-hint="class thumbnail"/>
                        <AvatarFallback>
                            <Camera className="h-8 w-8 text-muted-foreground" />
                        </AvatarFallback>
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </Avatar>
                 </label>
                 <input id="avatar-upload" name="avatar_file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium" htmlFor="name">Class Name *</label>
                    <Input id="name" name="name" className="mt-1" required placeholder="e.g., Digital Marketing Masterclass"/>
                </div>
                
                 <div>
                    <label className="text-sm font-medium" htmlFor="description">Description</label>
                    <Textarea 
                        id="description" 
                        name="description" 
                        className="mt-1" 
                        placeholder="Tell students about your class"
                    />
                </div>
            </div>
            
             <footer className="flex-shrink-0 pt-4">
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
            </footer>
        </form>

      </main>
    </div>
  );
}
