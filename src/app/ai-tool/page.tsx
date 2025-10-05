
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Languages, Swords, Send, User, Loader2, BrainCircuit, Mic, Image as ImageIcon, Sparkles, AlignLeft, CircleDashed } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { brightNetBot } from "@/ai/flows/bright-net-bot-flow";
import { AdBanner } from "@/components/ad-banner";

type Message = {
    role: 'user' | 'assistant';
    content: string;
}

export default function AiToolPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "What can I help with?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        const currentInput = input;
        setInput("");
        setIsLoading(true);

        try {
            const result = await brightNetBot(currentInput);
            setMessages(prev => [...prev, { role: 'assistant', content: result }]);
        } catch (error) {
            console.error("AI chat failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "An Error Occurred", description: errorMessage });
             setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an issue. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
                <Link href="/ai-tool/translator" legacyBehavior>
                    <Button variant="ghost" size="icon">
                        <AlignLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold">Bright-Net AI</h1>
                    <Button variant="link" className="h-auto p-0 text-xs text-primary">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Get Plus
                    </Button>
                </div>
                <Link href="/ai-tool/typing-battle" legacyBehavior>
                    <Button variant="ghost" size="icon">
                        <CircleDashed className="h-6 w-6" />
                    </Button>
                </Link>
            </header>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <main className="p-4 flex flex-col gap-4">
                    <div className="pt-4">
                        <AdBanner />
                    </div>
                    {messages.map((msg, index) => (
                        msg.role === 'assistant' ? (
                             <Card key={index} className="bg-transparent border-0 shadow-none">
                                <CardContent className="p-0">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8 border-2 border-primary">
                                            <AvatarFallback>
                                                <BrainCircuit className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="bg-muted rounded-lg p-3">
                                            <p className="font-semibold text-primary">Bright-Net AI</p>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                             <div key={index} className="flex items-start gap-3 justify-end">
                                <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-sm">
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                                <Avatar className="h-8 w-8">
                                   <AvatarFallback>
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        )
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3">
                             <Avatar className="h-8 w-8 border-2 border-primary">
                                <AvatarFallback>
                                    <BrainCircuit className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">AI is thinking...</p>
                            </div>
                        </div>
                    )}
                </main>
            </ScrollArea>

             <footer className="flex-shrink-0 border-t p-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                    <Button variant="ghost" size="icon">
                        <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Input 
                        placeholder="Ask me anything..." 
                        className="flex-1 rounded-full bg-muted focus-visible:ring-1 focus-visible:ring-primary"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button variant="ghost" size="icon">
                        <Mic className="h-5 w-5" />
                    </Button>
                </form>
            </footer>
        </div>
    );
}
