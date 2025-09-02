
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Search, Languages, Swords } from "lucide-react";
import Link from "next/link";

const tools = [
    {
        title: "Problem Solver",
        description: "Bright-AI",
        icon: <Bot className="h-8 w-8 text-primary" />,
        href: "/ai-tool/problem-solver",
        cta: "Start"
    },
    {
        title: "Translator",
        description: "Bright-AI",
        icon: <Languages className="h-8 w-8 text-primary" />,
        href: "/ai-tool/translator",
        cta: "Start"
    },
    {
        title: "Typing Battle",
        description: "Let's start",
        icon: <Swords className="h-8 w-8 text-primary" />,
        href: "/ai-tool/typing-battle",
        cta: "Let's Start"
    }
]

export default function AiToolPage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 text-center">
          <h1 className="text-xl font-bold">Let's bright with Bright-AI</h1>
        </header>
        
        <div className="p-4 border-b">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-10" />
            </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {tools.map((tool) => (
            <Card key={tool.title}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        {tool.icon}
                        <div>
                            <CardTitle>{tool.title}</CardTitle>
                            <CardDescription>{tool.description}</CardDescription>
                        </div>
                    </div>
                    <Link href={tool.href}>
                        <Button>{tool.cta}</Button>
                    </Link>
                </CardHeader>
            </Card>
          ))}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
