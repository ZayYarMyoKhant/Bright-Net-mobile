
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Headphones, Music, Download, Play, Pause } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WaveSurfer from 'wavesurfer.js';
import { Profile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Track = {
  id: number;
  user_id: string;
  title: string;
  artist_name: string | null;
  audio_url: string;
  cover_art_url: string | null;
  created_at: string;
  profiles: Profile;
};

const AudioPlayer = ({ track }: { track: Track }) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!waveformRef.current) return;

        const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: 'hsl(var(--muted-foreground))',
            progressColor: 'hsl(var(--primary))',
            barWidth: 3,
            barGap: 2,
            barRadius: 3,
            height: 48,
            cursorWidth: 0,
        });

        wavesurferRef.current = ws;

        // More reliable loading method
        ws.load(track.audio_url);
        
        ws.on('ready', () => {
            setIsLoading(false);
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));
        
        ws.on('error', (err) => {
            console.error("Wavesurfer error:", err);
            toast({ variant: "destructive", title: "Audio Error", description: "Could not load the track." });
            setIsLoading(false);
        });


        return () => {
            ws.destroy();
        };
    }, [track.audio_url, toast]);

    const handlePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };
    
    const handleDownload = async () => {
        try {
            const response = await fetch(track.audio_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${track.title} - ${track.artist_name || 'Unknown'}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ title: "Download Started", description: track.title });
        } catch (error) {
            console.error("Download failed:", error);
            toast({ variant: "destructive", title: "Download Failed" });
        }
    };

    return (
        <Card className="overflow-hidden bg-muted/50 border-border">
            <CardContent className="p-3 flex items-center gap-4">
                <Avatar className="h-12 w-12" profile={track.profiles}/>
                <div className="flex-1 space-y-1">
                    <div>
                        <p className="font-bold truncate text-sm">{track.title}</p>
                        <p className="text-xs text-muted-foreground">{track.artist_name || track.profiles.username}</p>
                    </div>
                    <div className="relative flex items-center gap-3">
                         <Button variant="ghost" size="icon" onClick={handlePlayPause} disabled={isLoading} className="h-8 w-8">
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        <div ref={waveformRef} className="w-full" />
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                    <Download className="h-5 w-5 text-muted-foreground" />
                </Button>
            </CardContent>
        </Card>
    );
};


export default function RelaxPage() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    const fetchTracks = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tracks')
            .select('*, profiles:user_id(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching tracks:", error);
            setTracks([]);
        } else {
            setTracks(data as Track[]);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks]);
    

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/home" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2 mx-auto">
                    <Headphones className="h-6 w-6"/>
                    <h1 className="text-xl font-bold">Relax</h1>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex h-full w-full items-center justify-center pt-20">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : tracks.length > 0 ? (
                    tracks.map((track) => (
                        <AudioPlayer key={track.id} track={track} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-20">
                        <Music className="h-16 w-16" />
                        <h2 className="mt-4 text-lg font-semibold">No Tracks Yet</h2>
                        <p className="mt-1 text-sm">Be the first to upload a track!</p>
                        <Button onClick={() => router.push('/upload/music')} className="mt-4">Upload Music</Button>
                    </div>
                )}
            </main>
        </div>
    );
}
