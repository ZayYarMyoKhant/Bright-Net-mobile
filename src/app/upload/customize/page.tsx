
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, CameraOff, Loader2, Type, Infinity, LayoutGrid, ChevronDown, Camera, Check, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function CustomizePostPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const setupCamera = useCallback(async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }, 
        audio: true 
      });
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
  }, [facingMode, toast]);

  useEffect(() => {
    setupCamera();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
    }
  }, [setupCamera]);

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
  
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setMediaPreview(dataUrl);
        setMediaType('image');
    }
  };

  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;

    recordedChunksRef.current = [];
    const stream = videoRef.current.srcObject as MediaStream;
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
        }
    };
    
    mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setMediaPreview(url);
        setMediaType('video');
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
    }, 1000);
  };
  
  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
  };

  const handleShutterClick = () => {
    if (mode === 'photo') {
        handleTakePhoto();
    } else {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }
  };
  
  const handleRetake = () => {
      setMediaPreview(null);
      setMediaType(null);
      setupCamera();
  };

  const renderMediaPreview = () => {
    if (!mediaPreview) return null;

    if (mediaType === 'image') {
      return <Image src={mediaPreview} alt="Preview" fill className="object-contain" />;
    }

    if (mediaType === 'video') {
      return <video src={mediaPreview} controls autoPlay loop className="w-full h-full object-contain" />;
    }
    return null;
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-black text-white">
      <header className="absolute top-0 left-0 right-0 z-20 flex h-16 items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 bg-black/40 hover:bg-black/60 rounded-full">
          <X className="h-5 w-5" />
        </Button>
        {mediaPreview && (
          <Button className="bg-primary hover:bg-primary/90">
              Next <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
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
        {isRecording && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-mono">{formatRecordingTime(recordingTime)}</p>
            </div>
        )}
      </main>

      {!mediaPreview && !isRecording && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 bg-black/40 p-2 rounded-full">
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full">
                <Type className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full">
                <Infinity className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full">
                <LayoutGrid className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full">
                <ChevronDown className="h-6 w-6" />
            </Button>
        </div>
      )}

      <footer className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-end justify-between">
            <div className="w-24">
                 {mediaPreview ? (
                    <Button variant="ghost" size="icon" onClick={handleRetake} className="h-12 w-12 hover:bg-white/10 rounded-lg bg-black/40">
                        <RotateCcw className="h-7 w-7" />
                        <span className="sr-only">Retake</span>
                    </Button>
                 ) : !isRecording && (
                    <>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,video/*"
                        />
                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 hover:bg-white/10 rounded-lg bg-black/40">
                            <ImageIcon className="h-7 w-7" />
                            <span className="sr-only">Open Gallery</span>
                        </Button>
                    </>
                 )}
            </div>
           
            <div className="flex flex-col items-center">
                <div 
                    onClick={handleShutterClick}
                    className={cn(
                        "h-16 w-16 rounded-full border-4 border-white bg-white/30 flex items-center justify-center cursor-pointer active:scale-95 transition-all",
                        isRecording && "rounded-md bg-red-500 border-red-300"
                    )} 
                />
                 {!isRecording && !mediaPreview && (
                     <Tabs value={mode} onValueChange={(value) => setMode(value as 'photo' | 'video')} className="w-full max-w-xs mt-4">
                        <TabsList className="grid w-full grid-cols-2 bg-black/40 h-auto p-1">
                            <TabsTrigger value="photo" className={cn("text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white")}>Photo</TabsTrigger>
                            <TabsTrigger value="video" className={cn("text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white")}>Video</TabsTrigger>
                        </TabsList>
                    </Tabs>
                 )}
            </div>

             <div className="w-24 flex justify-end">
                 {!mediaPreview && !isRecording && (
                    <Button variant="ghost" size="icon" onClick={handleFlipCamera} className="h-12 w-12 hover:bg-white/10 rounded-full bg-black/40">
                        <Camera className="h-7 w-7" />
                        <span className="sr-only">Flip camera</span>
                    </Button>
                 )}
            </div>
        </div>
      </footer>
    </div>
  );
}

    