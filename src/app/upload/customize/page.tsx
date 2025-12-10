
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, CameraOff, Loader2, Type, Infinity as InfinityIcon, LayoutGrid, ChevronDown, Camera, Check, RotateCcw, StopCircle, Wand, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

type OverlayText = {
    id: number;
    text: string;
    position: { x: number; y: number };
}

type Effect = {
    name: string;
    class: string;
}

const effects: Effect[] = [
    { name: "None", class: "" },
    { name: "Mono", class: "grayscale" },
    { name: "Sepia", class: "sepia" },
    { name: "Vivid", class: "saturate-200" },
    { name: "Pop", class: "hue-rotate-90" },
    { name: "Invert", class: "invert" },
    { name: "Cool", class: "hue-rotate-180" },
    { name: "Blur", class: "blur-sm" },
];


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

  // Editing states
  const [isTextMode, setIsTextMode] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [overlayTexts, setOverlayTexts] = useState<OverlayText[]>([]);
  const [draggingText, setDraggingText] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string>("");
  const [activeToolbar, setActiveToolbar] = useState<'effects' | 'layout' | 'boomerang' | null>(null);


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
        if(selectedEffect) ctx.filter = getComputedStyle(document.documentElement).getPropertyValue(`--filter-${selectedEffect}`);
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
        setIsRecording(false); 
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
    }, 1000);
  };
  
 const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
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
      setOverlayTexts([]);
      setSelectedEffect("");
      setupCamera();
  };
  
  const handleToolbarClick = (tool: 'text' | 'layout' | 'boomerang' | 'more' | 'effects') => {
    if (tool === 'text') {
        setIsTextMode(true);
    } else if (tool === 'layout' || tool === 'boomerang' || tool === 'effects') {
        setActiveToolbar(activeToolbar === tool ? null : tool);
    } else {
        toast({ title: "More options coming soon!" });
    }
  };
  
  const handleAddText = () => {
    if (currentText.trim() === "") {
        setIsTextMode(false);
        return;
    }
    const newText: OverlayText = {
        id: Date.now(),
        text: currentText,
        position: { x: 50, y: 50 }, // Initial position in percentage
    };
    setOverlayTexts([...overlayTexts, newText]);
    setCurrentText("");
    setIsTextMode(false);
  };

  const handleTextDragStart = (e: React.PointerEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
    setDraggingText(id);
    const target = e.currentTarget;
    const parentRect = (target.offsetParent as HTMLElement)?.getBoundingClientRect();
    if (!parentRect) return;

    const startX = e.clientX - parentRect.left;
    const startY = e.clientY - parentRect.top;
    
    setDragStart({ x: startX - target.offsetLeft, y: startY - target.offsetTop });
  };
  
  const handleTextDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingText !== null && dragStart && e.currentTarget) {
        const parentRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const newX = ((e.clientX - parentRect.left - dragStart.x) / parentRect.width) * 100;
        const newY = ((e.clientY - parentRect.top - dragStart.y) / parentRect.height) * 100;

        setOverlayTexts(texts => texts.map(t => 
            t.id === draggingText ? { ...t, position: { x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) } } : t
        ));
    }
  };
  
  const handleTextDragEnd = () => {
    setDraggingText(null);
    setDragStart(null);
  };


  const renderMediaPreview = () => {
    if (!mediaPreview) return null;

    if (mediaType === 'image') {
      return <Image src={mediaPreview} alt="Preview" fill className={cn("object-contain", selectedEffect)} />;
    }

    if (mediaType === 'video') {
      return <video src={mediaPreview} controls autoPlay loop className={cn("w-full h-full object-contain", selectedEffect)} />;
    }
    return null;
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex h-dvh w-full flex-col bg-black text-white" style={{
        // @ts-ignore
        '--filter-grayscale': 'grayscale(1)',
        '--filter-sepia': 'sepia(1)',
        '--filter-saturate-200': 'saturate(2)',
        '--filter-hue-rotate-90': 'hue-rotate(90deg)',
        '--filter-invert': 'invert(1)',
        '--filter-hue-rotate-180': 'hue-rotate(180deg)',
        '--filter-blur-sm': 'blur(4px)',
    }}>
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
      
      {isTextMode && (
         <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70">
            <Textarea
                className="w-4/5 bg-transparent text-white text-2xl font-bold text-center border-none focus-visible:ring-0 resize-none shadow-white [text-shadow:0_2px_4px_var(--tw-shadow-color)]"
                placeholder="Start typing..."
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                rows={3}
            />
            <div className="absolute top-4 right-4 flex gap-2">
                 <Button onClick={handleAddText}>Done</Button>
                 <Button variant="ghost" onClick={() => setIsTextMode(false)}>Cancel</Button>
            </div>
         </div>
      )}


      <main 
        className="flex-1 relative bg-black overflow-hidden"
        onPointerMove={handleTextDrag}
        onPointerUp={handleTextDragEnd}
        onPointerLeave={handleTextDragEnd}
      >
        {mediaPreview ? (
          renderMediaPreview()
        ) : hasCameraPermission === null ? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : hasCameraPermission === true ? (
          <video ref={videoRef} className={cn("w-full h-full object-cover", selectedEffect)} autoPlay muted playsInline />
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
        
         {overlayTexts.map(text => (
            <div
                key={text.id}
                onPointerDown={(e) => handleTextDragStart(e, text.id)}
                className="absolute text-2xl font-bold text-white cursor-move shadow-black [text-shadow:0_2px_4px_var(--tw-shadow-color)] p-2"
                style={{ top: `${text.position.y}%`, left: `${text.position.x}%`, touchAction: 'none' }}
            >
                {text.text}
            </div>
        ))}
      </main>

      {!mediaPreview && !isRecording && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 bg-black/40 p-2 rounded-full">
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full" onClick={() => handleToolbarClick('text')}>
                <Type className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full" onClick={() => handleToolbarClick('boomerang')}>
                <InfinityIcon className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full" onClick={() => handleToolbarClick('layout')}>
                <LayoutGrid className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full" onClick={() => handleToolbarClick('more')}>
                <ChevronDown className="h-6 w-6" />
            </Button>
        </div>
      )}
      
      {activeToolbar && !mediaPreview && !isRecording && (
        <div className="absolute bottom-32 left-4 right-4 z-20 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold capitalize">{activeToolbar}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveToolbar(null)}><XCircle className="h-5 w-5" /></Button>
            </div>
             {activeToolbar === 'boomerang' && (
                <div className="p-2">
                     <Slider defaultValue={[1]} min={0.25} max={2} step={0.25} />
                     <p className="text-center text-xs mt-2">Adjust Speed</p>
                </div>
            )}
             {activeToolbar === 'layout' && (
                 <div className="grid grid-cols-3 gap-2">
                    <div className="aspect-square bg-white/20 rounded-md border-2 border-white"></div>
                    <div className="aspect-square bg-white/20 rounded-md"></div>
                    <div className="aspect-square bg-white/20 rounded-md"></div>
                 </div>
            )}
        </div>
      )}


      <footer className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/50 to-transparent">
       {!mediaPreview && !isRecording && activeToolbar !== 'effects' && (
            <Button variant="ghost" className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/40" onClick={() => setActiveToolbar(activeToolbar === 'effects' ? null : 'effects')}>
                <Wand className="h-5 w-5 mr-2"/> Effects
            </Button>
        )}
        {activeToolbar === 'effects' && !mediaPreview && !isRecording && (
             <div className="absolute bottom-32 left-0 right-0 w-full px-2">
                <div className="bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                     <div className="flex justify-between items-center mb-2 px-2">
                        <p className="text-sm font-semibold">Effects</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveToolbar(null)}><XCircle className="h-5 w-5" /></Button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {effects.map((effect) => (
                            <button key={effect.name} onClick={() => setSelectedEffect(effect.class)} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
                                <div className={cn("h-12 w-12 rounded-md border-2 bg-blue-500 flex items-center justify-center", selectedEffect === effect.class ? "border-white" : "border-transparent")}>
                                     <div className={cn("h-full w-full bg-cover bg-center rounded", effect.class)} style={{backgroundImage: 'url(/placeholder-effect.jpg)'}}/>
                                </div>
                                <span className="text-xs">{effect.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
             </div>
        )}

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
                        isRecording && "rounded-md bg-red-500 border-red-300 animate-pulse"
                    )} 
                >
                  {mode === 'video' && isRecording ? <div className="h-6 w-6 bg-white rounded-sm"></div> : null}
                </div>
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
