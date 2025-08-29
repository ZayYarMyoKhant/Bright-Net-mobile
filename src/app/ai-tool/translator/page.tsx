
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AiTranslatorPage() {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("english");

    const handleTranslate = () => {
        // Placeholder for translation logic
        setOutputText(`Translated: ${inputText}`);
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/ai-tool" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">AI Translator</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid gap-2">
                    <div className="rounded-md border bg-muted p-2">
                        <p className="text-sm text-muted-foreground px-2 py-1">Detect Language</p>
                        <Textarea
                            placeholder="Type text to translate..."
                            className="bg-transparent border-0 focus-visible:ring-0 text-base"
                            rows={5}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex justify-center items-center gap-4 text-muted-foreground">
                        <div className="flex-1 border-b"></div>
                        <span>To</span>
                        <div className="flex-1 border-b"></div>
                    </div>

                    <div className="rounded-md border p-2">
                         <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                            <SelectTrigger className="border-0 focus:ring-0">
                                <SelectValue placeholder="Choose language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="myanmar">Myanmar</SelectItem>
                                <SelectItem value="spanish">Spanish</SelectItem>
                                <SelectItem value="french">French</SelectItem>
                                <SelectItem value="japanese">Japanese</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Translation"
                            className="bg-transparent border-0 focus-visible:ring-0 text-base"
                            rows={5}
                            value={outputText}
                            readOnly
                        />
                    </div>
                </div>
            </main>

            <footer className="flex-shrink-0 border-t p-2">
                <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Type a message..." 
                      className="flex-1"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
                    />
                    <Button size="icon" onClick={handleTranslate}>
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </footer>
        </div>
    );
}
