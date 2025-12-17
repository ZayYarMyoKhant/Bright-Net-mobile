
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Bot, ClipboardCopy } from 'lucide-react';
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
    sender: 'user' | 'ai';
    text: string;
}

export default function ChatZMTPage() {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I'm ZMT AI." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when new messages are added
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: "Copied to clipboard" });
        }).catch(err => {
            console.error('Could not copy text: ', err);
            toast({ variant: "destructive", title: "Copy Failed" });
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`https://zmt.moemintun2381956.workers.dev/?prompt=${encodeURIComponent(input)}`);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();
            
            const aiMessage: Message = { sender: 'ai', text: data.response || "Sorry, I couldn't get a response." };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("AI chat error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "AI Chat Error",
                description: errorMessage,
            });
            const errorAiMessage: Message = { sender: 'ai', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorAiMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center justify-between bg-blue-600 text-white px-4">
                <Link href="/chat">
                    <Button variant="ghost" size="icon" className="hover:bg-white/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">ZMT Thinking model</h1>
                <div className="w-10"></div>
            </header>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                 <TooltipProvider>
                    <div className="p-4 space-y-6">
                        {messages.map((msg, index) => (
                            <div key={index} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div 
                                            className={cn(
                                                "max-w-sm rounded-lg px-4 py-2 cursor-pointer",
                                                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                            )}
                                            onClick={() => handleCopy(msg.text)}
                                        >
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Copy to clipboard</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ))}
                        {loading && (
                             <div className="flex items-start gap-3 justify-start">
                                <div className="max-w-sm rounded-lg px-4 py-2 bg-muted flex items-center">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                </TooltipProvider>
            </ScrollArea>
            
            <footer className="border-t p-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                        placeholder="Type your message..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </footer>
        </div>
    );
}

    