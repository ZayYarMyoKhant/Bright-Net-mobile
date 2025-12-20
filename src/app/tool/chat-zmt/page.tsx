
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Bot } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Message = {
    id: number;
    sender: 'user' | 'ai';
    type: 'text' | 'image';
    text?: string;
    imageUrl?: string;
    isLoading?: boolean;
}

export default function ChatZMTPage() {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: 'ai', type: 'text', text: "Hello and a warm welcome from ZMT Think AI!\nHow can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
            }
        };
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
        }

        const userMessage: Message = { id: Date.now(), sender: 'user', type: 'text', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        const imageKeywords = ["generate", "create", "draw", "picture", "image", "show me"];
        const isImageRequest = imageKeywords.some(keyword => currentInput.toLowerCase().includes(keyword));

        if (isImageRequest) {
            await handleImageGeneration(currentInput);
        } else {
            await handleTextGeneration(currentInput);
        }
    };

    const handleTextGeneration = async (prompt: string) => {
        const thinkingMessage: Message = { id: Date.now() + 1, sender: 'ai', type: 'text', text: "🤔 Thinking...", isLoading: true };
        setMessages(prev => [...prev, thinkingMessage]);

        try {
            const response = await fetch(`https://zmt.moemintun2381956.workers.dev/?prompt=${encodeURIComponent(prompt)}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            const aiResponseText = data.text || "Sorry, I couldn't get a response.";

            setMessages(prev => prev.slice(0, -1)); 
            const newAiMessageId = Date.now() + 2;
            setMessages(prev => [...prev, { id: newAiMessageId, sender: 'ai', type: 'text', text: '' }]);
            
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
            }, 50);

        } catch (error) {
            console.error("AI text generation error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            const errorAiMessage: Message = { id: Date.now() + 2, sender: 'ai', type: 'text', text: "Sorry, I'm having trouble connecting. Please try again later." };
            
            setMessages(prev => prev.slice(0, -1).concat(errorAiMessage));
            
            toast({
                variant: "destructive",
                title: "AI Chat Error",
                description: errorMessage,
            });
            setIsLoading(false);
        }
    };
    
    const handleImageGeneration = async (prompt: string) => {
        const generatingMessage: Message = { id: Date.now() + 1, sender: 'ai', type: 'text', text: "🎨 Generating image...", isLoading: true };
        setMessages(prev => [...prev, generatingMessage]);

        try {
            const response = await fetch(`https://ai.zmt51400.workers.dev/?prompt=${encodeURIComponent(prompt)}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            const imageUrl = data.result_url;

            if (!imageUrl || typeof imageUrl !== 'string') {
                 throw new Error('API response did not contain a valid image URL in the `result_url` field.');
            }
            
            const imageMessage: Message = { id: Date.now() + 2, sender: 'ai', type: 'image', imageUrl: imageUrl };
            setMessages(prev => prev.slice(0, -1).concat(imageMessage)); 

        } catch (error) {
            console.error("AI image generation error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            const errorAiMessage: Message = { id: Date.now() + 2, sender: 'ai', type: 'text', text: "Sorry, I couldn't create the image. Please try again." };
            
            setMessages(prev => prev.slice(0, -1).concat(errorAiMessage));
            
            toast({
                variant: "destructive",
                title: "Image Generation Failed",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleViewImage = (imageUrl: string) => {
        router.push(`/search/image/${encodeURIComponent(imageUrl)}`);
    }


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
                <div className="p-4 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.sender === 'ai' && (
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/2522ae18-27b2-4a7b-a24c-59752b04c86b-1725595914619_sticker.webp" alt="AI Avatar" />
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                            )}
                            <div 
                                className={cn(
                                    "max-w-sm rounded-lg",
                                    msg.type === 'text' && "px-4 py-2",
                                    msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                                    msg.isLoading && 'text-muted-foreground italic'
                                )}
                            >
                                {msg.type === 'text' && msg.text && (
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                )}
                                {msg.type === 'image' && msg.imageUrl && (
                                     <button onClick={() => handleViewImage(msg.imageUrl!)} className="relative w-64 h-64 rounded-lg overflow-hidden block">
                                        <Image src={msg.imageUrl} alt="Generated image" fill className="object-cover" />
                                     </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            
            <footer className="border-t p-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                        placeholder="Ask ZMT Think or describe an image to create..." 
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
