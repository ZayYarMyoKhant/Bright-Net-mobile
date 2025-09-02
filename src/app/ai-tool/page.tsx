
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Bot } from "lucide-react";

export default function AiToolPage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 text-center">
          <h1 className="text-xl font-bold">AI Tool</h1>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Bot className="h-24 w-24 text-muted-foreground/30 mb-6" />
          <h2 className="text-2xl font-bold tracking-tight">Coming Soon!</h2>
          <p className="text-muted-foreground mt-2">
            Exciting new AI features are under construction.
          </p>
           <p className="text-muted-foreground">
            We're working hard to bring you the best experience.
          </p>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
