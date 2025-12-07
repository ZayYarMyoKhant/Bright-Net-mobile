
"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Mic, Image as ImageIcon, Send, Smile, MoreVertical, MessageSquareReply, Trash2, X, Loader2, Waves, Heart, ThumbsUp, Laugh, Frown, Check, CheckCheck, Ban, Share2, AlertTriangle, StopCircle, Pencil, ClipboardCopy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/emoji-picker";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/lib/data";
import { formatDistanceToNow, isBefore, subMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
  profiles: Profile;
}

type OtherUserWithPresence = Profile & {
    last_seen: string | null;
    show_active_status: boolean;
    active_conversation_id?: string | null;
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
  parent_message_id: string | null;
  parent_message?: { content: string | null; media_type: string | null; profiles: { full_name: string } };
  direct_message_reactions: Reaction[];
  is_seen_by_other: boolean;
  is_shared_post: boolean;
  is_edited?: boolean;
};

const ReactionEmojis = {
  '👍': ThumbsUp,
  '❤️': Heart,
  '😂': Laugh,
  '😢': Frown
};

type InitialChatData = {
    otherUser: OtherUserWithPresence | null;
    conversationId: string | null;
    messages: DirectMessage[];
    isBlocked: boolean;
    isBlockedBy: boolean;
    error: string | null;
}

type RecordingStatus = 'idle' | 'recording' | 'preview';
type OtherUserActivity = 'online' | 'offline' | 'typing' | 'busy';


function PresenceIndicator({ user }: { user: OtherUserWithPresence | null }) {
    if (!user || !user.show_active_status || !user.last_seen) {
        return null;
    }

    const twoMinutesAgo = subMinutes(new Date(), 2);
    const isOnline = isBefore(twoMinutesAgo, new Date(user.last_seen));

    if (isOnline) {
         return (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
         )
    }

    return null;
}


