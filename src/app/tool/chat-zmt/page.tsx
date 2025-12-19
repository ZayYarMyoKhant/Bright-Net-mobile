
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, ClipboardCopy, Bot } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Message = {
    id: number;
    sender: 'user' | 'ai';
    text: string;
    isThinking?: boolean;
}

export default function ChatZMTPage() {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: 'ai', text: "Hello and a warm welcome from ZMT Think AI!\nHow can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Scroll to bottom when new messages are added or text streams
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);
    
    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
            }
        };
    }, []);

    const handleCopy = (text: string) => {
        if (isLoading) return; // Don't copy while streaming
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied to clipboard" });
        }).catch(err => {
            console.error('Could not copy text: ', err);
            toast({ variant: "destructive", title: "Copy Failed" });
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
        }

        const newUserMessage: Message = { id: Date.now(), sender: 'user', text: input };
        const thinkingMessage: Message = { id: Date.now() + 1, sender: 'ai', text: "🤔 Thinking...", isThinking: true };

        setMessages(prev => [...prev, newUserMessage, thinkingMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`https://zmt.moemintun2381956.workers.dev/?prompt=${encodeURIComponent(currentInput)}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            const aiResponseText = data.text || "Sorry, I couldn't get a response.";

            // Start streaming the response
            setMessages(prev => prev.slice(0, -1)); // Remove "Thinking..." message
            const newAiMessageId = Date.now() + 2;
            setMessages(prev => [...prev, { id: newAiMessageId, sender: 'ai', text: '' }]);
            
            let charIndex = 0;
            streamingIntervalRef.current = setInterval(() => {
                if (charIndex < aiResponseText.length) {
                    setMessages(prev => prev.map(msg => 
                        msg.id === newAiMessageId 
                            ? { ...msg, text: aiResponseText.substring(0, charIndex + 1) }
                            : msg
                    ));
                    charIndex++;
                } else {
                    if (streamingIntervalRef.current) {
                        clearInterval(streamingIntervalRef.current);
                    }
                    setIsLoading(false);
                }
            }, 50); // Adjust typing speed here (milliseconds per character)

        } catch (error) {
            console.error("AI chat error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            const errorAiMessage: Message = { id: Date.now() + 2, sender: 'ai', text: "Sorry, I'm having trouble connecting. Please try again later." };
            
            setMessages(prev => prev.slice(0, -1).concat(errorAiMessage)); // Replace "Thinking..." with error
            
            toast({
                variant: "destructive",
                title: "AI Chat Error",
                description: errorMessage,
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center justify-between bg-blue-600 text-white px-4">
                <Link href="/tool">
                    <Button variant="ghost" size="icon" className="hover:bg-white/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6"/>
                    <h1 className="text-xl font-bold">ZMT Think</h1>
                </div>
                <div className="w-10"></div>
            </header>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                 <TooltipProvider>
                    <div className="p-4 space-y-6">
                        {messages.map((msg, index) => (
                            <div key={msg.id} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.sender === 'ai' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/2522ae18-27b2-4a7b-a24c-59752b04c86b-1725595914619_sticker.webp" alt="AI Avatar" />
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                )}
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div 
                                            className={cn(
                                                "max-w-sm rounded-lg px-4 py-2",
                                                !isLoading && 'cursor-pointer',
                                                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                                                msg.isThinking && 'text-muted-foreground italic'
                                            )}
                                            onClick={() => handleCopy(msg.text)}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copy to clipboard</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ))}
                    </div>
                </TooltipProvider>
            </ScrollArea>
            
            <footer className="border-t p-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                        placeholder="Ask ZMT Think..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </footer>
        </div>
    );
}
