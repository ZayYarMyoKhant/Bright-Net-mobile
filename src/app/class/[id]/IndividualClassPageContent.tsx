
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Users, Send, BookOpenText, MoreVertical, Trash2, Mic, ImagePlus, Smile, X, StopCircle, CheckCheck, UserPlus, Checkbox } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Profile } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EmojiPicker } from "@/components/emoji-picker";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";


type ClassData = {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    student_count: number;
    creator_id: string;
};

type ClassMessage = {
    id: string;
    content: string | null;
    media_url: string | null;
    media_type: 'image' | 'video' | 'audio' | 'sticker' | null;
    created_at: string;
    user_id: string;
    profiles: Profile;
    read_by_count: number;
}

type InitialClassData = {
    classData: ClassData | null;
    isEnrolled: boolean;
    messages: ClassMessage[];
    error: string | null;
}

type RecordingStatus = 'idle' | 'recording' | 'preview';


const ChatMessage = ({ message, isSender, totalMembers }: { message: ClassMessage, isSender: boolean, totalMembers: number }) => {
    const msgRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user }}) => {
            setCurrentUser(user);
        });
    }, [supabase]);


    useEffect(() => {
        if (!currentUser || isSender) return;

        const observer = new IntersectionObserver(
            async ([entry]) => {
                if (entry.isIntersecting) {
                    observer.disconnect(); // Disconnect to prevent multiple triggers
                    
                    await supabase.from('class_message_read_status').insert({
                        message_id: message.id,
                        user_id: currentUser.id
                    }, { onConflict: 'message_id, user_id' });
                }
            },
            { threshold: 0.5 }
        );

        if (msgRef.current) {
            observer.observe(msgRef.current);
        }

        return () => {
            if (msgRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                observer.unobserve(msgRef.current);
            }
        };
    }, [isSender, message.id, supabase, currentUser]);

    const renderMedia = () => {
        if (message.media_type === 'image' && message.media_url) {
            return (
                <div className="relative rounded-lg overflow-hidden w-48 h-48">
                    <Image src={message.media_url} alt="sent image" layout="fill" objectFit="cover" data-ai-hint="photo message" />
                </div>
            );
        }
        if (message.media_type === 'video' && message.media_url) {
            return <video src={message.media_url} controls className="rounded-lg w-48 h-auto" />;
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
        <div ref={msgRef} className={cn("flex items-start gap-3", isSender ? "justify-end" : "justify-start")}>
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
                        {!isSender && <p className="text-xs font-semibold mb-1">{message.profiles.full_name}</p>}
                        
                        {renderMedia()}
                        {message.content && <p className={cn("text-sm break-words", message.media_url && 'pt-2')}>{message.content}</p>}
                    </div>
                </div>

                 <div className={cn("text-xs text-muted-foreground mt-1 flex items-center gap-1.5", isSender ? "justify-end" : "justify-start")}>
                    <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                     {isSender && message.read_by_count > 0 && (
                        <div className="flex items-center gap-0.5" title={`Seen by ${message.read_by_count} members`}>
                            <CheckCheck className="h-4 w-4 text-blue-500" />
                            <span className="text-xs">{Math.min(message.read_by_count, totalMembers-1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AddMemberSheet = ({ classId, currentUser }: { classId: string, currentUser: User | null }) => {
    const [following, setFollowing] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [adding, setAdding] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        const fetchFollowing = async () => {
            if (!currentUser) return;
            setLoading(true);

            // Fetch following
            const { data: followingData, error: followingError } = await supabase
                .from('followers')
                .select('profiles!followers_user_id_fkey(*)')
                .eq('follower_id', currentUser.id);

            if (followingError) {
                toast({ variant: 'destructive', title: 'Error fetching following list' });
                setLoading(false);
                return;
            }
            
            const followedProfiles = followingData.map((f: any) => f.profiles);

            // Fetch existing members to filter them out
            const { data: membersData, error: membersError } = await supabase
                .from('class_members')
                .select('user_id')
                .eq('class_id', classId);
            
            if (membersError) {
                toast({ variant: 'destructive', title: 'Error fetching class members' });
                setFollowing(followedProfiles);
                setLoading(false);
                return;
            }

            const memberIds = new Set(membersData.map(m => m.user_id));
            const nonMemberFollowing = followedProfiles.filter(p => !memberIds.has(p.id));

            setFollowing(nonMemberFollowing);
            setLoading(false);
        };

        fetchFollowing();
    }, [classId, currentUser, supabase, toast]);

    const handleSelectMember = (id: string) => {
        setSelectedMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
    };

    const handleAddMembers = async () => {
        if (selectedMembers.length === 0) return;
        setAdding(true);

        const membersToAdd = selectedMembers.map(userId => ({
            class_id: classId,
            user_id: userId
        }));

        const { error } = await supabase.from('class_members').insert(membersToAdd);
        setAdding(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to add members', description: error.message });
        } else {
            toast({ title: 'Members added!', description: `${selectedMembers.length} new members have been added to the class.` });
            setSelectedMembers([]);
            // Optionally, we can close the sheet here. A simple way:
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
    };

    return (
        <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
                <SheetTitle>Add Members to Class</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex justify-center items-center h-full pt-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : following.length === 0 ? (
                    <div className="text-center p-10 text-muted-foreground flex flex-col items-center">
                        <Users className="h-12 w-12 mb-4" />
                        <p className="font-bold">No one to add</p>
                        <p className="text-sm mt-1">All your friends are already in this class, or you're not following anyone.</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {following.map(user => (
                            <div key={user.id} className="flex items-center gap-4">
                                <Avatar profile={user} className="h-10 w-10" />
                                <div className="flex-1">
                                    <p className="font-semibold">{user.full_name}</p>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                                <Checkbox 
                                    checked={selectedMembers.includes(user.id)}
                                    onCheckedChange={() => handleSelectMember(user.id)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
            <footer className="p-4 border-t">
                <Button className="w-full" disabled={selectedMembers.length === 0 || adding} onClick={handleAddMembers}>
                    {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Add {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''} Members
                </Button>
            </footer>
        </div>
    );
};


export default function IndividualClassPageContent({ initialData }: { initialData: InitialClassData }) {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [classData, setClassData] = useState<ClassData | null>(initialData.classData);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(initialData.isEnrolled);
    const [error, setError] = useState<string | null>(initialData.error);
    const [messages, setMessages] = useState<ClassMessage[]>(initialData.messages);
    
    // Chat Input State
    const [newMessage, setNewMessage] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [sending, setSending] = useState(false);
    
    // Voice Message State
    const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isCreator = classData?.creator_id === currentUser?.id;


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/signup');
            } else {
                setCurrentUser(user);
            }
        };
        fetchUser();
    }, [supabase, router]);

    // Realtime listener for new messages
    useEffect(() => {
        if (!isEnrolled || !classData) return;

        const channel = supabase.channel(`class-chat-${classData.id}`)
            .on<ClassMessage>(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'class_messages',
                    filter: `class_id=eq.${classData.id}`
                },
                async (payload) => {
                     const { data: fullMessage, error } = await supabase
                        .from('class_messages')
                        .select('*, profiles:user_id(*), read_by:class_message_read_status(count)')
                        .eq('id', payload.new.id)
                        .single();

                    if (!error && fullMessage && !messages.some(m => m.id === fullMessage.id)) {
                        const newMsg = { ...fullMessage, read_by_count: fullMessage.read_by[0]?.count || 0 } as ClassMessage;
                        setMessages((prevMessages) => [...prevMessages, newMsg]);
                    }
                }
            )
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'class_message_read_status'
            }, async (payload) => {
                const messageId = payload.new.message_id;
                setMessages(prev => prev.map(msg => {
                    if (msg.id === messageId) {
                        return { ...msg, read_by_count: msg.read_by_count + 1 };
                    }
                    return msg;
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [isEnrolled, classData, supabase, messages]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
                setMediaFile(file);
                setMediaPreview(URL.createObjectURL(file));
                setRecordingStatus('preview');
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
    
    const handleSendMessage = async (e?: React.FormEvent, stickerUrl?: string) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !mediaFile && !stickerUrl) || !currentUser || !classData) return;
        
        setSending(true);
        setShowEmojiPicker(false);

        let publicMediaUrl = stickerUrl || null;
        let mediaType: ClassMessage['media_type'] = stickerUrl ? 'sticker' : null;

        if (mediaFile) {
            const fileExtension = mediaFile.name.split('.').pop();
            const fileName = `class-${classData.id}-${currentUser.id}-${Date.now()}.${fileExtension}`;
            const filePath = `public/${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from('direct-messages-media').upload(filePath, mediaFile);
            if (uploadError) {
                toast({ variant: "destructive", title: "Media upload failed", description: uploadError.message });
                setSending(false);
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('direct-messages-media').getPublicUrl(filePath);
            publicMediaUrl = publicUrl;
            mediaType = mediaFile.type.split('/')[0] as 'image' | 'video' | 'audio';
        }

        const { error: insertError } = await supabase.from('class_messages').insert({
            class_id: classData.id,
            user_id: currentUser.id,
            content: newMessage || null,
            media_url: publicMediaUrl,
            media_type: mediaType,
        });
        
        setNewMessage("");
        handleRemoveMedia();
        setSending(false);
        
        if (insertError) {
            toast({ variant: "destructive", title: "Failed to send message", description: insertError.message });
        }
    }
    
    const handleLeaveClass = async () => {
        if (!currentUser || !classData) return;

        const { error } = await supabase
            .from('class_members')
            .delete()
            .match({ class_id: classData.id, user_id: currentUser.id });

        if (error) {
            toast({ variant: "destructive", title: "Failed to leave class", description: error.message });
        } else {
            toast({ title: "You have left the class." });
            router.push('/class');
            router.refresh();
        }
    };
    
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
            toast({ variant: "destructive", title: "Microphone Access Denied"});
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

    if (error) {
         return (
            <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
                 <Alert variant="destructive" className="max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error loading class</AlertTitle>
                    <AlertDescription>
                        <p>{error}</p>
                        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!classData) {
        return (
             <div className="flex h-dvh w-full items-center justify-center text-center">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
        )
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="text-center">
                    <h1 className="font-bold text-lg truncate px-2">{classData.name}</h1>
                    {isEnrolled && <p className="text-xs text-muted-foreground">{classData.student_count} members</p>}
                </div>
                {isEnrolled ? (
                    <div className="flex items-center">
                        {isCreator && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                                        <UserPlus className="h-4 w-4" />
                                        <span className="text-xs hidden sm:inline">Add Member</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="p-0">
                                    <AddMemberSheet classId={classData.id} currentUser={currentUser} />
                                </SheetContent>
                            </Sheet>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Leave Class</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will remove you from the class. You can rejoin later from the search page.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleLeaveClass} className="bg-destructive hover:bg-destructive/80">Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : <div className="w-10"></div>}
            </header>

            {isEnrolled ? (
                <>
                    <main className="flex-1 overflow-y-auto p-4 space-y-6">
                        {messages.length === 0 ? (
                             <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
                                <BookOpenText className="h-12 w-12" />
                                <p className="mt-4 font-semibold">Welcome to the class!</p>
                                <p className="text-sm">Be the first to send a message.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <ChatMessage key={msg.id} message={msg} isSender={msg.user_id === currentUser?.id} totalMembers={classData.student_count} />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </main>
                    <footer className="sticky bottom-0 bg-background border-t">
                        <div className="p-2">
                             {mediaPreview && (mediaFile?.type.startsWith('image') || mediaFile?.type.startsWith('video')) && (
                                <div className="p-2 relative">
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                                        {mediaFile?.type.startsWith('image/') ? (
                                            <Image src={mediaPreview} alt="Media preview" layout="fill" objectFit="cover" />
                                        ) : mediaFile?.type.startsWith('video/') ? (
                                            <video src={mediaPreview} className="w-full h-full object-cover" />
                                        ) : null}
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
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" disabled={sending} />
                                        <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} disabled={sending}><ImagePlus className="h-5 w-5 text-muted-foreground" /></Button>
                                        <Button variant="ghost" size="icon" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} disabled={sending}>
                                            <Smile className={cn("h-5 w-5 text-muted-foreground", showEmojiPicker && "text-primary")} />
                                        </Button>
                                        <Input 
                                        placeholder="Type a message..." 
                                        className="flex-1"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onFocus={() => setShowEmojiPicker(false)}
                                        disabled={sending}
                                        />
                                    </>
                                )}

                                {recordingStatus !== 'preview' && (
                                    <Button variant="ghost" size="icon" type="button" onClick={handleMicClick} disabled={sending}>
                                        {recordingStatus === 'recording' ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
                                    </Button>
                                )}
                                <Button size="icon" type="submit" disabled={(!newMessage.trim() && !mediaFile) || sending}>
                                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                </Button>
                            </form>
                        </div>
                        {showEmojiPicker && (
                            <EmojiPicker 
                                onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)}
                                onStickerSelect={(stickerUrl) => handleSendMessage(undefined, stickerUrl)}
                            />
                        )}
                    </footer>
                </>
            ) : (
                <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center">
                    <Avatar className="h-28 w-28" src={classData.avatar_url} alt={classData.name} />
                    <h2 className="text-2xl font-bold mt-4">{classData.name}</h2>
                    <p className="text-muted-foreground max-w-md mt-2">{classData.description}</p>
                    <div className="flex items-center gap-2 text-muted-foreground mt-4">
                        <Users className="h-5 w-5" />
                        <span>{classData.student_count} members</span>
                    </div>
                    
                    <div className="mt-8 text-center p-4 border rounded-lg bg-muted/50">
                        <p className="font-semibold">You are not a member of this class.</p>
                        <p className="text-sm text-muted-foreground mt-1">Please join from the search page to participate.</p>
                         <Button onClick={() => router.push('/search?tab=classes')} className="mt-4">Go to Search</Button>
                    </div>
                </main>
            )}
        </div>
    );
}

    
