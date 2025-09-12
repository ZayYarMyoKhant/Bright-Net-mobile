
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BrainCircuit, Send, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { solveProblem } from "@/ai/flows/problem-solver-flow";

type Message = {
    role: 'user' | 'assistant';
    content: string;
}

export default function ProblemSolverPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I'm here to help. Describe the problem you're facing, and I'll provide a step-by-step solution. For example: \"How do I fix a leaky faucet?\""
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
        setInput("");
        setIsLoading(true);

        try {
            const result = await solveProblem(input);
            setMessages(prev => [...prev, { role: 'assistant', content: result }]);
        } catch (error) {
            console.error("Problem solving failed:", error);
            toast({ variant: "destructive", title: "An Error Occurred", description: "Could not get a solution. Please try again." });
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
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/ai-tool" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-3 mx-auto">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">AI Problem Solver</h1>
                </div>
            </header>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <main className="p-4 flex flex-col gap-4">
                    {messages.map((msg, index) => (
                        msg.role === 'assistant' ? (
                             <Card key={index} className="bg-blue-100/10 border-blue-500/20">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8 border-2 border-primary">
                                            <AvatarFallback>
                                                <BrainCircuit className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-primary">AI Assistant</p>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                             <div key={index} className="flex items-start gap-3 justify-end">
                                <div className="bg-muted rounded-lg p-3 max-w-sm">
                                    <p className="font-semibold">You</p>
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
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground">AI is thinking...</p>
                            </div>
                        </div>
                    )}
                </main>
            </ScrollArea>

             <footer className="flex-shrink-0 border-t p-2">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                    <Input 
                        placeholder="Describe your problem..." 
                        className="flex-1"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button size="icon" type="submit" disabled={!input.trim() || isLoading}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </footer>
        </div>
    );
}
