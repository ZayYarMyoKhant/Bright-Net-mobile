
"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Sparkles, Check } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function UploadPostPageContent() {
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showRewardAdDialog, setShowRewardAdDialog] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const mediaDataUrl = searchParams.get('mediaUrl');
    const typeParam = searchParams.get('mediaType');
    if (mediaDataUrl && typeParam) {
      setPreviewUrl(decodeURIComponent(mediaDataUrl));
      setMediaType(decodeURIComponent(typeParam) as 'image' | 'video');
      fetch(decodeURIComponent(mediaDataUrl)).then(res => res.blob()).then(blob => {
        setMediaFile(new File([blob], `post-${Date.now()}`, { type: blob.type }));
      });
    }
  }, [searchParams]);

  const executePost = () => {
    startTransition(async () => {
      setUploadProgress(0);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mediaFile) return;

      const path = `public/${user.id}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('posts').upload(path, mediaFile);
      if (uploadError) { toast({ variant: "destructive", title: "Upload failed" }); return; }

      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);
      await supabase.from('posts').insert({ user_id: user.id, media_url: publicUrl, media_type: mediaType, caption });
      
      toast({ title: "Post created!" });
      router.push("/home");
    });
  };

  const handleWatchAd = () => {
    setShowRewardAdDialog(false);
    if (typeof window !== 'undefined' && window.show_10630894) {
        window.show_10630894().then(executePost).catch(executePost);
    } else {
        executePost();
    }
  };

  return (
    <>
        <AlertDialog open={showRewardAdDialog} onOpenChange={setShowRewardAdDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>I want to watch Reward ads</AlertDialogTitle>
                    <AlertDialogDescription>Watching a short ad helps support the app while we process your post.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { setShowRewardAdDialog(false); executePost(); }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWatchAd}>Watch</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      <div className="flex h-full flex-col bg-background text-foreground">
        <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
          <button onClick={() => router.back()} className="p-2 -ml-2 absolute left-4"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold mx-auto">New Post</h1>
        </header>
        <main className="flex-1 p-4 space-y-4">
            <div className="relative aspect-video w-full rounded-md border bg-muted overflow-hidden">
              {previewUrl && (mediaType === 'video' ? <video src={previewUrl} autoPlay loop muted className="h-full w-full object-contain" /> : <Image src={previewUrl} alt="preview" fill className="object-contain" />)}
            </div>
            <Textarea placeholder="Write a caption..." className="min-h-[100px]" value={caption} onChange={(e) => setCaption(e.target.value)} disabled={isPending} />
            <Button className="w-full" onClick={() => setShowRewardAdDialog(true)} disabled={isPending || !mediaFile}>
                {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Post"}
            </Button>
        </main>
      </div>
    </>
  );
}

export default function UploadPostPage() {
    return <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}><UploadPostPageContent /></Suspense>;
}
