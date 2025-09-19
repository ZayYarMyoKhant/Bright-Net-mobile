
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff, RefreshCw, Users, UserX, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/data";
import { useRouter } from "next/navigation";


type Participant = Profile & {
    isCurrentUser?: boolean;
    isMuted?: boolean;
    isCameraOn?: boolean;
};

const ParticipantVideo = ({ participant, stream }: { participant: Participant, stream?: MediaStream | null }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative rounded-lg overflow-hidden bg-black/80 flex items-center justify-center aspect-square">
            {participant.isCurrentUser && stream ? (
                 <video ref={videoRef} className={cn("w-full h-full object-cover", !participant.isCameraOn && "hidden")} autoPlay muted playsInline />
            ) : (
                 <Avatar className={cn("h-full w-full rounded-none", !participant.isCameraOn && "hidden")}>
                    <AvatarImage src={participant.avatar_url} alt={participant.username} className="object-cover" data-ai-hint="person talking" />
                    <AvatarFallback className="rounded-none bg-gray-800">{participant.username.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            
            {!participant.isCameraOn && (
                 <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <VideoOff className="h-6 w-6" />
                    <p className="text-xs font-semibold">Camera Off</p>
                </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center gap-1.5 text-xs text-white font-medium truncate">
                    {participant.isMuted ? <MicOff className="h-3 w-3 flex-shrink-0" /> : <Mic className="h-3 w-3 flex-shrink-0" />}
                    <span className="truncate">{participant.isCurrentUser ? "You (Host)" : participant.full_name}</span>
                </div>
            </div>
        </div>
    );
};


export default function ClassVideoCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [classInfo, setClassInfo] = useState<{id: string, name: string, creator_id: string} | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const fetchCallData = useCallback(async (user: User) => {
    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name, creator_id')
        .eq('id', params.id)
        .single();
    
    if (classError) {
        toast({ variant: 'destructive', title: 'Error', description: "Could not load class details." });
        router.push('/class');
        return;
    }
    setClassInfo(classData);

    const { data: memberIds, error: memberError } = await supabase
        .from('class_members')
        .select('user_id')
        .eq('class_id', params.id);
        
    if (memberError) {
        toast({ variant: 'destructive', title: 'Error', description: "Could not load members." });
        setLoading(false);
        return;
    }
    
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memberIds.map(m => m.user_id));

    if (profilesError) {
        toast({ variant: 'destructive', title: 'Error', description: "Could not load member profiles." });
        setLoading(false);
        return;
    }
    
    const allParticipants: Participant[] = profiles.map(p => ({
        ...p,
        isCurrentUser: p.id === user.id,
        isMuted: p.id === user.id ? isMuted : Math.random() > 0.5, // Mock other's mute status
        isCameraOn: p.id === user.id ? isCameraOn : Math.random() > 0.5 // Mock other's camera status
    }));

    setParticipants(allParticipants);
    setLoading(false);

  }, [params.id, supabase, toast, router, isMuted, isCameraOn]);


  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
            router.push('/signup');
            return;
        }
        setCurrentUser(user);
        fetchCallData(user);
    });
  }, [supabase.auth, router, fetchCallData]);


  const startStream = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode },
        audio: true
      });

      streamRef.current = newStream;
      setHasCameraPermission(true);
      
      newStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      newStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);

    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Hardware Access Denied', description: 'Please enable camera and microphone permissions.' });
    }
  }, [facingMode, isMuted, isCameraOn, toast]);

  useEffect(() => {
    startStream();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startStream]);


  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.enabled = !newMutedState);
    }
  };
  
  const handleToggleCamera = () => {
    const newCameraState = !isCameraOn;
    setIsCameraOn(newCameraState);
     if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.enabled = newCameraState);
    }
  };
  
  const handleEndCall = async () => {
    if (!classInfo || !currentUser) return;

    if (currentUser.id === classInfo.creator_id) {
        // Creator is ending the call for everyone
        const { error } = await supabase.from('classes')
            .update({ is_video_call_active: false })
            .eq('id', classInfo.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to end call' });
        }
    }
    // Everyone (including creator) goes back to the class chat page
    router.push(`/class/${classInfo.id}`);
  };

  const host = participants.find(p => p.isCurrentUser);
  const members = participants.filter(p => !p.isCurrentUser);
  
    if (loading) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

  return (
      <div className="flex h-dvh flex-col bg-gray-900 text-white">
        <header className="flex h-16 flex-shrink-0 items-center justify-between px-4 z-20">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleEndCall}>
                <ArrowLeft />
            </Button>
            <div>
                <p className="font-bold">{classInfo?.name}</p>
                <div className="flex items-center gap-1 text-xs text-green-400">
                    <Users className="h-3 w-3" />
                    <span>{participants.length} participants</span>
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2 space-y-2">
            {host && (
                <div className="relative rounded-lg overflow-hidden bg-black/80 flex items-center justify-center aspect-video">
                    {hasCameraPermission === false ? (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-xs">
                            <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
                            <p>Camera access denied.</p>
                        </div>
                    ) : (
                        <ParticipantVideo participant={host} stream={streamRef.current} />
                    )}
                </div>
            )}
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {members.map((member) => (
                    <ParticipantVideo key={member.id} participant={member} />
                ))}
            </div>
        </main>
        
        <footer className="flex-shrink-0 p-6 z-20">
            <div className="flex items-center justify-around">
               <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={handleToggleMute}>
                    {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={handleToggleCamera}>
                    {isCameraOn ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 border-0" onClick={handleFlipCamera}>
                  <RefreshCw className="h-7 w-7" />
                </Button>
                 <Button variant="destructive" size="icon" className="h-14 w-14 rounded-full" onClick={handleEndCall}>
                    <PhoneOff className="h-7 w-7" />
                </Button>
            </div>
          </footer>
      </div>
    );
}

    
