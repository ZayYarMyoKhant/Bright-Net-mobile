
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Camera, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Progress } from "@/components/ui/progress";

export default function CreateClassPage() {
  const [isPending, startTransition] = useTransition();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusText, setStatusText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in' });
        router.push('/signup');
      } else {
        setCurrentUser(user);
      }
    });
  }, [supabase.auth, router, toast]);

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className) {
      toast({ variant: "destructive", title: "Class name is required" });
      return;
    }
    if (!currentUser) {
      toast({ variant: "destructive", title: "Authentication error" });
      return;
    }

    startTransition(async () => {
      let publicAvatarUrl = null;

      // 1. Upload avatar if provided
      if (thumbnailFile) {
        setStatusText("Uploading thumbnail...");
        setUploadProgress(25);
        const filePath = `public/${currentUser.id}-class-${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, thumbnailFile);

        if (uploadError) {
          toast({ variant: "destructive", title: "Avatar Upload Failed", description: uploadError.message });
          setUploadProgress(null);
          return;
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        publicAvatarUrl = urlData.publicUrl;
        setUploadProgress(50);
      } else {
        setUploadProgress(50);
      }

      // 2. Insert into 'classes' table
      setStatusText("Creating class...");
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          name: className,
          description: description,
          creator_id: currentUser.id,
          avatar_url: publicAvatarUrl
        })
        .select('id')
        .single();

      if (classError) {
        toast({ variant: "destructive", title: "Failed to create class", description: classError.message });
        setUploadProgress(null);
        return;
      }
      setUploadProgress(75);

      // 3. Insert creator as the first member into 'class_members'
      setStatusText("Joining class...");
      const { error: memberError } = await supabase
        .from('class_members')
        .insert({
          class_id: newClass.id,
          user_id: currentUser.id
        });

      if (memberError) {
        // Attempt to clean up if member insertion fails
        await supabase.from('classes').delete().eq('id', newClass.id);
        toast({ variant: "destructive", title: "Failed to join class", description: memberError.message });
        setUploadProgress(null);
        return;
      }
      
      setUploadProgress(100);
      setStatusText("Done!");

      toast({ title: "Class created successfully!" });
      router.push(`/class/${newClass.id}`);
      router.refresh();
      setUploadProgress(null);
    });
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Button variant="ghost" size="icon" className="absolute left-4" onClick={() => router.back()} disabled={isPending}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold mx-auto">Create a New Class</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <label htmlFor="avatar-upload" className={cn("cursor-pointer", isPending && "cursor-not-allowed")}>
                <Avatar className="relative h-32 w-32 border-2 border-primary">
                  <AvatarImage src={previewUrl ?? undefined} alt="Class Thumbnail" data-ai-hint="class thumbnail" />
                  <AvatarFallback>
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                  {!isPending && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  )}
                </Avatar>
              </label>
              <input id="avatar-upload" name="avatar_file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} disabled={isPending} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="name">Class Name *</label>
              <Input
                id="name"
                name="name"
                className="mt-1"
                required
                placeholder="e.g., Digital Marketing Masterclass"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="description">Description</label>
              <Textarea
                id="description"
                name="description"
                className="mt-1"
                placeholder="Tell students about your class"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <footer className="flex-shrink-0 pt-4">
             {isPending ? (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-center text-sm text-muted-foreground">
                      {statusText} {uploadProgress !== null && `${uploadProgress}%`}
                    </p>
                  </div>
                ) : (
                <Button className="w-full" type="submit" disabled={isPending}>
                  Create Class
                </Button>
             )}
          </footer>
        </form>
      </main>
    </div>
  );
}
