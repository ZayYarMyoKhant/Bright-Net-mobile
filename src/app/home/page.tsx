
'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { BottomNav } from "@/components/bottom-nav";
import { Loader2, Headphones, Download, Play, Pause, Music, VideoOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostFeed } from '@/components/post-feed';
import { VideoFeed } from '@/components/video-feed';
import { createClient } from '@/lib/supabase/client';
import type { Post, Profile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import WaveSurfer from 'wavesurfer.js';

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
            height: 40,
            cursorWidth: 0,
        });

        wavesurferRef.current = ws;

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
            // Check if the instance is still valid before destroying
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
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
                <Avatar className="h-10 w-10" profile={track.profiles}/>
                <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="font-bold truncate text-sm">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist_name || track.profiles.username}</p>
                    <div className="flex items-center gap-3">
                         <Button variant="ghost" size="icon" onClick={handlePlayPause} disabled={isLoading} className="h-8 w-8 flex-shrink-0">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <div ref={waveformRef} className="w-full min-w-0" />
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                    <Download className="h-5 w-5 text-muted-foreground" />
                </Button>
            </CardContent>
        </Card>
    );
};


function FeedFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center pt-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function HomePageContent() {
  const [imagePosts, setImagePosts] = useState<Post[]>([]);
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    let query = supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(*), likes:post_likes(count), comments:post_comments(count)')
      .order('created_at', { ascending: false })
      .limit(20);
    
    const { data: posts, error } = await query;
    
    if (error) {
      console.error("Error fetching posts:", error);
      toast({ variant: "destructive", title: "Failed to fetch posts", description: error.message });
      setLoading(false);
      return;
    } 
    
    if (posts) {
        processAndSetPosts(posts, currentUser);
    }
    setLoading(false);
  }, [supabase, toast]);

  const fetchTracks = useCallback(async () => {
    setLoadingTracks(true);
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
    setLoadingTracks(false);
  }, [supabase]);


  const processAndSetPosts = async (posts: any[], currentUser: any) => {
      const postIds = posts.map(p => p.id);
      const { data: userLikes } = currentUser ? await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser.id)
        .in('post_id', postIds) : { data: [] };
      
      const likedPostIds = new Set(userLikes?.map(like => like.post_id));

      const processedPosts: Post[] = posts.map((post: any) => ({
        id: post.id,
        user: post.profiles,
        media_url: post.media_url,
        media_type: post.media_type,
        caption: post.caption,
        created_at: post.created_at,
        likes: post.likes[0]?.count || 0,
        comments: post.comments[0]?.count || 0,
        isLiked: likedPostIds.has(post.id),
      }));

      setImagePosts(processedPosts.filter(p => p.media_type === 'image'));
      setVideoPosts(processedPosts.filter(p => p.media_type === 'video'));
  }

  useEffect(() => {
    fetchPosts();
    fetchTracks();
  }, [fetchPosts, fetchTracks]);

  return (
    <>
      <Tabs defaultValue="news" className="w-full">
        <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
          <header className="fixed top-0 left-0 right-0 z-10 flex h-16 flex-shrink-0 items-center justify-center bg-background/80 px-4 text-center backdrop-blur-sm">
              <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="news">News</TabsTrigger>
                  <TabsTrigger value="relax">
                      <Headphones className="h-5 w-5 mr-1.5"/>
                      Relax
                  </TabsTrigger>
                  <TabsTrigger value="lite">Lite</TabsTrigger>
              </TabsList>
          </header>

          <main className="flex-1 overflow-y-auto pt-16">
              <TabsContent value="news">
                  <PostFeed posts={imagePosts} loading={loading} />
              </TabsContent>
              <TabsContent value="relax" className="p-4 space-y-4">
                 {loadingTracks ? (
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
              </TabsContent>
              <TabsContent value="lite">
                  <VideoFeed posts={videoPosts} loading={loading} />
              </TabsContent>
          </main>
        </div>
        <BottomNav />
      </Tabs>
    </>
  );
}


export default function HomePage() {
    return (
        <Suspense fallback={<FeedFallback />}>
            <HomePageContent />
        </Suspense>
    )
}
