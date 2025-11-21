
"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, ArrowLeft, Loader2, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";

export default function CreateClassPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        toast({
          variant: "destructive",
          title: "Unsupported File Type",
          description: "Please select an image file.",
        });
        handleRemoveMedia();
      }
    }
  };

  const handleRemoveMedia = () => {
    setAvatarFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please provide a name and description." });
      return;
    }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ variant: "destructive", title: "Not authenticated", description: "You must be logged in to create a class." });
        return;
      }
      
      let publicAvatarUrl = null;
      if (avatarFile) {
        const fileExtension = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-class-${Date.now()}.${fileExtension}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, avatarFile);

        if (uploadError) {
          toast({ variant: "destructive", title: "Image upload failed", description: uploadError.message });
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath);
        publicAvatarUrl = publicUrl;
      }


      const { data: classData, error: insertError } = await supabase.from('classes').insert({
        name,
        description,
        creator_id: user.id,
        avatar_url: publicAvatarUrl
      }).select().single();

      if (insertError) {
        toast({ variant: "destructive", title: "Failed to create class", description: insertError.message });
        return;
      }
      
       const { error: memberError } = await supabase.from('class_members').insert({
          class_id: classData.id,
          user_id: user.id
       });

      if (memberError) {
         toast({ variant: "destructive", title: "Failed to join class", description: memberError.message });
         // Optionally delete the class if owner can't be added
         return;
      }

      toast({ title: "Class created successfully!" });
      router.push(`/class/${classData.id}`);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground">
        <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
          <Link href="/upload" className="p-2 -ml-2 absolute left-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold mx-auto">Create a new class</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              onClick={() => !isPending && fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center space-y-4"
            >
                <Avatar className="relative h-32 w-32 border-2 border-primary cursor-pointer" src={previewUrl}>
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-md">
                        <ImagePlus className="h-8 w-8 text-white" />
                    </div>
                </Avatar>
                <p className="text-sm text-muted-foreground">Tap to add a class avatar</p>
            </div>

            <input
              type="file"
              name="media"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={isPending}
            />

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">Class Name</label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., 'Digital Art Beginners'"
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
               <div>
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="What is this class about?"
                    className="min-h-[100px] text-base mt-1"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending}
                    required
                  />
               </div>
            </div>
            
            <div className="pt-4">
              <Button className="w-full" type="submit" disabled={isPending || !name || !description}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Class...
                  </>
                ) : (
                   <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create Class
                   </>
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
