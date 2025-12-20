
'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { BottomNav } from "@/components/bottom-nav";
import { Loader2, Headphones, Download, Play, Pause, Music, VideoOff, Heart } from "lucide-react";
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
import { AdBanner } from '@/components/ad-banner';
import { User } from '@supabase/supabase-js';
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
  likes_count: number;
  is_liked_by_user: boolean;
};

const AudioPlayer = ({ track: initialTrack, currentUser }: { track: Track, currentUser: User | null }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const supabase = createClient();
    const [likesCount, setLikesCount] = useState(initialTrack.likes_count);
    const [isLiked, setIsLiked] = useState(initialTrack.is_liked_by_user);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleCanPlay = () => setIsLoading(false);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);


    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (audio) {
            if (audio.paused) {
                audio.play().catch(e => console.error("Audio play failed:", e));
            } else {
                audio.pause();
            }
        }
    };
    
    const handleDownload = async () => {
        try {
            const response = await fetch(initialTrack.audio_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${initialTrack.title} - ${initialTrack.artist_name || 'Unknown'}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ title: "Download Started", description: initialTrack.title });
        } catch (error) {
            console.error("Download failed:", error);
            toast({ variant: "destructive", title: "Download Failed" });
        }
    };

    const handleLikeToggle = async () => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'You must be logged in to like tracks.' });
            return;
        }
        if(isLiking) return;

        setIsLiking(true);
        const newIsLiked = !isLiked;
        
        // Optimistic update
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        if (newIsLiked) {
            const { error } = await supabase.from('track_likes').insert({ track_id: initialTrack.id, user_id: currentUser.id });
            if (error) {
                toast({ variant: 'destructive', title: 'Failed to like track', description: error.message });
                setIsLiked(false);
                setLikesCount(prev => prev - 1);
            }
        } else {
            const { error } = await supabase.from('track_likes').delete().match({ track_id: initialTrack.id, user_id: currentUser.id });
             if (error) {
                toast({ variant: 'destructive', title: 'Failed to unlike track', description: error.message });
                setIsLiked(true);
                setLikesCount(prev => prev + 1);
            }
        }
        setIsLiking(false);
    }

    return (
        <Card className="overflow-hidden bg-muted/50 border-border">
            <CardContent className="p-3 flex items-center gap-4">
                <Avatar className="h-10 w-10" profile={initialTrack.profiles}/>
                <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="font-bold truncate text-sm">{initialTrack.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{initialTrack.artist_name || initialTrack.profiles.username}</p>
                    <div className="flex items-center gap-3">
                         <Button variant="ghost" size="icon" onClick={handlePlayPause} disabled={isLoading} className="h-8 w-8 flex-shrink-0">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <audio ref={audioRef} src={initialTrack.audio_url} preload="metadata"></audio>
                        <p className="text-xs text-muted-foreground">Click to play</p>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Button variant="ghost" size="icon" onClick={handleLikeToggle} disabled={isLiking}>
                        <Heart className={cn("h-5 w-5", isLiked && "text-red-500 fill-red-500")} />
                    </Button>
                    <span className="text-xs font-semibold">{likesCount}</span>
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
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
        processAndSetPosts(posts, user);
    }
    setLoading(false);
  }, [supabase, toast]);

  const fetchTracks = useCallback(async () => {
    setLoadingTracks(true);
     const { data: { user } } = await supabase.auth.getUser();
     const { data, error } = await supabase
        .rpc('get_tracks_with_likes', { p_user_id: user?.id });

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
                        <AudioPlayer key={track.id} track={track} currentUser={currentUser} />
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
