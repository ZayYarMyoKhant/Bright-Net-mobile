
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Bot, User } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Message = {
    sender: 'user' | 'ai';
    text: string;
}

export default function ChatZMTPage() {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! I'm ZMT-Bright AI. How can I help you today?" }
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
                <Link href="/bliss-zone">
                    <Button variant="ghost" size="icon" className="hover:bg-white/20">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold">ZMT - Bright ai</h1>
                <div className="w-10"></div>
            </header>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-4 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                             {msg.sender === 'ai' && (
                                <Avatar className="bg-blue-500 text-white">
                                    <AvatarFallback><Bot /></AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn(
                                "max-w-sm rounded-lg px-4 py-2",
                                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && (
                                <Avatar className="bg-muted">
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {loading && (
                         <div className="flex items-start gap-3 justify-start">
                            <Avatar className="bg-blue-500 text-white">
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                            <div className="max-w-sm rounded-lg px-4 py-2 bg-muted flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
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
