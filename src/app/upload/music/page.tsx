
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Music, UploadCloud } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export default function UploadMusicPage() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showRewardAdDialog, setShowRewardAdDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    // Cleanup object URL when component unmounts or file changes
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const executeUpload = () => {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ variant: "destructive", title: "Not authenticated", description: "You must be logged in to upload music." });
        return;
      }
      
      if (!audioFile) return;

      const fileExtension = audioFile.name.split('.').pop() || 'mp3';
      const safeFileName = `${user.id}-track-${Date.now()}.${fileExtension}`;
      const filePath = `public/${safeFileName}`;

      const { error: uploadError } = await supabase.storage.from('music').upload(filePath, audioFile);

      if (uploadError) {
        toast({ 
          variant: "destructive", 
          title: "Audio upload failed", 
          description: `Error: ${uploadError.message}`
        });
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
        toast({ 
            variant: "destructive", 
            title: "Failed to create track", 
            description: `Database Error: ${insertError.message}`
        });
        return;
      }

      toast({ title: "Track uploaded successfully!" });
      router.push(`/home`);
      router.refresh();
    });
  };

  const handleWatchAd = () => {
    setShowRewardAdDialog(false);
    if (typeof window !== 'undefined' && window.show_10630894) {
        window.show_10630894().then(() => {
            console.log('User seen rewarded ad');
            executeUpload();
        }).catch((err: any) => {
            console.error("Rewarded ad error:", err);
            executeUpload();
        });
    } else {
        executeUpload();
    }
  };

  const handleSkipAd = () => {
    setShowRewardAdDialog(false);
    executeUpload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audioFile) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please provide a title and select an audio file." });
      return;
    }
    setShowRewardAdDialog(true);
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <AlertDialog open={showRewardAdDialog} onOpenChange={setShowRewardAdDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>I want to watch Reward ads</AlertDialogTitle>
                    <AlertDialogDescription>
                        Would you like to watch a short ad to support our service while uploading?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleSkipAd}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWatchAd}>Watch</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

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
            {audioFile && (
                <div className="mt-4 w-full">
                    <p className="text-sm font-semibold text-primary text-center truncate">{audioFile.name}</p>
                    {previewUrl && (
                        <audio controls src={previewUrl} className="w-full mt-2">
                            Your browser does not support the audio element.
                        </audio>
                    )}
                </div>
            )}
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
