
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, CameraOff, Loader2, Type, Infinity as InfinityIcon, LayoutGrid, ChevronDown, Camera, Check, RotateCcw, Wand, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

type OverlayText = {
    id: number;
    text: string;
    position: { x: number; y: number };
}

type Effect = {
    name: string;
    class: string;
    filter: string;
}

const effects: Effect[] = [
    { name: "None", class: "", filter: "none" },
    { name: "Mono", class: "grayscale", filter: "grayscale(1)" },
    { name: "Sepia", class: "sepia", filter: "sepia(1)" },
    { name: "Vivid", class: "saturate-200", filter: "saturate(2)" },
    { name: "Pop", class: "hue-rotate-90", filter: "hue-rotate(90deg)" },
    { name: "Invert", class: "invert", filter: "invert(1)" },
    { name: "Cool", class: "hue-rotate-180", filter: "hue-rotate(180deg)" },
    { name: "Blur", class: "blur-sm", filter: "blur(4px)" },
];

const convertToDataURL = (mediaUrl: string, mediaType: 'image' | 'video', effectFilter: string, texts: OverlayText[], callback: (dataUrl: string) => void) => {
    if (mediaType === 'video') {
        // For video, client-side processing is too heavy.
        // We will just pass the original URL. A more advanced solution would use a server-side processor.
        callback(mediaUrl);
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        if (effectFilter) {
            ctx.filter = effectFilter;
        }
        
        ctx.drawImage(img, 0, 0);

        // Reset filter before drawing text, so text isn't affected
        ctx.filter = 'none';

        texts.forEach(text => {
            const fontSize = canvas.width * 0.05; // Make font size relative to image width
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const x = (text.position.x / 100) * canvas.width;
            const y = (text.position.y / 100) * canvas.height;
            
            // Add text shadow for better visibility
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 7;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.fillText(text.text, x, y);
        });
        
        callback(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = mediaUrl;
};


export default function CustomizePostPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Editing states
  const [isTextMode, setIsTextMode] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [overlayTexts, setOverlayTexts] = useState<OverlayText[]>([]);
  const [draggingText, setDraggingText] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<Effect>(effects[0]);
  const [activeToolbar, setActiveToolbar] = useState<'effects' | 'layout' | 'boomerang' | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);


  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setupCamera = useCallback(async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }
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
        if (mediaPreview) {
            // If there's a preview, we should stop the camera stream
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        } else {
            // No preview, set up the camera
            setupCamera();
        }
    }, [mediaPreview, setupCamera]);

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

  const handleShutterClick = () => {
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
  
  const handleRetake = () => {
      setMediaPreview(null);
      setMediaType(null);
      setOverlayTexts([]);
      setSelectedEffect(effects[0]);
  };
  
  const handleToolbarClick = (tool: 'text' | 'layout' | 'boomerang' | 'more' | 'effects') => {
    if (tool === 'text') {
        setIsTextMode(true);
    } else if (tool === 'layout' || tool === 'boomerang') {
        toast({ title: "Coming soon!", description: `The ${tool} feature is under development.` });
    } else if (tool === 'effects') {
        setActiveToolbar(activeToolbar === tool ? null : 'effects');
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
        position: { x: 50, y: 50 },
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

  const handleNext = () => {
    if (!mediaPreview || !mediaType) {
        toast({ variant: 'destructive', title: 'No Media', description: 'Please take a photo or select media first.' });
        return;
    }
    setIsLoadingNext(true);

    convertToDataURL(mediaPreview, mediaType, selectedEffect.filter, overlayTexts, (dataUrl) => {
        const encodedUrl = encodeURIComponent(dataUrl);
        const encodedMediaType = encodeURIComponent(mediaType);
        router.push(`/upload/post?mediaUrl=${encodedUrl}&mediaType=${encodedMediaType}`);
        setIsLoadingNext(false);
    });
  };

  const renderMediaPreview = () => {
    if (!mediaPreview) return null;
    
    if (mediaType === 'image') {
      return <Image src={mediaPreview} alt="Preview" fill className={cn("object-contain", selectedEffect.class)} />;
    }
    
    if (mediaType === 'video') {
      return <video src={mediaPreview} controls autoPlay loop className={cn("w-full h-full object-contain", selectedEffect.class)} />;
    }

    return null;
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-black text-white">
      <header className="absolute top-0 left-0 right-0 z-20 flex h-16 items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 bg-black/40 hover:bg-black/60 rounded-full">
          <X className="h-5 w-5" />
        </Button>
        {mediaPreview && (
          <Button onClick={handleNext} className="bg-primary hover:bg-primary/90" disabled={isLoadingNext}>
              {isLoadingNext ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-2" />}
              Next
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
            <div className='relative w-full h-full'>
              {renderMediaPreview()}
              {overlayTexts.map(text => (
                  <div
                      key={text.id}
                      onPointerDown={(e) => handleTextDragStart(e, text.id)}
                      className="absolute text-2xl font-bold text-white cursor-move shadow-black [text-shadow:0_2px_4px_var(--tw-shadow-color)] p-2 select-none"
                      style={{ 
                          top: `${text.position.y}%`, 
                          left: `${text.position.x}%`, 
                          transform: 'translate(-50%, -50%)',
                          touchAction: 'none' 
                      }}
                  >
                      {text.text}
                  </div>
              ))}
            </div>
        ) : (
             <>
                {hasCameraPermission === null ? (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : hasCameraPermission === true ? (
                  <video ref={videoRef} className={cn("w-full h-full object-cover", selectedEffect.class)} autoPlay muted playsInline />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                        <CameraOff className="h-16 w-16 text-red-500" />
                        <h2 className="mt-4 text-xl font-bold">Camera Access Required</h2>
                        <p className="text-muted-foreground mt-2">
                            To use this feature, please allow camera access in your browser or device settings.
                        </p>
                    </div>
                )}
            </>
        )}
      </main>

       {mediaPreview && (
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
            <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/20 rounded-full" onClick={() => toast({ title: "More options coming soon!" })}>
                <ChevronDown className="h-6 w-6" />
            </Button>
        </div>
       )}
      
      {activeToolbar && (
        <div className="absolute bottom-32 left-4 right-4 z-20 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold capitalize">{activeToolbar}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveToolbar(null)}><XCircle className="h-5 w-5" /></Button>
            </div>
             {activeToolbar === 'effects' && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {effects.map((effect) => (
                        <button key={effect.name} onClick={() => setSelectedEffect(effect)} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16">
                            <div className={cn("h-12 w-12 rounded-md border-2 bg-blue-500 flex items-center justify-center", selectedEffect.name === effect.name ? "border-white" : "border-transparent")}>
                                    <div className={cn("h-full w-full bg-cover bg-center rounded", effect.class)} style={{backgroundImage: 'url(/placeholder-effect.jpg)'}}/>
                            </div>
                            <span className="text-xs">{effect.name}</span>
                        </button>
                    ))}
                </div>
             )}
        </div>
      )}


      <footer className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/50 to-transparent">
        {mediaPreview && (
          <Button variant="ghost" className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/40" onClick={() => setActiveToolbar(activeToolbar === 'effects' ? null : 'effects')}>
              <Wand className="h-5 w-5 mr-2"/> Effects
          </Button>
        )}

        <div className="flex items-end justify-between">
            <div className="w-24">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*"
                />
                 {mediaPreview ? (
                    <div /> // Placeholder to keep layout consistent
                 ) : (
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 hover:bg-white/10 rounded-lg bg-black/40">
                        <ImageIcon className="h-7 w-7" />
                        <span className="sr-only">Open Gallery</span>
                    </Button>
                 )}
            </div>
           
            <div className="flex flex-col items-center">
                {mediaPreview ? (
                     <Button variant="ghost" size="icon" onClick={handleRetake} className="h-16 w-16 rounded-full hover:bg-white/10 bg-black/40">
                        <RotateCcw className="h-8 w-8" />
                        <span className="sr-only">Retake</span>
                    </Button>
                ) : (
                    <div 
                        onClick={handleShutterClick}
                        className="h-16 w-16 rounded-full border-4 border-white bg-white/30 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    >
                    </div>
                )}
            </div>

             <div className="w-24 flex justify-end">
                 {!mediaPreview && (
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
