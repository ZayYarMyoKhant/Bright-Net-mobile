
"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Languages, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { translateText } from "@/ai/flows/translate-text-flow";
import { useToast } from "@/hooks/use-toast";

export default function AiTranslatorPage() {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("myanmar");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleTranslate = async () => {
        if (inputText.trim() && !isPending) {
            setOutputText("");
            startTransition(async () => {
                try {
                    const result = await translateText({ text: inputText, targetLanguage });
                    setOutputText(result.translatedText || "Could not translate text.");
                } catch(e: any) {
                    console.error(e);
                    toast({
                        variant: "destructive",
                        title: "An error occurred.",
                        description: e.message || "Please check the API key and try again.",
                    });
                }
            });
        }
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
                            disabled={isPending}
                        />
                    </div>
                    
                    <div className="flex justify-center items-center gap-4 text-muted-foreground">
                        <div className="flex-1 border-b"></div>
                        <span>To</span>
                        <div className="flex-1 border-b"></div>
                    </div>

                    <div className="rounded-md border p-2">
                         <Select value={targetLanguage} onValueChange={setTargetLanguage} disabled={isPending}>
                            <SelectTrigger className="border-0 focus:ring-0">
                                <SelectValue placeholder="Choose language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="myanmar">Myanmar</SelectItem>
                                <SelectItem value="spanish">Spanish</SelectItem>
                                <SelectItem value="french">French</SelectItem>
                                <SelectItem value="japanese">Japanese</SelectItem>
                                <SelectItem value="chinese">Chinese</SelectItem>
                                <SelectItem value="hindi">Hindi</SelectItem>
                                <SelectItem value="arabic">Arabic</SelectItem>
                                <SelectItem value="russian">Russian</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder={isPending ? "Translating..." : "Translation"}
                            className="bg-transparent border-0 focus-visible:ring-0 text-base"
                            rows={5}
                            value={outputText}
                            readOnly
                        />
                    </div>
                </div>
            </main>

            <footer className="flex-shrink-0 border-t p-4">
                <Button className="w-full" onClick={handleTranslate} disabled={!inputText || isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                    {isPending ? "Translating..." : "Translate"}
                </Button>
            </footer>
        </div>
    );
}
