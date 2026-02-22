
"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export default function UploadMusicPage() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setAudioFile(e.target.files[0]);
  };

  const handleUpload = () => {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !audioFile) return;

      const path = `public/${user.id}-track-${Date.now()}`;
      const { error } = await supabase.storage.from('music').upload(path, audioFile);
      if (error) { toast({ variant: "destructive", title: "Upload failed" }); return; }

      const { data: { publicUrl } } = supabase.storage.from('music').getPublicUrl(path);
      await supabase.from('tracks').insert({ user_id: user.id, title, artist_name: artist || "Unknown", audio_url: publicUrl });
      
      toast({ title: "Track uploaded!" });
      router.push("/home");
    });
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Link href="/upload" className="p-2 -ml-2 absolute left-4"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-xl font-bold mx-auto">Upload Music</h1>
      </header>
      <main className="flex-1 p-4 space-y-6">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">{audioFile ? audioFile.name : "Select audio file"}</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/*" />
        <div className="space-y-4">
            <Input placeholder="Track Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPending} />
            <Input placeholder="Artist Name" value={artist} onChange={(e) => setArtist(e.target.value)} disabled={isPending} />
        </div>
        <Button className="w-full" onClick={handleUpload} disabled={isPending || !title || !audioFile}>
            {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Upload"}
        </Button>
      </main>
    </div>
  );
}
