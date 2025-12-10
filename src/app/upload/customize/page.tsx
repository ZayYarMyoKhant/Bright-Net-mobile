
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, CameraOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

export default function CustomizePostPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
        // Clean up camera stream
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setMediaType('image');
        setMediaPreview(URL.createObjectURL(file));
      } else if (file.type.startsWith("video/")) {
        setMediaType('video');
        setMediaPreview(URL.createObjectURL(file));
      } else {
        toast({ variant: "destructive", title: "Unsupported file type" });
      }
    }
  };

  const renderMediaPreview = () => {
    if (!mediaPreview) return null;

    if (mediaType === 'image') {
      return (
        <Image
          src={mediaPreview}
          alt="Preview"
          fill
          className="object-contain"
        />
      );
    }

    if (mediaType === 'video') {
      return (
        <video
          src={mediaPreview}
          controls
          autoPlay
          loop
          className="w-full h-full object-contain"
        />
      );
    }
    return null;
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-black text-white">
      <header className="absolute top-0 left-0 right-0 z-20 flex h-16 items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 hover:bg-white/10">
          <X className="h-5 w-5" />
        </Button>
        {/* Placeholder for other controls */}
        <div className="w-8"></div>
      </header>

      <main className="flex-1 relative bg-black">
        {mediaPreview ? (
          renderMediaPreview()
        ) : hasCameraPermission === null ? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : hasCameraPermission === true ? (
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
        ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                <CameraOff className="h-16 w-16 text-red-500" />
                <h2 className="mt-4 text-xl font-bold">Camera Access Required</h2>
                <p className="text-muted-foreground mt-2">
                    To use this feature, please allow camera access in your browser or device settings.
                </p>
            </div>
        )}
      </main>

      <footer className="absolute bottom-0 left-0 right-0 z-20 flex h-28 items-center justify-between p-4 bg-gradient-to-t from-black/50 to-transparent">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*"
        />
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 hover:bg-white/10">
          <ImageIcon className="h-7 w-7" />
          <span className="sr-only">Open Gallery</span>
        </Button>
        {/* Placeholder for shutter button and other options */}
        <div className="h-16 w-16 rounded-full border-4 border-white bg-white/30" />
        <div className="w-12"></div>
      </footer>
    </div>
  );
}
