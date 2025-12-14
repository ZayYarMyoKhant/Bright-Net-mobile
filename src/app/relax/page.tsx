
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
            url: track.audio_url,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 64,
        });

        wavesurferRef.current = ws;
        
        ws.on('ready', () => {
            setIsLoading(false);
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));

        return () => {
            ws.destroy();
        };
    }, [track.audio_url]);

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
        <Card className="overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10" profile={track.profiles}/>
                         <div>
                            <p className="font-bold truncate">{track.title}</p>
                            <p className="text-sm text-muted-foreground">{track.artist_name || track.profiles.username}</p>
                         </div>
                    </div>
                    
                    <div className="relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        )}
                        <div ref={waveformRef} className="w-full h-16" />
                    </div>

                    <div className="flex items-center justify-between">
                         <Button variant="ghost" size="icon" onClick={handlePlayPause} disabled={isLoading}>
                            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>
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
