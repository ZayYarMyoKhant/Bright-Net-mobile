
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Video, Mic, Image as ImageIcon, Send, Smile, MoreVertical, MessageSquareReply, Trash2, X, Loader2, Waves, Users, Check, ThumbsUp, Heart, Laugh, Frown, CheckCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmojiPicker } from "@/components/emoji-picker";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/data";
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from "next/navigation";

type ClassInfo = {
  id: string;
  name: string;
  creator_id: string;
  is_video_call_active: boolean;
};

type MessageReaction = {
    id: string;
    emoji: string;
    user_id: string;
    profiles: Profile;
}

type ClassMessage = {
  id: string;
  class_id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  parent_message_id: string | null;
  created_at: string;
  profiles: Profile;
  message_reactions: MessageReaction[];
  is_seen_by_others: boolean;
  parent_message?: { content: string | null; media_type: string | null; profiles: { full_name: string } };
};

const ReactionEmojis = {
  '👍': ThumbsUp,
  '❤️': Heart,
  '😂': Laugh,
  '😢': Frown
};


const ChatMessage = ({ message, isSender, onReply, onDelete, currentUser, onReaction }: { message: ClassMessage, isSender: boolean, onReply: (message: any) => void, onDelete: (messageId: string) => void, currentUser: User | null, onReaction: (messageId: string, emoji: string) => void }) => {
    const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
    const supabase = createClient();
    const msgRef = useRef<HTMLDivElement>(null);
    
    const aggregatedReactions = message.message_reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = { count: 0, users: [] };
        }
        acc[reaction.emoji].count++;
        // @ts-ignore
        acc[reaction.emoji].users.push(reaction.profiles.full_name);
        return acc;
    }, {} as Record<string, { count: number; users: string[] }>);

    useEffect(() => {
        if (!isSender && currentUser && !message.is_seen_by_others) {
            const observer = new IntersectionObserver(
                async ([entry]) => {
                    if (entry.isIntersecting) {
                       await supabase.from('class_message_read_status').insert({
                           message_id: message.id,
                           user_id: currentUser.id
                       });
                        observer.disconnect();
                    }
                },
                { threshold: 0.5 }
            );

            if (msgRef.current) {
                observer.observe(msgRef.current);
            }

            return () => {
                if (msgRef.current) {
                    // @ts-ignore
                    observer.unobserve(msgRef.current);
                }
            };
        }
    }, [isSender, message.id, message.is_seen_by_others, supabase, currentUser]);

    return (
        <div ref={msgRef} className={`flex items-start gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
            {!isSender && (
                <Link href={`/profile/${message.profiles.id}`}>
                    <Avatar className="h-8 w-8" profile={message.profiles} />
                </Link>
            )}
            <div className="group relative max-w-xs">
                <div className={cn(
                    "rounded-lg",
                     message.media_type && ['sticker', 'audio'].includes(message.media_type) ? "bg-transparent" : (isSender ? 'bg-primary text-primary-foreground' : 'bg-muted')
                )}>
                     <div className={cn( "p-3 py-2")}>
                        {!isSender && <p className="font-semibold text-xs mb-1">{message.profiles.full_name}</p>}
                        
                        {message.parent_message && (
                            <div className="bg-black/10 p-2 rounded-md mb-2">
                                <div className="flex items-center gap-2">
                                    <MessageSquareReply className="h-3 w-3" />
                                    <p className="text-xs font-semibold">
                                        {isSender ? "You" : message.profiles.full_name} replied to {message.parent_message.profiles.full_name}
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 pl-5 truncate">
                                    {message.parent_message.content || `a ${message.parent_message.media_type}`}
                                </p>
                            </div>
                        )}

                        {message.media_type === 'image' && message.media_url ? (
                            <Link href={`/class/${message.class_id}/media-viewer?url=${encodeURIComponent(message.media_url)}&type=image`}>
                                <div className="relative h-48 w-48 rounded-lg overflow-hidden">
                                    <Image src={message.media_url} alt="sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                                </div>
                            </Link>
                        ) : message.media_type === 'video' && message.media_url ? (
                             <div className="relative h-48 w-48 rounded-lg overflow-hidden">
                                <video src={message.media_url} controls className="w-full h-full object-cover" />
                            </div>
                        ) : message.media_type === 'sticker' && message.media_url ? (
                             <div className="relative h-32 w-32">
                                <Image src={message.media_url} alt="sticker" layout="fill" objectFit="contain" unoptimized />
                            </div>
                        ) : message.media_type === 'audio' && message.media_url ? (
                            <audio controls src={message.media_url} className="w-60 h-10" />
                        ) : (
                            message.content && <p className="text-sm break-words">{message.content}</p>
                        )}
                     </div>
                </div>

                {Object.keys(aggregatedReactions).length > 0 && (
                     <div className="absolute -bottom-3 right-2 flex items-center gap-1">
                        {Object.entries(aggregatedReactions).map(([emoji, {count}]) => (
                            <div key={emoji} className="flex items-center bg-background border rounded-full px-1.5 py-0.5 text-xs shadow-sm">
                                <span>{emoji}</span>
                                <span className="ml-1 font-semibold text-muted-foreground">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
                

                <div className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-full", isSender ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20" : "text-muted-foreground hover:text-foreground hover:bg-black/10")}>
                                <Smile className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                         <PopoverContent className="w-auto p-1">
                            <div className="flex gap-1">
                                {Object.entries(ReactionEmojis).map(([emoji, Icon]) => (
                                    <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onReaction(message.id, emoji)}>
                                        <Icon className="h-5 w-5" />
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn("h-6 w-6", isSender ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20" : "text-muted-foreground hover:text-foreground hover:bg-black/10")}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             {isSender ? (
                                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(message.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => onReply(message)}>
                                    <MessageSquareReply className="mr-2 h-4 w-4" />
                                    <span>Reply</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                 <div className="flex items-center justify-end gap-1.5 px-2 py-0.5 mt-1">
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    {isSender && (
                        message.is_seen_by_others
                            ? <CheckCheck className={cn("h-4 w-4 text-blue-500")} />
                            : <Check className={cn("h-4 w-4 text-muted-foreground")} />
                    )}
                </div>
            </div>
        </div>
    )
};


export default function IndividualClassPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [messages, setMessages] = useState<ClassMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  const fetchClassData = useCallback(async (user: User | null) => {
    setLoading(true);
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, creator_id, is_video_call_active')
      .eq('id', params.id)
      .single();

    if (classError || !classData) {
      toast({ variant: "destructive", title: "Class not found." });
      setClassInfo(null);
      setLoading(false);
      router.push('/class');
      return;
    }
    setClassInfo(classData);
    setIsCreator(user?.id === classData.creator_id);

    const { data: messagesData, error: messagesError } = await supabase
      .from('class_messages')
      .select('*, profiles(*), message_reactions(*, profiles(*)), seen_by:class_message_read_status(user_id), parent_message:parent_message_id(*, content, media_type, profiles(full_name))')
      .eq('class_id', params.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      toast({ variant: "destructive", title: "Failed to load messages." });
      setMessages([]);
    } else {
        const processedMessages = messagesData.map(msg => ({
            ...msg,
             // @ts-ignore
            is_seen_by_others: msg.seen_by.some((seen: any) => seen.user_id !== user?.id)
        })) as ClassMessage[];
        setMessages(processedMessages);
    }
    setLoading(false);
  }, [params.id, supabase, toast, router]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user);
        fetchClassData(user);
    });
    
    if (typeof Audio !== 'undefined' && process.env.NEXT_PUBLIC_NOTIFICATION_SOUND_URL) {
      notificationSoundRef.current = new Audio(process.env.NEXT_PUBLIC_NOTIFICATION_SOUND_URL);
    }
  }, [fetchClassData, supabase.auth, params.id]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;
    const messageChannel = supabase.channel(`class-chat-${params.id}`)
      .on<ClassMessage>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'class_messages', filter: `class_id=eq.${params.id}` },
        async (payload) => {
           const { data: fullMessage, error } = await supabase
                .from('class_messages')
                .select('*, profiles(*), message_reactions(*, profiles(*)), seen_by:class_message_read_status(user_id), parent_message:parent_message_id(*, content, media_type, profiles(full_name))')
                .eq('id', payload.new.id)
                .single();
            if (!error && fullMessage) {
                 const newMessage = {
                     ...fullMessage,
                     is_seen_by_others: false
                 } as ClassMessage;
                 setMessages((prevMessages) => [...prevMessages, newMessage]);
                 if (payload.new.user_id !== currentUser.id) {
                    notificationSoundRef.current?.play().catch(e => console.error("Error playing sound:", e));
                 }
            }
        }
      )
      .on<MessageReaction>(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'message_reactions' },
          async (payload) => {
              fetchClassData(currentUser); 
          }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'class_message_read_status' },
        (payload) => {
             const { message_id, user_id } = payload.new as { message_id: string, user_id: string };
             if (user_id !== currentUser.id) {
                setMessages(prev => prev.map(msg => {
                    if (msg.id === message_id && msg.user_id === currentUser.id) {
                        return { ...msg, is_seen_by_others: true };
                    }
                    return msg;
                }));
             }
        }
       )
       .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'classes', filter: `id=eq.${params.id}` },
        (payload) => {
            setClassInfo(prev => prev ? { ...prev, is_video_call_active: (payload.new as ClassInfo).is_video_call_active } : null);
        }
       )
      .subscribe();
    
    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [params.id, supabase, fetchClassData, currentUser]);

  const handleReply = (message: any) => {
    setReplyingTo(message);
  };
  
  const handleDelete = async (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    const { error } = await supabase.from('class_messages').delete().eq('id', messageId);
    if (error) {
        toast({ variant: 'destructive', title: "Failed to delete message."});
        fetchClassData(currentUser);
    } else {
        toast({ title: "Message deleted" });
    }
  };
  
 const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
        setMediaDuration(null);
      } else {
        toast({variant: "destructive", title: "Unsupported File Type"});
        handleRemoveMedia();
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaDuration(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !mediaFile) || !currentUser) return;
    
    setSending(true);
    let publicMediaUrl = null;
    let mediaType = null;
    
    if (mediaFile) {
        const fileExtension = mediaFile.name.split('.').pop();
        const fileName = `public/class-media/${currentUser.id}-${Date.now()}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, mediaFile);
        if (uploadError) {
            toast({ variant: "destructive", title: "Media upload failed", description: uploadError.message });
            setSending(false);
            return;
        }
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        publicMediaUrl = publicUrl;
        mediaType = mediaFile.type.split('/')[0];
    }

    const { error: insertError } = await supabase.from('class_messages').insert({
        class_id: params.id,
        user_id: currentUser.id,
        content: newMessage || null,
        media_url: publicMediaUrl,
        media_type: mediaType,
        parent_message_id: replyingTo?.id || null,
    });
    
    setNewMessage("");
    handleRemoveMedia();
    setReplyingTo(null);
    setSending(false);
    setShowEmojiPicker(false);
    
    if (insertError) {
        toast({ variant: "destructive", title: "Failed to send message", description: insertError.message });
    }
  }
  
    const handleReaction = async (messageId: string, emoji: string) => {
        if (!currentUser) return;

        const existingReaction = messages
            .find(m => m.id === messageId)?.message_reactions
            .find(r => r.user_id === currentUser.id && r.emoji === emoji);

        if (existingReaction) {
            await supabase.from('message_reactions').delete().eq('id', existingReaction.id);
        } else {
            await supabase.from('message_reactions').insert({
                message_id: messageId,
                user_id: currentUser.id,
                emoji: emoji
            });
        }
    }


  const handleSendSticker = async (stickerUrl: string) => {
    setShowEmojiPicker(false);
    setSending(true);

    if (!currentUser) return;

    await supabase.from('class_messages').insert({
        class_id: params.id,
        user_id: currentUser.id,
        media_url: stickerUrl,
        media_type: 'sticker'
    });

    setSending(false);
  }

 const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setMediaDuration(recordingTime);
        setRecordingTime(0);
        setMediaFile(audioFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

    } catch (error) {
      console.error("Mic permission denied", error);
      toast({ variant: "destructive", title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser settings." });
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatRecordingTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

    const handleLeaveClass = async () => {
        if (!currentUser) return;
        const { error } = await supabase.from('class_members').delete().match({ class_id: params.id, user_id: currentUser.id });
        if (error) {
            toast({ variant: "destructive", title: "Failed to leave class", description: error.message });
        } else {
            toast({ title: "You have left the class." });
            router.push('/class');
            router.refresh();
        }
    };

    const handleDeleteClass = async () => {
        if (!isCreator) return;
        const { error } = await supabase.from('classes').delete().eq('id', params.id);
         if (error) {
            toast({ variant: "destructive", title: "Failed to delete class", description: error.message });
        } else {
            toast({ title: "Class has been deleted." });
            router.push('/class');
            router.refresh();
        }
    };

    const handleVideoCallClick = async () => {
        if (!classInfo) return;
        if (isCreator) {
            // As creator, start the call
             const { error } = await supabase.from('classes')
                .update({ is_video_call_active: true })
                .eq('id', classInfo.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Could not start call' });
            } else {
                 router.push(`/class/${classInfo.id}/video-call`);
            }
        } else {
            // As member, join the call if active
            if (classInfo.is_video_call_active) {
                router.push(`/class/${classInfo.id}/video-call`);
            }
        }
    };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
            <Link href="/class">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <Link href={`/class/${classInfo?.id}/info`}>
                <p className="font-bold">{classInfo?.name || "Loading..."}</p>
            </Link>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleVideoCallClick} disabled={!isCreator && !classInfo?.is_video_call_active}>
              <Video className={cn("h-5 w-5", classInfo?.is_video_call_active && "text-green-500 animate-pulse")} />
            </Button>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {isCreator ? (
                    <DropdownMenuItem className="text-destructive" onClick={handleDeleteClass}>Delete Class</DropdownMenuItem>
                ) : (
                    <DropdownMenuItem className="text-destructive" onClick={handleLeaveClass}>Leave Class</DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
           <div className="flex justify-center items-center h-full pt-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center p-10 text-muted-foreground flex flex-col items-center">
            <Users className="h-12 w-12 mb-4" />
            <p className="font-bold">No messages yet</p>
            <p className="text-sm mt-1">Be the first to start the conversation!</p>
          </div>
        ) : (
            messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} isSender={msg.user_id === currentUser?.id} onReply={handleReply} onDelete={handleDelete} currentUser={currentUser} onReaction={handleReaction}/>
            ))
        )}
        <div ref={messagesEndRef} />
      </main>

       <footer className="sticky bottom-0 bg-background border-t">
        <div className="p-2">
            {replyingTo && (
                <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 text-xs">
                    <div className="truncate">
                        <span className="text-muted-foreground">Replying to </span>
                        <span className="font-semibold">{replyingTo.profiles.full_name}</span>: 
                        <span className="text-muted-foreground ml-1">{replyingTo.media_url ? "a media file" : replyingTo.content}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyingTo(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
             {mediaPreview && !mediaFile?.type.startsWith('audio') && (
                <div className="p-2 relative">
                    <div className="relative w-24 h-24 rounded-md overflow-hidden">
                        {mediaFile?.type.startsWith('image/') ? (
                            <Image src={mediaPreview} alt="Media preview" layout="fill" objectFit="cover" />
                        ) : (
                            <video src={mediaPreview} className="w-full h-full object-cover" />
                        )}
                         <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full z-10"
                            onClick={handleRemoveMedia}
                         >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                 { isRecording ? (
                    <div className="flex-1 flex items-center bg-muted h-10 rounded-md px-3 gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <p className="text-sm font-mono text-red-500">{formatRecordingTime(recordingTime)}</p>
                    </div>
                ) : mediaFile && mediaFile.type.startsWith('audio/') ? (
                    <div className="flex-1 flex items-center bg-muted h-10 rounded-md px-3 gap-2 justify-between">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleRemoveMedia}>
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Waves className="h-5 w-5 text-primary" />
                            <p className="text-sm font-mono text-muted-foreground">{formatRecordingTime(Math.round(mediaDuration || 0))}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            className="hidden" 
                            accept="image/*,video/*,audio/*"
                        />
                        <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                            <Smile className={cn("h-5 w-5 text-muted-foreground", showEmojiPicker && "text-primary")} />
                        </Button>
                        <Input 
                          placeholder="Type a message..." 
                          className="flex-1"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onFocus={() => setShowEmojiPicker(false)}
                        />
                    </>
                )}

                <Button variant="ghost" size="icon" type="button" onClick={handleMicClick}>
                  <Mic className={cn("h-5 w-5 text-muted-foreground", isRecording && "text-red-500")} />
                </Button>
                <Button size="icon" type="submit" disabled={(!newMessage.trim() && !mediaFile) || sending}>
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </form>
        </div>
        {showEmojiPicker && (
            <EmojiPicker 
                onEmojiSelect={(emoji) => {
                    setNewMessage(prev => prev + emoji);
                }}
                onStickerSelect={handleSendSticker}
            />
        )}
      </footer>
    </div>
  );
}
