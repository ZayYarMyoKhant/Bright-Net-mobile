
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Languages, ArrowRightLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { translateText } from "@/ai/flows/translate-flow";

const languages = [
    { value: 'en', label: 'English' },
    { value: 'my', label: 'Burmese' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'zh-CN', label: 'Chinese (Simplified)' },
    { value: 'hi', label: 'Hindi' },
    { value: 'ar', label: 'Arabic' },
    { value: 'ru', label: 'Russian' },
];

export default function TranslatorPage() {
    const [inputText, setInputText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [sourceLang, setSourceLang] = useState("en");
    const [targetLang, setTargetLang] = useState("my");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleTranslate = async () => {
        if (!inputText.trim()) {
            toast({ variant: "destructive", title: "Input is empty", description: "Please enter some text to translate." });
            return;
        }
        setIsLoading(true);
        setTranslatedText("");

        try {
            const result = await translateText({
                text: inputText,
                sourceLang: languages.find(l => l.value === sourceLang)?.label || 'English',
                targetLang: languages.find(l => l.value === targetLang)?.label || 'Burmese',
            });
            setTranslatedText(result);
        } catch (error) {
            console.error("Translation failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: "destructive", title: "Translation Failed", description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSwapLanguages = () => {
        const currentSource = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(currentSource);
    };

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/ai-tool" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">AI Translator</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                 <Card className="bg-green-100/10 border-green-500/20">
                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                        <Languages className="h-10 w-10 text-green-500" />
                        <CardTitle>Translate anything</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <p className="text-muted-foreground">
                            Enter text in any language and get an accurate translation instantly.
                        </p>
                    </CardContent>
                </Card>

                <div className="flex-1 flex flex-col gap-4">
                    <Textarea
                        placeholder="Enter text to translate..."
                        className="flex-1 min-h-[120px] text-base"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isLoading}
                    />

                    <div className="flex items-center gap-2">
                        <Select value={sourceLang} onValueChange={setSourceLang} disabled={isLoading}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="From" />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="ghost" size="icon" onClick={handleSwapLanguages} disabled={isLoading}>
                            <ArrowRightLeft className="h-5 w-5" />
                        </Button>
                        
                        <Select value={targetLang} onValueChange={setTargetLang} disabled={isLoading}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="To" />
                            </SelectTrigger>
                             <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                     <Textarea
                        placeholder={isLoading ? "Translating..." : "Translation will appear here..."}
                        className="flex-1 min-h-[120px] bg-muted text-base"
                        readOnly
                        value={translatedText}
                    />
                </div>

                <Button size="lg" className="w-full" onClick={handleTranslate} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Translate
                </Button>
            </main>
        </div>
    );
}
