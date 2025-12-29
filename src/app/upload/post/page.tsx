
"use client";

import { Suspense } from "react";
import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Wand2, Sparkles, Check } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdMob } from "@/hooks/use-admob";


function UploadPostPageContent() {
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // AI Editor State
  const [showAiEditorDialog, setShowAiEditorDialog] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [isEditingWithAi, setIsEditingWithAi] = useState(false);
  const [originalMediaFile, setOriginalMediaFile] = useState<File | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = createClient();
  const { showInterstitial } = useAdMob();

  useEffect(() => {
    const mediaDataUrl = searchParams.get('mediaUrl');
    const typeParam = searchParams.get('mediaType');

    if (mediaDataUrl && typeParam) {
      const decodedUrl = decodeURIComponent(mediaDataUrl);
      const type = decodeURIComponent(typeParam) as 'image' | 'video';

      setPreviewUrl(decodedUrl);
      setMediaType(type);

      fetch(decodedUrl)
        .then(res => res.blob())
        .then(blob => {
          if (blob.size === 0) {
              toast({ variant: 'destructive', title: 'Media Error', description: 'Could not load media. It might be too large.' });
              router.push('/upload/customize');
              return;
          }
          const fileName = `post-media-${Date.now()}.${type === 'image' ? 'jpeg' : 'mp4'}`;
          const file = new File([blob], fileName, { type: blob.type });
          setMediaFile(file);
          setOriginalMediaFile(file); // Keep a copy of the original
        })
        .catch(err => {
            console.error("Error fetching data URL blob:", err);
            toast({ variant: 'destructive', title: 'Media Error', description: 'Failed to process the selected media.' });
            router.push('/upload/customize');
        });
    } else {
      toast({ variant: 'destructive', title: 'No Media Found', description: 'Please create or select media first.' });
      router.push('/upload/customize');
    }
  }, [router, toast, searchParams]);

  const handleAiEdit = async () => {
    if (!originalMediaFile || !aiEditPrompt.trim()) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please ensure you have an image and a prompt.' });
        return;
    }

    setIsEditingWithAi(true);
    await showInterstitial(); // Show interstitial ad while AI is processing

    try {
        // 1. Upload original image to get a public URL
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated.");

        const tempFilePath = `temp/${user.id}-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('posts')
            .upload(tempFilePath, originalMediaFile);
        
        if (uploadError) throw new Error(`Temporary upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(tempFilePath);

        // 2. Call the ZMT Xian API
        const response = await fetch(`https://image2.zmt51400.workers.dev/?imageUrl=${encodeURIComponent(publicUrl)}&prompt=${encodeURIComponent(aiEditPrompt)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI editing failed: ${errorText}`);
        }

        const aiResult = await response.json();
        const editedImageUrl = aiResult?.result?.images?.[0];

        if (!editedImageUrl) {
            throw new Error('AI service did not return a valid edited image.');
        }

        // 3. Fetch the new image blob and update the state
        const editedImageResponse = await fetch(editedImageUrl);
        const editedImageBlob = await editedImageResponse.blob();
        const editedImageFile = new File([editedImageBlob], `ai-edited-${Date.now()}.jpeg`, { type: 'image/jpeg' });

        setMediaFile(editedImageFile);
        setPreviewUrl(URL.createObjectURL(editedImageFile));
        
        toast({ title: "AI Edit Applied!", description: "Your image has been magically transformed." });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("AI Editing Error:", errorMessage);
        toast({ variant: 'destructive', title: 'AI Edit Failed', description: errorMessage });
    } finally {
        setIsEditingWithAi(false);
        setShowAiEditorDialog(false);
        setAiEditPrompt("");
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) {
      toast({ variant: "destructive", title: "No media selected", description: "Please select a file to upload." });
      return;
    }

    startTransition(async () => {
      setUploadProgress(0);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ variant: "destructive", title: "Not authenticated", description: "You must be logged in to post." });
        setUploadProgress(null);
        return;
      }
      
      const fileExtension = mediaFile.type.split('/')[1] || (mediaFile.type.startsWith('image') ? 'jpg' : 'mp4');
      const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, mediaFile, {
        cacheControl: '3600',
        upsert: false
      });
      setUploadProgress(100);

      if (uploadError) {
        toast({ variant: "destructive", title: "Upload failed", description: uploadError.message });
        setUploadProgress(null);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        caption: caption,
      });

      if (insertError) {
        toast({ variant: "destructive", title: "Failed to create post", description: insertError.message });
        setUploadProgress(null);
        return;
      }

      toast({ title: "Post created successfully!" });
      router.push("/home");
      router.refresh();
      setUploadProgress(null);
    });
  };

  return (
    <>
        <Dialog open={showAiEditorDialog} onOpenChange={setShowAiEditorDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Image Editor</DialogTitle>
                    <DialogDescription>Describe how you'd like to change the image. For example: "Make it look like a watercolor painting".</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                     {previewUrl && mediaType === 'image' && (
                        <div className="relative w-full aspect-square rounded-md overflow-hidden">
                            <Image src={previewUrl} alt="Image to edit" fill className="object-contain" />
                        </div>
                    )}
                    <Input 
                        placeholder="e.g., 'Change style to cyberpunk'"
                        value={aiEditPrompt}
                        onChange={(e) => setAiEditPrompt(e.target.value)}
                        disabled={isEditingWithAi}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAiEditorDialog(false)} disabled={isEditingWithAi}>Cancel</Button>
                    <Button onClick={handleAiEdit} disabled={isEditingWithAi || !aiEditPrompt.trim()}>
                        {isEditingWithAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Apply Edit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <div className="flex h-full flex-col bg-background text-foreground">
        <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
          <button onClick={() => router.back()} className="p-2 -ml-2 absolute left-4">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold mx-auto">Create a New Post</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/50 overflow-hidden"
            >
              {previewUrl ? (
                <>
                  {mediaType === 'video' ? (
                    <video
                      src={previewUrl}
                      className="h-full w-full object-contain"
                      controls={false}
                      autoPlay
                      loop
                      muted
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
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                  <p className="mt-2 text-sm font-medium">Loading media...</p>
                </div>
              )}
            </div>

            {mediaType === 'image' && (
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowAiEditorDialog(true)} disabled={isPending}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    AI Editor
                </Button>
            )}

            <div>
              <Textarea
                name="caption"
                placeholder="Write a caption..."
                className="min-h-[100px] text-base"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isPending}
              />
            </div>
            
            <div className="pt-4 space-y-4">
               {isPending && uploadProgress !== null ? (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-center text-sm text-muted-foreground">
                      Uploading... {uploadProgress.toFixed(0)}%
                    </p>
                  </div>
                ) : (
                  <Button className="w-full" type="submit" disabled={isPending || !mediaFile}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Post"
                    )}
                  </Button>
                )}
            </div>
          </form>
        </main>
      </div>
    </>
  );
}


export default function UploadPostPage() {
    return (
        <Suspense fallback={
            <div className="flex h-dvh w-full items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <UploadPostPageContent />
        </Suspense>
    );
}
