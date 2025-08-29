
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, BrainCircuit, Languages, Search } from "lucide-react";

export default function AiToolPage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 text-center">
          <h1 className="text-xl font-bold">AI Tool</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Bright-AI is ready for you</h2>
            <p className="text-muted-foreground">How can I help you?</p>
          </div>

          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search" className="pl-10" />
          </div>
          
          <div className="relative flex flex-col items-center justify-center space-y-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Bot className="h-16 w-16 text-muted-foreground/30" />
            </div>
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                      <BrainCircuit className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                      <CardTitle>AI Problem Solver</CardTitle>
                      <p className="text-sm text-muted-foreground">Solves any problem</p>
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Button className="w-full">Start</Button>
              </CardFooter>
            </Card>
            
            <Card className="w-full">
              <CardHeader>
                 <div className="flex items-center gap-4">
                   <div className="bg-primary/10 p-3 rounded-full">
                      <Languages className="h-6 w-6 text-primary" />
                   </div>
                   <div>
                      <CardTitle>AI Translator</CardTitle>
                      <p className="text-sm text-muted-foreground">Any language</p>
                   </div>
                 </div>
              </CardHeader>
              <CardFooter>
                <Button className="w-full">Start</Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
