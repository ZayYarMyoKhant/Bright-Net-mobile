
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Phone, Mic, Image as ImageIcon, Send, Smile, MoreVertical, MessageSquareReply, Trash2, X, Loader2, Waves, Heart, ThumbsUp, Laugh, Frown, Check, Ban } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/emoji-picker";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/data";
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
  profiles: Profile;
}

type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  profiles: Profile;
  direct_message_reactions: Reaction[];
  is_seen_by_other: boolean;
};

const ReactionEmojis = {
  '👍': ThumbsUp,
  '❤️': Heart,
  '😂': Laugh,
  '😢': Frown
};


const ChatMessage = ({ message, isSender, onReply, onDelete, onReaction, otherUserId }: { message: DirectMessage, isSender: boolean, onReply: (message: any) => void, onDelete: (messageId: string) => void, onReaction: (messageId: string, emoji: string) => void, otherUserId: string }) => {
    
    const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
    const msgRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    
    const aggregatedReactions = message.direct_message_reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = { count: 0, users: [] };
        }
        acc[reaction.emoji].count++;
        // @ts-ignore
        acc[reaction.emoji].users.push(reaction.profiles.full_name);
        return acc;
    }, {} as Record<string, { count: number; users: string[] }>);

     useEffect(() => {
        const observer = new IntersectionObserver(
            async ([entry]) => {
                if (entry.isIntersecting && !isSender && !message.is_seen_by_other) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                       await supabase.from('direct_message_read_status').insert({
                           message_id: message.id,
                           user_id: user.id
                       });
                    }
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
                observer.unobserve(msgRef.current);
            }
        };
    }, [isSender, message.id, message.is_seen_by_other, supabase, otherUserId]);


    return (
        <div ref={msgRef} className={`flex items-start gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
            {!isSender && (
                <Link href={`/profile/${message.profiles.id}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.profiles.avatar_url} alt={message.profiles.username} data-ai-hint="person portrait" />
                        <AvatarFallback>{message.profiles.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>
            )}
            <div className="group relative max-w-xs">
                <div className={cn(
                    "rounded-lg",
                     message.media_type && ['image', 'video', 'sticker', 'audio'].includes(message.media_type) ? "bg-transparent" : (isSender ? 'bg-primary text-primary-foreground' : 'bg-muted')
                )}>
                     <div className={message.media_type && ['image', 'video', 'sticker', 'audio'].includes(message.media_type) ? "" : "px-3 py-2"}>
                        {!isSender && <p className="font-semibold text-xs mb-1">{message.profiles.full_name}</p>}
                        
                        {message.media_type === 'image' && message.media_url ? (
                            <div className="relative h-48 w-48 rounded-lg overflow-hidden">
                                <Image src={message.media_url} alt="sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                            </div>
                        ) : message.media_type === 'video' && message.media_url ? (
                            <video src={message.media_url} controls className="w-48 rounded-lg" />
                        ) : message.media_type === 'sticker' && message.media_url ? (
                             <div className="relative h-32 w-32">
                                <Image src={message.media_url} alt="sticker" layout="fill" objectFit="contain" unoptimized />
                            </div>
                        ) : message.media_type === 'audio' && message.media_url ? (
                            <audio controls src={message.media_url} className="w-60 h-10" />
                        ) : (
                            <p className="text-sm">{message.content}</p>
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
                             {isSender && (
                                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(message.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            )}
                             <DropdownMenuItem onClick={() => onReply(message)}>
                                <MessageSquareReply className="mr-2 h-4 w-4" />
                                <span>Reply</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                 <div className="flex items-center justify-end gap-1.5 px-2 py-0.5 mt-1">
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    {isSender && (
                      <Check className={cn("h-4 w-4", message.is_seen_by_other ? "text-blue-500" : "text-muted-foreground")} />
                    )}
                </div>
            </div>
        </div>
    )
};


export default function IndividualChatPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);

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
  
  const fetchChatData = useCallback(async (user: User, otherUserId: string) => {
    setLoading(true);
    
    // Check block status
    const { data: blockData, error: blockError } = await supabase
      .from('blocks')
      .select('*')
      .or(`(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`);

    if (blockData) {
        setIsBlocked(blockData.some(b => b.blocker_id === user.id));
        setIsBlockedBy(blockData.some(b => b.blocked_id === user.id));
    }


    const { data: otherUserData, error: otherUserError } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
    if(otherUserError) {
        toast({variant: 'destructive', title: 'User not found'});
        router.push('/chat');
        return;
    }
    setOtherUser(otherUserData);

    // Find or create conversation
    const { data: convos } = await supabase.rpc('get_or_create_conversation', { user_2_id: otherUserId });
    if (!convos || convos.length === 0) {
        toast({variant: 'destructive', title: 'Could not start conversation'});
        setLoading(false);
        return;
    }
    const currentConvoId = convos[0].id;
    setConversationId(currentConvoId);

    // Fetch messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('direct_messages')
      .select('*, profiles!direct_messages_sender_id_fkey(*), direct_message_reactions(*, profiles(*)), seen_by:direct_message_read_status(user_id)')
      .eq('conversation_id', currentConvoId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      toast({ variant: "destructive", title: "Failed to load messages." });
      setMessages([]);
    } else {
        const processedMessages = messagesData.map(msg => ({
            ...msg,
            // @ts-ignore
            is_seen_by_other: msg.seen_by.some(seen => seen.user_id === otherUserId)
        })) as DirectMessage[];
        setMessages(processedMessages);
    }
    setLoading(false);
  }, [supabase, toast, router]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
            router.push('/signup');
            return;
        }
        setCurrentUser(user);
        fetchChatData(user, params.id);
    });
    
    if (typeof Audio !== 'undefined' && process.env.NEXT_PUBLIC_NOTIFICATION_SOUND_URL) {
      notificationSoundRef.current = new Audio(process.env.NEXT_PUBLIC_NOTIFICATION_SOUND_URL);
    }
  }, [fetchChatData, supabase.auth, params.id, router]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Realtime subscriptions
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    
    const messageChannel = supabase.channel(`direct-messages-${conversationId}`)
      .on<DirectMessage>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
           const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', payload.new.sender_id)
                .single();
            if (!error && profile) {
                 const newMessage = { ...payload.new, profiles: profile as Profile, direct_message_reactions: [], is_seen_by_other: false } as DirectMessage;
                 setMessages((prevMessages) => [...prevMessages, newMessage]);
                 if (payload.new.sender_id !== currentUser.id) {
                    notificationSoundRef.current?.play().catch(e => console.error("Error playing sound:", e));
                 }
            }
        }
      ).subscribe();
      
    const reactionChannel = supabase.channel(`reactions-${conversationId}`)
        .on( 'postgres_changes',
          { event: '*', schema: 'public', table: 'direct_message_reactions' },
          (payload) => {
             fetchChatData(currentUser, params.id);
          }
      ).subscribe();

    const readStatusChannel = supabase.channel(`read-status-${conversationId}`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'direct_message_read_status' },
          (payload) => {
             fetchChatData(currentUser, params.id);
          }
      ).subscribe();
    
    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(reactionChannel);
      supabase.removeChannel(readStatusChannel);
    };
  }, [conversationId, supabase, currentUser, fetchChatData, params.id]);


  const handleReply = (message: any) => {
    setReplyingTo(message);
  };
  
  const handleDelete = async (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    const { error } = await supabase.from('direct_messages').delete().eq('id', messageId);
    if (error) {
        toast({ variant: 'destructive', title: "Failed to delete message."});
        if(currentUser) fetchChatData(currentUser, params.id); // refetch on error
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !mediaFile) || !currentUser || !conversationId) return;
    
    setSending(true);
    let publicMediaUrl = null;
    let mediaType = null;
    
    if (mediaFile) {
        const fileExtension = mediaFile.name.split('.').pop();
        const fileName = `public/${currentUser.id}-${Date.now()}.${fileExtension}`;
        
        const { error: uploadError } = await supabase.storage.from('direct-messages-media').upload(fileName, mediaFile);
        if (uploadError) {
            toast({ variant: "destructive", title: "Media upload failed", description: uploadError.message });
            setSending(false);
            return;
        }
        const { data: { publicUrl } } = supabase.storage.from('direct-messages-media').getPublicUrl(fileName);
        publicMediaUrl = publicUrl;
        mediaType = mediaFile.type.split('/')[0];
    }

    const { error: insertError } = await supabase.from('direct_messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: newMessage || null,
        media_url: publicMediaUrl,
        media_type: mediaType,
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
        .find(m => m.id === messageId)?.direct_message_reactions
        .find(r => r.user_id === currentUser.id && r.emoji === emoji);

    if (existingReaction) {
        await supabase.from('direct_message_reactions').delete().eq('id', existingReaction.id);
    } else {
        await supabase.from('direct_message_reactions').insert({ message_id: messageId, user_id: currentUser.id, emoji: emoji });
    }
  }

  const handleSendSticker = async (stickerUrl: string) => {
    if (!currentUser || !conversationId) return;
    setShowEmojiPicker(false);
    setSending(true);

    await supabase.from('direct_messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
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
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
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
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) {
      toast({ variant: "destructive", title: "Microphone Access Denied"});
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  const handleMicClick = () => {
    isRecording ? stopRecording() : startRecording();
  };

  const formatRecordingTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleInitiateCall = async () => {
    if (!currentUser || !otherUser) return;

    setIsCalling(true);
    const { data, error } = await supabase
        .from('video_calls')
        .insert({ caller_id: currentUser.id, callee_id: otherUser.id, status: 'requesting' })
        .select('id')
        .single();
    
    setIsCalling(false);

    if (error) {
        toast({ variant: 'destructive', title: 'Could not start call', description: error.message });
    } else {
        router.push(`/chat/${otherUser.id}/voice-call/${data.id}/requesting`);
    }
  }
  
  const handleBlockUser = async () => {
    if (!currentUser || !otherUser) return;

    const { error } = await supabase.from('blocks').insert({
        blocker_id: currentUser.id,
        blocked_id: otherUser.id,
    });

    if (error) {
        toast({ variant: 'destructive', title: 'Failed to block user', description: error.message });
    } else {
        toast({ title: `Blocked ${otherUser.username}` });
        setIsBlocked(true);
    }
  };

  const handleDeleteChat = async () => {
      if (!conversationId) return;

      const { error } = await supabase.from('conversations').delete().eq('id', conversationId);

      if (error) {
          toast({ variant: 'destructive', title: 'Failed to delete chat', description: error.message });
      } else {
          toast({ title: 'Chat deleted' });
          router.push('/chat');
          router.refresh();
      }
  };

  if (loading || !otherUser) {
    return <div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  const isChatDisabled = isBlocked || isBlockedBy;

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
            <Link href="/chat">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <Link href={`/profile/${otherUser.id}`}>
                <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser.avatar_url} alt={otherUser.username} data-ai-hint="person portrait" />
                    <AvatarFallback>{otherUser.username.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
            <div>
                <p className="font-bold">{otherUser.full_name}</p>
                {/* Add online status logic if available */}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleInitiateCall} disabled={isCalling}>
                {isCalling ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
            </Button>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-destructive" onClick={handleBlockUser}>
                <Ban className="mr-2 h-4 w-4" />
                <span>Block user</span>
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete chat</span>
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this entire conversation for both you and {otherUser.full_name}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteChat}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isSender={msg.sender_id === currentUser?.id} onReply={handleReply} onDelete={handleDelete} onReaction={handleReaction} otherUserId={otherUser.id}/>
        ))}
        <div ref={messagesEndRef} />
      </main>

       <footer className="sticky bottom-0 bg-background border-t">
        {isChatDisabled && (
            <div className="bg-muted p-3 text-center text-sm text-muted-foreground">
                {isBlocked ? `You have blocked this user.` : `You cannot reply to this conversation.`}
            </div>
        )}
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
                         <div className="flex items-center gap-2">
                            <Waves className="h-5 w-5 text-primary" />
                            <p className="text-sm font-mono text-muted-foreground">{formatRecordingTime(Math.round(mediaDuration || 0))}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleRemoveMedia}>
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            className="hidden" 
                            accept="image/*,video/*,audio/*"
                            disabled={isChatDisabled}
                        />
                        <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} disabled={isChatDisabled}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} disabled={isChatDisabled}>
                            <Smile className={cn("h-5 w-5 text-muted-foreground", showEmojiPicker && "text-primary")} />
                        </Button>
                        <Input 
                          placeholder="Type a message..." 
                          className="flex-1"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onFocus={() => setShowEmojiPicker(false)}
                          disabled={isChatDisabled}
                        />
                    </>
                )}

                <Button variant="ghost" size="icon" type="button" onClick={handleMicClick} disabled={isChatDisabled}>
                  <Mic className={cn("h-5 w-5 text-muted-foreground", isRecording && "text-red-500")} />
                </Button>
                <Button size="icon" type="submit" disabled={(!newMessage.trim() && !mediaFile) || sending || isChatDisabled}>
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </form>
        </div>
        {showEmojiPicker && (
            <EmojiPicker 
                onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)}
                onStickerSelect={handleSendSticker}
            />
        )}
      </footer>
    </div>
  );
}
