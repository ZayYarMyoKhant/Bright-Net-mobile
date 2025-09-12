
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BrainCircuit, Send, User } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProblemSolverPage() {

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

            <ScrollArea className="flex-1">
                <main className="p-4 flex flex-col gap-4">
                    <Card className="bg-blue-100/10 border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 border-2 border-primary">
                                    <AvatarFallback>
                                        <BrainCircuit className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-primary">AI Assistant</p>
                                    <p className="text-sm">
                                        Hello! I'm here to help. Describe the problem you're facing, and I'll provide a step-by-step solution. For example: "How do I fix a leaky faucet?"
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Example User Message */}
                    <div className="flex items-start gap-3 justify-end">
                        <div className="bg-muted rounded-lg p-3 max-w-sm">
                            <p className="font-semibold">You</p>
                            <p className="text-sm">How do I change a flat tire?</p>
                        </div>
                        <Avatar className="h-8 w-8">
                           <AvatarFallback>
                                <User className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                    </div>

                </main>
            </ScrollArea>

             <footer className="flex-shrink-0 border-t p-2">
                <div className="flex items-center gap-2 pt-1">
                    <Input placeholder="Describe your problem..." className="flex-1"/>
                    <Button size="icon">
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </footer>
        </div>
    );
}
