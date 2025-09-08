
"use client";

import { useState, use, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Mic, MicOff, PhoneOff, Video, VideoOff, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type Profile = {
    id: string;
    username: string;
    avatar_url: string;
    isMuted: boolean; // Placeholder
}

type ClassInfo = {
    id: string;
    name: string;
    created_by: string;
    avatarFallback: string;
};


export default function ClassVideoCallPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const supabase = createClient();
  const { toast } = useToast();

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Video call state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isCreator = currentUser?.id === classInfo?.created_by;

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

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      
      // Mute/unmute the local audio track based on state
      newStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      // Turn camera on/off based on state
      newStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);

    } catch (error) {
      console.error('Error accessing camera/mic:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Hardware Access Denied',
        description: 'Please enable camera and microphone permissions in your browser settings.',
      });
    }
  }, [facingMode, isMuted, isCameraOn, toast]);

  useEffect(() => {
    startStream();
    
    // Cleanup on component unmount
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
    if (!classInfo) return;
    await supabase.from('classes').update({ is_live: false }).eq('id', classInfo.id);
    // The router push will navigate away and trigger cleanup
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name, created_by')
        .eq('id', params.id)
        .single();
      
      if (classError || !classData) {
        setLoading(false);
        return;
      }

      setClassInfo({
        ...classData,
        avatarFallback: classData.name.charAt(0)
      });
      
      const { data: memberData } = await supabase
        .from('class_members')
        .select('profiles(*)')
        .eq('class_id', params.id);
        
      if (memberData) {
        // @ts-ignore
        setMembers(memberData.map(m => ({...m.profiles, isMuted: Math.random() > 0.5 })));
      }
      
      setLoading(false);
    }
    fetchInitialData();
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="flex h-dvh flex-col bg-background text-foreground items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2">Joining call...</p>
      </div>
    )
  }
  
  if (!classInfo) {
     return (
        <div className="flex h-dvh flex-col bg-background text-foreground items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="mt-2">Class not found.</p>
             <Link href="/class" className="mt-4">
                <Button>Back to Classes</Button>
            </Link>
        </div>
    )
  }

  const host = members.find(m => m.id === classInfo.created_by);
  const otherMembers = members.filter(m => m.id !== classInfo.created_by);


  return (
    <div className="flex h-dvh flex-col bg-gray-900 text-white">
      <header className="flex h-16 flex-shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href={`/class/${classInfo.id}`}>
            <Button variant="ghost" size="icon" className="hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-10 w-10">
            <AvatarFallback>{classInfo.avatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold">{classInfo.name}</p>
            <p className="text-xs text-green-400">{members.length} participants</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2 flex flex-col">
        {/* Host/Self View */}
        <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden bg-black mb-2">
            <video ref={videoRef} className={cn("w-full h-full object-cover", !isCameraOn && "hidden")} autoPlay muted playsInline />
            
            {!isCameraOn && (
                <div className="flex flex-col items-center justify-center h-full">
                    <VideoOff className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Camera is off</p>
                </div>
            )}
            
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center">
                   <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>
                        Please allow camera access to use this feature. You may need to refresh the page.
                      </AlertDescription>
                    </Alert>
                </div>
            )}

            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white">
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span>You</span>
            </div>
        </div>
        {/* Members View */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
            {host && host.id !== currentUser?.id && (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                    <AvatarImage src={host.avatar_url} alt={host.username} className="object-cover w-full h-full opacity-50" />
                     <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                        {host.isMuted ? <MicOff className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5" />}
                        <span className="truncate">{host.username} (Host)</span>
                    </div>
                 </div>
            )}
            {otherMembers.filter(m => m.id !== currentUser?.id).map(member => (
                 <div key={member.id} className="relative aspect-square rounded-lg overflow-hidden bg-black">
                    <AvatarImage src={member.avatar_url} alt={member.username} className="object-cover w-full h-full opacity-50" />
                     <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                        {member.isMuted ? <MicOff className="h-2.5 w-2.5" /> : <Mic className="h-2.5 w-2.5" />}
                        <span className="truncate">{member.username}</span>
                    </div>
                 </div>
            ))}
        </div>
      </main>

      <footer className="flex-shrink-0 p-4">
        <div className="flex items-center justify-around">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 border-0 hover:bg-white/30" onClick={handleToggleMute}>
            {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </Button>
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 border-0 hover:bg-white/30" onClick={handleToggleCamera}>
            {isCameraOn ? <Video className="h-7 w-7" /> : <VideoOff className="h-7 w-7" />}
          </Button>
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full bg-white/20 border-0 hover:bg-white/30" onClick={handleFlipCamera}>
            <RefreshCw className="h-7 w-7" />
          </Button>
          <Link href={`/class/${classInfo.id}`}>
            <Button variant={isCreator ? "destructive" : "secondary"} size="icon" className="h-14 w-14 rounded-full" onClick={isCreator ? handleEndCall : undefined}>
              <PhoneOff className="h-7 w-7" />
              <span className="sr-only">{isCreator ? "End Call" : "Leave Call"}</span>
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
}
