
"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Music, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export default function UploadMusicPage() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Allow any file selected by the user, removing the strict "audio/" check
      setAudioFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audioFile) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please provide a title and select an audio file." });
      return;
    }

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ variant: "destructive", title: "Not authenticated", description: "You must be logged in to upload music." });
        return;
      }
      
      const fileExtension = audioFile.name.split('.').pop();
      const newFileName = `${user.id}-track-${Date.now()}.${fileExtension}`;
      const filePath = `${newFileName}`;

      const { error: uploadError } = await supabase.storage.from('music').upload(filePath, audioFile);

      if (uploadError) {
        toast({ variant: "destructive", title: "Audio upload failed", description: uploadError.message });
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('music').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('tracks').insert({
        user_id: user.id,
        title,
        artist_name: artist || "Unknown Artist",
        audio_url: publicUrl,
      });

      if (insertError) {
        toast({ variant: "destructive", title: "Failed to create track", description: insertError.message });
        return;
      }

      toast({ title: "Track uploaded successfully!" });
      router.push(`/relax`);
      router.refresh();
    });
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Link href="/upload" className="p-2 -ml-2 absolute left-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold mx-auto">Upload a New Track</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div 
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Click to select an audio file</p>
            {fileName && <p className="mt-2 text-sm font-semibold text-primary">{fileName}</p>}
          </div>

          <input
            type="file"
            name="audio"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="audio/*"
            disabled={isPending}
          />

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium">Track Title</label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., 'My Awesome Song'"
                className="mt-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
             <div>
                <label htmlFor="artist" className="text-sm font-medium">Artist Name (Optional)</label>
                <Input
                  id="artist"
                  name="artist"
                  placeholder="Your artist name"
                  className="mt-1"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  disabled={isPending}
                />
             </div>
          </div>
          
          <div className="pt-4">
            <Button className="w-full" type="submit" disabled={isPending || !title || !audioFile}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                 <>
                  <Music className="mr-2 h-4 w-4" />
                  Upload Track
                 </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