const ChatMessage = ({ message, isSender, onReply, onDelete, onEdit, onReaction, currentUser }: { message: DirectMessage, isSender: boolean, onReply: (message: any) => void, onDelete: (messageId: string) => void, onEdit: (message: DirectMessage) => void, onReaction: (messageId: string, emoji: string) => void, currentUser: User | null }) => {
    
    const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });
    const msgRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const { toast } = useToast();
    
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
                if (entry.isIntersecting && !isSender && currentUser) {
                    const { error } = await supabase.from('direct_message_read_status').insert({
                        message_id: message.id,
                        user_id: currentUser.id
                    }, { onConflict: 'message_id, user_id' }); // Prevent duplicates

                    if (!error) {
                        observer.disconnect(); // Disconnect after successfully marking as read
                    }
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
    }, [isSender, message.id, supabase, currentUser]);

    const handleCopy = () => {
        if (message.content) {
            navigator.clipboard.writeText(message.content)
                .then(() => {
                    toast({ title: "Copied to clipboard" });
                })
                .catch(err => {
                    toast({ variant: 'destructive', title: "Failed to copy" });
                    console.error('Failed to copy text: ', err);
                });
        }
    };

    const renderMedia = (isShared: boolean) => {
        const mediaClass = isShared ? "w-48 h-48 mt-2" : "w-48 h-48";
        if (message.media_type === 'image' && message.media_url) {
            return (
                <div className={cn("relative rounded-lg overflow-hidden", mediaClass)}>
                    <Image src={message.media_url} alt="sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                </div>
            );
        }
        if (message.media_type === 'video' && message.media_url) {
            return <video src={message.media_url} controls className={cn("rounded-lg", mediaClass)} />;
        }
        if (message.media_type === 'sticker' && message.media_url) {
            return (
                <div className="relative h-32 w-32">
                    <Image src={message.media_url} alt="sticker" layout="fill" objectFit="contain" unoptimized />
                </div>
            );
        }
        if (message.media_type === 'audio' && message.media_url) {
            return <audio controls src={message.media_url} className="w-60 h-10" />;
        }
        return null;
    };


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
                     <div className="px-3 py-2">
                        {!isSender && !message.is_shared_post && !message.parent_message && <p className={cn("font-semibold text-xs mb-1", message.profiles.is_verified && "font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md px-2 py-1 inline-block")}>{message.profiles.full_name}</p>}
                        
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
                        
                        {message.is_shared_post ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Share2 className="h-3 w-3" />
                                    <p className="text-xs font-semibold">
                                        {isSender ? "You shared a post" : `${message.profiles.full_name} shared a post`}
                                    </p>
                                </div>
                                {renderMedia(true)}
                                {message.content && <p className="text-sm pt-2">{message.content}</p>}
                            </div>
                        ) : message.media_type === 'image' || message.media_type === 'video' ? (
                            <>
                                {renderMedia(false)}
                                {message.content && <p className="text-sm pt-2">{message.content}</p>}
                            </>
                        ) : (
                             <>
                                {renderMedia(false)}
                                {message.content && <p className="text-sm break-words">{message.content}</p>}
                             </>
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
                             {isSender && message.content && (
                                <>
                                    <DropdownMenuItem onClick={() => onEdit(message)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                </>
                            )}
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
                            {message.content && (
                                <DropdownMenuItem onClick={handleCopy}>
                                    <ClipboardCopy className="mr-2 h-4 w-4" />
                                    <span>Copy</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                 <div className="flex items-center justify-end gap-1.5 px-2 py-0.5 mt-1">
                    {message.is_edited && <span className="text-xs text-muted-foreground">(edited)</span>}
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    {isSender && (
                      message.is_seen_by_other 
                        ? <CheckCheck className="h-4 w-4 text-blue-500" /> 
                        : <Check className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>
        </div>
    )
}
export default function ChatPageContent({ initialData, params }: { initialData: InitialChatData, params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  const [otherUser, setOtherUser] = useState<OtherUserWithPresence | null>(initialData.otherUser);
  const [conversationId, setConversationId] = useState<string | null>(initialData.conversationId);
  const [messages, setMessages] = useState<DirectMessage[]>(initialData.messages);
  const [error, setError] = useState<string | null>(initialData.error);
  const [isBlocked, setIsBlocked] = useState(initialData.isBlocked);
  const [isBlockedBy, setIsBlockedBy] = useState(initialData.isBlockedBy);

  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<DirectMessage | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);

  // Advanced presence
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserActivity, setOtherUserActivity] = useState<OtherUserActivity>('offline');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Voice Message State
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) {
            router.push('/signup');
            return;
        }
        setCurrentUser(user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            setCurrentUserProfile(profile);
        }
    });
  }, [supabase, router]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    if (!conversationId || !currentUser || !otherUser) return;
    
    const realtimeChannel = supabase.channel(`chat-${conversationId}`, {
        config: {
            presence: {
                key: currentUser.id,
            },
        },
    });

    realtimeChannel
      .on<DirectMessage>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
           const newMessagePayload = payload.new as DirectMessage;
           
           if (messages.some(msg => msg.id === newMessagePayload.id)) {
               return;
           }
           
           if (newMessagePayload.sender_id === currentUser.id) {
               return;
           }

           const fullMessage: DirectMessage = {
               ...newMessagePayload,
               profiles: otherUser as Profile, // It's from the other user
               direct_message_reactions: [],
               is_seen_by_other: false,
           };
           
           setMessages((prevMessages) => [...prevMessages, fullMessage]);
        }
      )
      .on<DirectMessage>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conversationId}`},
        (payload) => {
            const updatedMessage = payload.new as DirectMessage;
            setMessages(prev => prev.map(msg => msg.id === updatedMessage.id ? { ...msg, content: updatedMessage.content, is_edited: updatedMessage.is_edited } : msg));
        }
      )
      .on( 'postgres_changes',
          { event: '*', schema: 'public', table: 'direct_message_reactions' },
          async (payload) => {
              if (payload.eventType === 'INSERT') {
                  const newReaction = payload.new as {id: string, message_id: string, user_id: string, emoji: string};
                   const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', newReaction.user_id).single();
                   if (error) return;

                   setMessages(prev => prev.map(msg => {
                       if (msg.id === newReaction.message_id) {
                           return { ...msg, direct_message_reactions: [...msg.direct_message_reactions, { ...newReaction, profiles: profile as Profile }] };
                       }
                       return msg;
                   }));
              } else if (payload.eventType === 'DELETE') {
                  const oldReaction = payload.old as {id: string, message_id: string};
                  setMessages(prev => prev.map(msg => {
                      if (msg.id === oldReaction.message_id) {
                          return { ...msg, direct_message_reactions: msg.direct_message_reactions.filter(r => r.id !== oldReaction.id) };
                      }
                      return msg;
                  }));
              }
          }
      )
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'direct_message_read_status', filter: `user_id=eq.${params.id}` },
          (payload) => {
            setMessages(prev => prev.map(msg => {
                if (msg.sender_id === currentUser.id && !msg.is_seen_by_other && new Date(msg.created_at) <= new Date(payload.new.read_at)) {
                    return { ...msg, is_seen_by_other: true };
                }
                return msg;
            }));
          }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${params.id}` },
        (payload) => {
          const newProfileData = payload.new as OtherUserWithPresence;
          setOtherUser(currentOtherUser => ({
            ...(currentOtherUser as OtherUserWithPresence),
            last_seen: newProfileData.last_seen,
            show_active_status: newProfileData.show_active_status,
            active_conversation_id: newProfileData.active_conversation_id,
          }));
        }
      )
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'blocks' },
          (payload) => {
              if (currentUser && otherUser) {
                  if(payload.new.blocker_id === currentUser.id && payload.new.blocked_id === otherUser.id) setIsBlocked(true);
                  if(payload.new.blocker_id === otherUser.id && payload.new.blocked_id === currentUser.id) setIsBlockedBy(true);
                  if(payload.eventType === "DELETE") {
                    if(payload.old.blocker_id === currentUser.id && payload.old.blocked_id === otherUser.id) setIsBlocked(false);
                    if(payload.old.blocker_id === otherUser.id && payload.old.blocked_id === currentUser.id) setIsBlockedBy(false);
                  }
              }
          }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = realtimeChannel.presenceState();
        const otherUserPresence = Object.keys(presenceState).some(key => key === otherUser?.id);
        if (otherUserPresence && presenceState[otherUser.id as string]) {
            // @ts-ignore
            const isTyping = presenceState[otherUser.id as string][0]?.is_typing || false;
            setOtherUserActivity(isTyping ? 'typing' : 'online');
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === otherUser?.id) setOtherUserActivity('online');
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key === otherUser?.id) setOtherUserActivity('offline');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await realtimeChannel.track({ is_typing: isTyping });
          await supabase.from('profiles').update({ active_conversation_id: conversationId }).eq('id', currentUser.id);
        }
      });
    
    return () => {
      supabase.removeChannel(realtimeChannel);
      // When leaving the chat, clear the active conversation
      if(currentUser) {
        supabase.from('profiles').update({ active_conversation_id: null }).eq('id', currentUser.id).then();
      }
    };
  }, [conversationId, supabase, currentUser, params.id, otherUser, isTyping, currentUserProfile, messages]);


  // Effect for determining the final displayed status string
  useEffect(() => {
    if (!otherUser) return;
    
    const twoMinutesAgo = subMinutes(new Date(), 2);
    const isOtherUserOnline = otherUser.show_active_status && otherUser.last_seen && isBefore(twoMinutesAgo, new Date(otherUser.last_seen));

    if (isOtherUserOnline) {
        if (otherUserActivity === 'typing') {
             // 'typing' has highest priority
        } else if (otherUser.active_conversation_id && otherUser.active_conversation_id !== conversationId) {
            setOtherUserActivity('busy');
        } else {
            setOtherUserActivity('online');
        }
    } else {
        setOtherUserActivity('offline');
    }
  }, [otherUser, otherUserActivity, conversationId]);


  const handleReply = (message: any) => {
    setReplyingTo(message);
    setEditingMessage(null);
  };
  
  const handleDelete = async (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    const { error } = await supabase.from('direct_messages').delete().eq('id', messageId);
    if (error) {
        toast({ variant: 'destructive', title: "Failed to delete message."});
    }
  };

  const handleEdit = (message: DirectMessage) => {
      if (message.content) {
        setEditingMessage(message);
        setNewMessage(message.content);
        setReplyingTo(null);
      }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
      } else {
        toast({variant: "destructive", title: "Unsupported File Type"});
        handleRemoveMedia();
      }
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setRecordingStatus('idle');
  };

  const handleCancelEdit = () => {
      setEditingMessage(null);
      setNewMessage("");
  };

  const handleUpdateMessage = async () => {
    if (!editingMessage || !newMessage.trim() || !currentUser) return;
    setSending(true);

    const contentToSave = newMessage.trim();

    // Optimistic UI update
    setMessages(prev => prev.map(msg => msg.id === editingMessage.id ? { ...msg, content: contentToSave, is_edited: true } : msg));
    setNewMessage("");
    setEditingMessage(null);
    setSending(false);


    const { error } = await supabase
        .from('direct_messages')
        .update({ content: contentToSave, is_edited: true })
        .eq('id', editingMessage.id);

    if (error) {
        toast({ variant: 'destructive', title: 'Failed to update message', description: error.message });
        // Revert optimistic update
        setMessages(prev => prev.map(msg => msg.id === editingMessage.id ? { ...editingMessage } : msg));
    }
  };
  
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (editingMessage) {
        await handleUpdateMessage();
        return;
    }

    if ((!newMessage.trim() && !mediaFile) || !currentUser || !conversationId) return;
    
    setSending(true);
    
    // --- Optimistic UI Update ---
    const tempId = `temp_${Date.now()}`;
    const tempMessage: DirectMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: newMessage.trim() || null,
      media_url: mediaFile ? URL.createObjectURL(mediaFile) : null,
      media_type: mediaFile ? mediaFile.type.split('/')[0] : null,
      created_at: new Date().toISOString(),
      profiles: currentUserProfile || { id: currentUser.id, username: currentUser.email || 'You' } as Profile,
      parent_message_id: replyingTo?.id || null,
      parent_message: replyingTo ? { content: replyingTo.content, media_type: replyingTo.media_type, profiles: { full_name: replyingTo.profiles.full_name } } : undefined,
      direct_message_reactions: [],
      is_seen_by_other: false,
      is_shared_post: false,
    };
    setMessages(prev => [...prev, tempMessage]);
    
    setNewMessage("");
    setReplyingTo(null);
    const tempMediaFile = mediaFile;
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // --- End Optimistic UI Update ---


    let publicMediaUrl = null;
    let mediaType = null;
    
    if (tempMediaFile) {
        const fileExtension = tempMediaFile.name.split('.').pop();
        const fileName = `${currentUser.id}-${Date.now()}.${fileExtension}`;
        const filePath = `public/${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('direct-messages-media').upload(filePath, tempMediaFile);
        if (uploadError) {
            toast({ variant: "destructive", title: "Media upload failed", description: uploadError.message });
            setMessages(prev => prev.filter(m => m.id !== tempId)); // Remove optimistic message on fail
            setSending(false);
            return;
        }
        const { data: { publicUrl } } = supabase.storage.from('direct-messages-media').getPublicUrl(filePath);
        publicMediaUrl = publicUrl;
        mediaType = tempMediaFile.type.split('/')[0];
    }

    const { error: insertError } = await supabase.from('direct_messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: tempMessage.content,
        media_url: publicMediaUrl,
        media_type: mediaType,
        parent_message_id: replyingTo?.id || null,
    }).select().single();
    
    if (insertError) {
        toast({ variant: "destructive", title: "Failed to send message", description: insertError.message });
        setMessages(prev => prev.filter(m => m.id !== tempId)); // Remove optimistic message on fail
    }

    setSending(false);
    setShowEmojiPicker(false);
  }
  
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const existingReaction = msg.direct_message_reactions.find(r => r.user_id === currentUser.id && r.emoji === emoji);

    if (existingReaction) {
        setMessages(prev => prev.map(m => 
            m.id === messageId 
                ? { ...m, direct_message_reactions: m.direct_message_reactions.filter(r => r.id !== existingReaction.id) } 
                : m
        ));
        await supabase.from('direct_message_reactions').delete().eq('id', existingReaction.id);
    } else {
        const tempId = `temp_${Date.now()}`;
        const newReaction = {
            id: tempId,
            message_id: messageId,
            user_id: currentUser.id,
            emoji: emoji,
            profiles: { id: currentUser.id, username: currentUser.user_metadata.user_name, avatar_url: currentUser.user_metadata.avatar_url, full_name: currentUser.user_metadata.full_name }
        };
        setMessages(prev => prev.map(m => 
            m.id === messageId 
                ? { ...m, direct_message_reactions: [...m.direct_message_reactions, newReaction as Reaction] } 
                : m
        ));
        await supabase.from('direct_message_reactions').insert({ message_id: messageId, user_id: currentUser.id, emoji: emoji });
    }
  }

  const handleSendSticker = async (stickerUrl: string) => {
    if (!currentUser || !conversationId) return;
    setShowEmojiPicker(false);
    
    const tempId = `temp_${Date.now()}`;
    const tempMessage: DirectMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: null,
      media_url: stickerUrl,
      media_type: 'sticker',
      created_at: new Date().toISOString(),
      profiles: currentUserProfile || { id: currentUser.id, username: currentUser.email || 'You' } as Profile,
      parent_message_id: null,
      direct_message_reactions: [],
      is_seen_by_other: false,
      is_shared_post: false,
    };
    setMessages(prev => [...prev, tempMessage]);


    const { error } = await supabase.from('direct_messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        media_url: stickerUrl,
        media_type: 'sticker'
    });
    
    if (error) {
        toast({ variant: "destructive", title: "Failed to send sticker" });
        setMessages(prev => prev.filter(m => m.id !== tempId));
    }
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
        
        setMediaFile(audioFile);
        setMediaPreview(URL.createObjectURL(audioFile));
        setRecordingStatus('preview');
        
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      mediaRecorderRef.current.start();
      setRecordingStatus('recording');
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) {
      console.error('Mic access error:', error)
      toast({ variant: "destructive", title: "Microphone Access Denied" });
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }
  
  const cancelRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
        mediaRecorderRef.current.stop(); // Stop recording without processing
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
    setRecordingStatus('idle');
    setMediaFile(null);
    setMediaPreview(null);
  };


  const handleMicClick = () => {
    if (recordingStatus === 'idle') {
        startRecording();
    } else if (recordingStatus === 'recording') {
        stopRecording();
    }
  };

  const formatRecordingTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
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

      const { error } = await supabase.rpc('delete_conversation', { p_conversation_id: conversationId });

      if (error) {
          toast({ variant: 'destructive', title: 'Failed to delete chat', description: error.message });
      } else {
          toast({ title: 'Chat deleted permanently' });
          router.push('/chat');
          router.refresh();
      }
  };

  const handleTyping = () => {
    const channel = supabase.channel(`chat-${conversationId}`);
    if (!isTyping) {
        setIsTyping(true);
        channel.track({ is_typing: true });
    }
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        channel.track({ is_typing: false });
    }, 2000); // 2 seconds timeout
  };


  if (error) {
      return (
        <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    <p>Could not load the chat data. Here's the specific error:</p>
                    <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs font-mono">{error}</pre>
                    <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  if (!otherUser) {
      return <div className="flex h-dvh w-full items-center justify-center"><p>User not found.</p></div>
  }

  const isChatDisabled = isBlocked || isBlockedBy;
  
  const getStatusText = () => {
    switch (otherUserActivity) {
      case 'typing':
        return <p className="text-xs text-green-500 animate-pulse">typing...</p>;
      case 'busy':
         return <p className="text-xs text-yellow-500">Busy with another</p>;
      case 'online':
        return <p className="text-xs text-green-500">Online</p>;
      case 'offline':
        return otherUser.show_active_status && otherUser.last_seen 
            ? <p className="text-xs text-muted-foreground">Active {formatDistanceToNow(new Date(otherUser.last_seen), { addSuffix: true })}</p>
            : null;
      default:
        return null;
    }
  };


  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
            <Link href="/chat">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <Link href={`/profile/${otherUser.id}`} className="relative">
                <Avatar className="h-10 w-10" profile={otherUser}>
                </Avatar>
                <PresenceIndicator user={otherUser} />
            </Link>
            <div>
                <p className={cn("font-bold", otherUser.is_verified && "text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md px-2 py-1")}>{otherUser.full_name}</p>
                {getStatusText()}
            </div>
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-destructive" onClick={handleBlockUser} disabled={isBlocked}>
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
                        <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isSender={msg.sender_id === currentUser?.id} onReply={handleReply} onDelete={handleDelete} onEdit={handleEdit} onReaction={handleReaction} currentUser={currentUser}/>
        ))}
        <div ref={messagesEndRef} />
      </main>

       <footer className="sticky bottom-0 bg-background border-t">
        {isChatDisabled && (
            <div className="bg-muted p-3 text-center text-sm text-muted-foreground">
                {isBlocked ? `You have blocked this user. You cannot send messages.` : `You cannot reply to this conversation.`}
            </div>
        )}
        <div className="p-2">
            {editingMessage ? (
                 <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Pencil className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">Editing message</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : replyingTo && (
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
             {mediaPreview && mediaFile?.type.startsWith('image') && (
                <div className="p-2 relative">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                        <Image src={mediaPreview} alt="Media preview" layout="fill" objectFit="cover" />
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
                 { recordingStatus === 'recording' ? (
                    <div className="flex-1 flex items-center bg-muted h-10 rounded-lg px-3 gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={cancelRecording}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <p className="text-sm font-mono text-red-500">{formatRecordingTime(recordingTime)}</p>
                    </div>
                ) : recordingStatus === 'preview' && mediaPreview ? (
                     <div className="flex-1 flex items-center bg-muted h-10 rounded-lg px-3 gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={cancelRecording}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                        <audio src={mediaPreview} controls className="w-full h-8" />
                    </div>
                ) : (
                    <>
                        {!editingMessage && (
                            <>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    accept="image/*,video/*"
                                    disabled={isChatDisabled}
                                />
                                <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} disabled={isChatDisabled}><ImageIcon className="h-5 w-5 text-muted-foreground" /></Button>
                                <Button variant="ghost" size="icon" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} disabled={isChatDisabled}>
                                    <Smile className={cn("h-5 w-5 text-muted-foreground", showEmojiPicker && "text-primary")} />
                                </Button>
                            </>
                        )}
                        <Input 
                          placeholder={editingMessage ? "Edit your message..." : "Type a message..."} 
                          className="flex-1"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onFocus={() => setShowEmojiPicker(false)}
                          disabled={isChatDisabled}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                            if (!editingMessage) {
                                handleTyping();
                            }
                          }}
                        />
                    </>
                )}
                
                {recordingStatus !== 'preview' && !editingMessage && (
                     <Button variant="ghost" size="icon" type="button" onClick={handleMicClick} disabled={isChatDisabled}>
                        {recordingStatus === 'recording' ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
                    </Button>
                )}

                <Button size="icon" type="submit" disabled={(!newMessage.trim() && !mediaFile && !editingMessage) || sending || isChatDisabled}>
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : editingMessage ? <Check className="h-5 w-5" /> : <Send className="h-5 w-5" />}
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

    