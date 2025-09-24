
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Languages, Swords, Keyboard } from "lucide-react";
import Link from "next/link";
import { AdBanner } from "@/components/ad-banner";


export default function AiToolPage() {

    const tools = [
        {
            title: "AI Problem Solver",
            href: "/ai-tool/problem-solver",
            icon: <BrainCircuit className="h-10 w-10 text-primary" />,
            bgColor: "bg-blue-100/20",
            description: "Get step-by-step solutions"
        },
        {
            title: "AI Translator",
            href: "/ai-tool/translator",
            icon: <Languages className="h-10 w-10 text-green-500" />,
            bgColor: "bg-green-100/20",
            description: "Translate text accurately"
        },
        {
            title: "Typing Battle",
            href: "/ai-tool/typing-battle",
            icon: (
                <div className="flex items-center gap-2">
                    <Swords className="h-10 w-10 text-red-500" />
                    <Keyboard className="h-10 w-10 text-gray-400" />
                </div>
            ),
            bgColor: "bg-red-100/20",
            description: "Test your typing speed against AI",
            fullWidth: true
        }
    ]

    return (
        <>
            <div className="flex h-full flex-col bg-background text-foreground pb-16">
                <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 text-center">
                    <h1 className="text-xl font-bold">Welcome to <span className="text-primary">Bright-Net AI</span></h1>
                </header>

                <main className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {tools.map(tool => (
                            <Link href={tool.href} key={tool.title} className={tool.fullWidth ? 'col-span-2' : ''}>
                                 <Card className={`w-full cursor-pointer hover:bg-muted/50 h-full flex flex-col ${tool.bgColor}`}>
                                     <CardContent className="p-6 flex-1 flex flex-col items-center justify-center text-center gap-4">
                                        {tool.icon}
                                        <div className="mt-2">
                                            <h2 className="font-semibold text-lg">{tool.title}</h2>
                                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                     <div className="mt-4">
                        <AdBanner />
                    </div>
                </main>
            </div>
            <BottomNav />
        </>
    );
}
