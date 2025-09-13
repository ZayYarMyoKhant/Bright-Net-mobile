
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { Button } from "./ui/button";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

type AudioPlayerProps = {
  audioUrl: string;
  duration: number;
  isSender: boolean;
};

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) {
        return '00:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function AudioPlayer({ audioUrl, duration, isSender }: AudioPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(0);

    const { wavesurfer, isPlaying, isReady } = useWavesurfer({
        container: containerRef,
        url: audioUrl,
        waveColor: isSender ? "#a0c7ff" : "#a1a1aa",
        progressColor: isSender ? "#ffffff" : "#18181b",
        height: 40,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        cursorWidth: 0,
        interact: true,
    });

    useEffect(() => {
        if (!wavesurfer) return;
        
        const onTimeUpdate = (time: number) => {
            setCurrentTime(time);
        };
        const onFinish = () => {
            setCurrentTime(0);
            wavesurfer.seekTo(0);
        };

        wavesurfer.on("audioprocess", onTimeUpdate);
        wavesurfer.on("seeking", onTimeUpdate);
        wavesurfer.on("finish", onFinish);

        return () => {
            wavesurfer.un("audioprocess", onTimeUpdate);
            wavesurfer.un("seeking", onTimeUpdate);
            wavesurfer.un("finish", onFinish);
        };
    }, [wavesurfer]);
    
    const onPlayPause = useCallback(() => {
        wavesurfer?.playPause();
    }, [wavesurfer]);


  return (
    <div className="flex items-center gap-2 p-2 w-64">
        <Button 
            size="icon" 
            onClick={onPlayPause} 
            disabled={!isReady}
            className={cn(
                "h-10 w-10 rounded-full flex-shrink-0",
                 isSender ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
        >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <div className="flex-1 flex flex-col justify-center">
            <div ref={containerRef} className="w-full h-10 cursor-pointer" />
            <div className="flex justify-between items-center mt-1">
                <span className={cn("text-xs", isSender ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {formatTime(currentTime)}
                </span>
                <span className={cn("text-xs", isSender ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    {formatTime(duration)}
                </span>
            </div>
        </div>
    </div>
  );
}
