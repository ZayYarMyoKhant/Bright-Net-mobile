
"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Languages, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function TranslatorPage() {

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/ai-tool" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">AI Translator</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                 <Card className="bg-green-100/10">
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
                    />

                    <div className="flex items-center gap-2">
                        <Select defaultValue="en">
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="From" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">Auto-detect</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="my">Burmese</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="ghost" size="icon">
                            <ArrowRightLeft className="h-5 w-5" />
                        </Button>
                        
                        <Select defaultValue="my">
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="To" />
                            </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="my">Burmese</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                     <Textarea
                        placeholder="Translation will appear here..."
                        className="flex-1 min-h-[120px] bg-muted text-base"
                        readOnly
                    />
                </div>


                <Button size="lg" className="w-full">
                    Translate
                </Button>
            </main>
        </div>
    );
}
