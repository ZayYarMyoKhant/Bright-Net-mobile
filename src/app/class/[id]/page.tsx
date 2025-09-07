
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Video, MoreVertical, Image as ImageIcon, Send, Smile, Mic, Trash2, Loader2, Check, CheckCheck, X, Expand, MessageSquareReply, Heart,ThumbsUp, Laugh, Frown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import AudioPlayer from "@/components/audio-player";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


type Profile = {
    username: string;
    avatar_url: string;
};

type Reaction = {
    reaction: string;
    user_id: string;
    profiles: {
      username: string;
    }
};

type Message = {
    id: string;
    content: string | null;
    created_at: string;
    user_id: string;
    profiles: Profile;
    is_read?: boolean;
    media_url?: string | null;
    media_type?: 'image' | 'video' | 'text' | 'audio' | null;
    media_duration?: number | null;
    reactions: Reaction[];
};

const ReactionEmojis = {
  '❤️': Heart,
  '👍': ThumbsUp,
  '😂': Laugh,
  '😢': Frown
};

const ChatMessage = ({ message, isSender, currentUserId, onNewReaction }: { message: Message, isSender: boolean, currentUserId: string | undefined, onNewReaction: (messageId: string, reaction: Reaction) => void }) => {
    const sentTime = format(new Date(message.created_at), 'h:mm a');
    const supabase = createClient();
    const [isReacting, setIsReacting] = useState(false);

    const renderContent = () => {
        if (message.media_type === 'image' && message.media_url) {
            return (
                <div className="relative h-48 w-48 rounded-lg overflow-hidden group">
                    <Image src={message.media_url} alt="Sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                     <Link href={`/class/media/image/${encodeURIComponent(message.media_url)}`} legacyBehavior passHref>
                        <a onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Expand className="h-8 w-8 text-white" />
                        </a>
                    </Link>
                </div>
            )
        }
        if (message.media_type === 'video' && message.media_url) {
             return (
                <Link href={`/class/media/video/${encodeURIComponent(message.media_url)}`} legacyBehavior passHref>
                  <a target="_blank" rel="noopener noreferrer">
                    <video src={message.media_url} controls className="max-w-60 rounded-lg" />
                  </a>
                </Link>
             )
        }
        if (message.media_type === 'audio' && message.media_url) {
            return (
                <AudioPlayer 
                    audioUrl={message.media_url} 
                    duration={message.media_duration || 0}
                    isSender={isSender}
                />
            )
        }
        return <p className="text-sm pr-6">{message.content}</p>;
    }
    
    const handleReact = async (reaction: string) => {
        if (!currentUserId) return;

        // Optimistic UI update
        onNewReaction(message.id, {
            reaction,
            user_id: currentUserId,
            profiles: { username: 'You' } // Placeholder
        });
        
        setIsReacting(false);

        // DB operation
        // First, remove any existing reaction from this user for this message
        await supabase.from('message_reactions')
            .delete()
            .match({ message_id: message.id, user_id: currentUserId });

        // Then, insert the new reaction
        const { error } = await supabase.from('message_reactions').insert({
            message_id: message.id,
            user_id: currentUserId,
            reaction,
        });

        if (error) {
            console.error('Failed to react:', error);
            // Here you might want to revert the optimistic update
        }
    };
    
    const groupedReactions = message.reactions.reduce((acc, r) => {
        if (!acc[r.reaction]) {
            acc[r.reaction] = 0;
        }
        acc[r.reaction]++;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className={`flex items-start gap-2 ${isSender ? 'justify-end' : ''}`}>
             {!isSender && (
                 <Link href={`/profile/${message.profiles.username}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={message.profiles.avatar_url} alt={message.profiles.username} />
                        <AvatarFallback>{message.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                 </Link>
            )}
             <div className="flex flex-col gap-1 items-start max-w-sm">
                 <div className={cn(
                    "relative group max-w-xs rounded-lg",
                    message.media_type === 'audio' ? '' : 'px-3 py-2',
                    isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                    <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className={cn("h-6 w-6", isSender ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20" : "text-muted-foreground hover:text-foreground hover:bg-black/10")}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {isSender ? (
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem>
                                        <MessageSquareReply className="mr-2 h-4 w-4"/>
                                        <span>Reply</span>
                                    </DropdownMenuItem>
                                )}
                                <Popover open={isReacting} onOpenChange={setIsReacting}>
                                    <PopoverTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                             <Smile className="mr-2 h-4 w-4" />
                                            <span>React</span>
                                        </DropdownMenuItem>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-1">
                                        <div className="flex gap-1">
                                            {Object.entries(ReactionEmojis).map(([emoji, Icon]) => (
                                                 <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleReact(emoji)}>
                                                    <Icon className="h-5 w-5" />
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {!isSender && <p className="font-semibold text-xs mb-1 text-primary">{message.profiles.username}</p>}
                    {renderContent()}
                    {message.media_url && message.content && message.media_type !== 'audio' && <p className="text-sm mt-1">{message.content}</p>}

                    {Object.keys(groupedReactions).length > 0 && (
                        <div className="absolute -bottom-3 right-2 flex items-center gap-1">
                           {Object.entries(groupedReactions).map(([reaction, count]) => (
                               <div key={reaction} className="flex items-center bg-background border rounded-full px-1.5 py-0.5 text-xs">
                                   <span>{reaction}</span>
                                   <span className="ml-1 font-semibold">{count}</span>
                               </div>
                           ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5 px-1 pt-1">
                    <p className="text-xs text-muted-foreground">{sentTime}</p>
                    {isSender && (
                      message.is_read ? <CheckCheck className="h-4 w-4 text-blue-500" /> : <Check className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>
        </div>
    )
};


export default function ClassChannelPage({ params: paramsPromise }: { params: Promise<{ id:string }> }) {
  const params = use(paramsPromise);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [classInfo, setClassInfo] = useState<{ id: string; name: string; avatarFallback: string } | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Voice message states
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleNewReaction = useCallback((messageId: string, newReaction: Reaction) => {
    setMessages(prevMessages => {
        return prevMessages.map(msg => {
            if (msg.id === messageId) {
                // Remove existing reaction from the same user if any
                const filteredReactions = msg.reactions.filter(r => r.user_id !== newReaction.user_id);
                // Add the new reaction
                const newReactions = [...filteredReactions, newReaction];

                return { ...msg, reactions: newReactions };
            }
            return msg;
        });
    });
   }, []);


   const handleNewMessage = useCallback(
    async (payload: any) => {
        
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', payload.new.user_id)
        .single();
  
      if (profileData) {
        const newMessageWithProfile: Message = {
          ...payload.new,
          profiles: profileData,
          is_read: false,
          reactions: []
        };
        
        setMessages((prevMessages) => {
            if (prevMessages.some(msg => msg.id === newMessageWithProfile.id)) {
                return prevMessages;
            }
            return [...prevMessages, newMessageWithProfile]
        });
      }
    },
    [supabase]
  );

  const handleReadStatusUpdate = useCallback((payload: any) => {
    setMessages(prevMessages => {
        const updatedMessages = prevMessages.map(msg => {
            if (msg.id === payload.new.message_id) {
                 return { ...msg, is_read: true };
            }
            return msg;
        });

        // Avoid re-render if no change
        if (JSON.stringify(prevMessages) !== JSON.stringify(updatedMessages)) {
            return updatedMessages;
        }
        return prevMessages;
    });
  }, []);
  
  const handleReactionUpdate = useCallback(async (payload: any) => {
     setMessages(prev => {
        // Find the message to update
        const messageIndex = prev.findIndex(msg => msg.id === payload.new.message_id);
        if (messageIndex === -1) return prev;

        const updatedMessages = [...prev];
        const messageToUpdate = { ...updatedMessages[messageIndex] };
        
        // Find if the user already reacted
        const reactionIndex = messageToUpdate.reactions.findIndex(r => r.user_id === payload.new.user_id);

        if (reactionIndex > -1) {
            // Update existing reaction
            messageToUpdate.reactions[reactionIndex] = { ...messageToUpdate.reactions[reactionIndex], reaction: payload.new.reaction };
        } else {
             // Add new reaction (profile needs to be fetched or passed)
             messageToUpdate.reactions.push({
                reaction: payload.new.reaction,
                user_id: payload.new.user_id,
                profiles: { username: '...' } // Or fetch profile
            });
        }
        
        updatedMessages[messageIndex] = messageToUpdate;

        return updatedMessages;
     });
  }, []);

  const markMessagesAsRead = useCallback(async (msgs: Message[], user: SupabaseUser) => {
    const unreadMessageIds = msgs
      .filter(m => m.user_id !== user.id && !m.is_read)
      .map(m => m.id);

    if (unreadMessageIds.length === 0) return;

    const readReceipts = unreadMessageIds.map(message_id => ({
        message_id,
        reader_id: user.id,
    }));
    
    await supabase.from('message_read_status').upsert(readReceipts, {
      onConflict: 'message_id,reader_id'
    });
  }, [supabase]);


  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      const { data: classData } = await supabase.from('classes').select('name').eq('id', params.id).single();
      if (classData) {
        setClassInfo({
          id: params.id,
          name: classData.name,
          avatarFallback: classData.name.charAt(0),
        });
      }

      if (user) {
        const { data: initialMessages } = await supabase
          .from('class_messages')
          .select(`
            *,
            profiles (username, avatar_url),
            message_read_status (reader_id),
            message_reactions (*, profiles(username))
          `)
          .eq('class_id', params.id)
          .order('created_at', { ascending: true });
          
        if (initialMessages) {
            const memberCountResult = await supabase
              .from('class_members')
              .select('user_id', { count: 'exact' })
              .eq('class_id', params.id);
            
            const memberCount = memberCountResult.data?.length || 1;

            const processedMessages = initialMessages.map((msg: any) => ({
                ...msg,
                is_read: msg.message_read_status.length >= (memberCount - 1),
                // @ts-ignore
                reactions: msg.message_reactions,
            }));
            setMessages(processedMessages as Message[]);
            markMessagesAsRead(processedMessages, user);
        }
      }
      
      setLoading(false);
    };
    
    fetchInitialData();
  }, [params.id, supabase, markMessagesAsRead]);

  useEffect(() => {
    if (!params.id || !supabase) return;

    const channel = supabase.channel(`class-chat-${params.id}`);

    const messageSubscription = channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'class_messages', filter: `class_id=eq.${params.id}` },
        handleNewMessage
    );

    const readStatusSubscription = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_read_status' },
        (payload) => {
             handleReadStatusUpdate(payload);
        }
    );

     const reactionSubscription = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        handleReactionUpdate
    );
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, supabase, handleNewMessage, handleReadStatusUpdate, handleReactionUpdate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
      } else {
        toast({variant: "destructive", title: "Unsupported File Type", description: "Only images and videos are allowed."});
        setMediaFile(null);
        setMediaPreview(null);
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !mediaFile) || !currentUser || !classInfo) return;
    
    setSending(true);
    let media_url = null;
    let media_type: 'image' | 'video' | 'text' | 'audio' | null = null;
    let media_duration: number | null = null;

    if (mediaFile) {
        const filePath = `class_media/${classInfo.id}/${currentUser.id}/${Date.now()}_${mediaFile.name}`;
        
        const { error: uploadError } = await supabase.storage
            .from('avatars') 
            .upload(filePath, mediaFile);
        
        if (uploadError) {
            console.error("Upload error:", uploadError);
            toast({variant: "destructive", title: "Upload Failed", description: "Failed to upload file."});
            setSending(false);
            return;
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        media_url = urlData.publicUrl;

        if (mediaFile.type.startsWith('image')) {
            media_type = 'image';
        } else if (mediaFile.type.startsWith('video')) {
            media_type = 'video';
        } else if (mediaFile.type.startsWith('audio')) {
            media_type = 'audio';
            // This is a simplified way to get duration. Might not be perfect.
             const audio = document.createElement('audio');
            const audioUrl = URL.createObjectURL(mediaFile);
            
            const durationPromise = new Promise<number>((resolve) => {
                audio.addEventListener('loadedmetadata', () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve(audio.duration);
                }, { once: true });
            });

            audio.src = audioUrl;
            media_duration = await durationPromise;
        }
    } else {
        media_type = 'text';
    }


    const content = newMessage;
    
    await supabase.from('class_messages').insert({
        content: content || null,
        class_id: classInfo.id,
        user_id: currentUser.id,
        media_url,
        media_type,
        media_duration
    });
    

    setNewMessage("");
    handleRemoveMedia();
    setSending(false);
  }

  const handleMicClick = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        // Start recording
        if (!hasMicPermission) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setHasMicPermission(true);
                mediaRecorderRef.current = new MediaRecorder(stream);
                
                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
                    audioChunksRef.current = [];
                    
                    setMediaFile(audioFile);
                    // We will trigger send from useEffect when mediaFile changes
                };

            } catch (error) {
                console.error("Mic permission denied", error);
                toast({ variant: "destructive", title: "Microphone Access Denied", description: "Please enable microphone permissions in your browser settings." });
                return;
            }
        }
        
        // This needs to be in a separate block to handle the case where permission was just granted
        if (mediaRecorderRef.current) {
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        }
    };
    
    // This effect will trigger the send message when an audio file is ready
    useEffect(() => {
        if (mediaFile && mediaFile.type.startsWith('audio/')) {
            handleSendMessage();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaFile]);


  if (loading || !classInfo) {
      return (
        <div className="flex h-dvh flex-col bg-background text-foreground items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading channel...</p>
        </div>
      )
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
            <Link href="/class">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <Link href={`/class/${classInfo.id}/info`}>
              <Avatar className="h-10 w-10">
                  <AvatarFallback>{classInfo.avatarFallback}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
                <p className="font-bold">{classInfo.name}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/class/${classInfo.id}/video-call`}>
            <Button variant="ghost" size="icon">
              <Video className="h-5 w-5" />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-destructive">Leave class</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isSender={msg.user_id === currentUser?.id} currentUserId={currentUser?.id} onNewReaction={handleNewReaction} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="flex-shrink-0 border-t p-2">
        {mediaPreview && (
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
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept="image/*,video/*"
            />
            <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
            <Button variant="ghost" size="icon" type="button"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
            <Input 
              placeholder="Type a message..." 
              className="flex-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button variant="ghost" size="icon" type="button" onClick={handleMicClick}>
              <Mic className={cn("h-5 w-5 text-muted-foreground", isRecording && "text-red-500")} />
            </Button>
            <Button size="icon" type="submit" disabled={(!newMessage.trim() && !mediaFile) || sending}>
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </form>
      </footer>
    </div>
  );
}
