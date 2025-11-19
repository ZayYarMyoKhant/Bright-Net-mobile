
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Users, Send, BookOpenText } from "lucide-react";
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


type ClassData = {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    student_count: number;
};

type ClassMessage = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: Profile;
}

type InitialClassData = {
    classData: ClassData | null;
    isEnrolled: boolean;
    messages: ClassMessage[];
    error: string | null;
}

const ChatMessage = ({ message, isSender }: { message: ClassMessage, isSender: boolean }) => {
    return (
        <div className={cn("flex items-start gap-3", isSender ? "justify-end" : "justify-start")}>
            {!isSender && (
                <Link href={`/profile/${message.profiles.id}`}>
                    <Avatar className="h-8 w-8" profile={message.profiles} />
                </Link>
            )}
            <div className="group relative max-w-xs">
                <div className={cn("px-3 py-2 rounded-lg", isSender ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {!isSender && <p className="text-xs font-semibold mb-1">{message.profiles.full_name}</p>}
                    <p className="text-sm break-words">{message.content}</p>
                </div>
                <div className={cn("text-xs text-muted-foreground mt-1", isSender ? "text-right" : "text-left")}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </div>
            </div>
        </div>
    );
};


export default function IndividualClassPageContent({ initialData, params }: { initialData: InitialClassData, params: { id: string } }) {
    const classId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [classData, setClassData] = useState<ClassData | null>(initialData.classData);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(initialData.isEnrolled);
    const [error, setError] = useState<string | null>(initialData.error);
    const [messages, setMessages] = useState<ClassMessage[]>(initialData.messages);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);


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
        if (!isEnrolled) return;

        const channel = supabase.channel(`class-chat-${classId}`)
            .on<ClassMessage>(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'class_messages',
                    filter: `class_id=eq.${classId}`
                },
                async (payload) => {
                     const { data: fullMessage, error } = await supabase
                        .from('class_messages')
                        .select('*, profiles:user_id(*)')
                        .eq('id', payload.new.id)
                        .single();

                    if (!error && fullMessage) {
                        setMessages((prevMessages) => [...prevMessages, fullMessage as ClassMessage]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [isEnrolled, classId, supabase]);
    
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !currentUser || !classData) return;
        
        setSending(true);
        const { error } = await supabase.from('class_messages').insert({
            class_id: classData.id,
            user_id: currentUser.id,
            content: newMessage,
        });
        
        setNewMessage("");
        setSending(false);
        
        if (error) {
            toast({ variant: "destructive", title: "Failed to send message", description: error.message });
        }
    }


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
                <div className="w-10"></div>
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
                                <ChatMessage key={msg.id} message={msg} isSender={msg.user_id === currentUser?.id} />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </main>
                    <footer className="sticky bottom-0 bg-background border-t p-2">
                         <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                            <Input 
                              placeholder="Type a message..." 
                              className="flex-1"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              disabled={sending}
                            />
                            <Button size="icon" type="submit" disabled={!newMessage.trim() || sending}>
                                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </form>
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
                         <Button onClick={() => router.push('/search')} className="mt-4">Go to Search</Button>
                    </div>
                </main>
            )}
        </div>
    );
}

    