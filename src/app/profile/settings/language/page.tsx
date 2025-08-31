
"use client";

import { useState, useContext } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LanguageContext } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

const languages = [
    { value: 'en', label: 'English' },
    { value: 'my', label: 'မြန်မာ' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'zh-CN', label: '简体中文' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'ar', label: 'العربية' },
    { value: 'ru', label: 'Русский' },
];

export default function LanguageSettingsPage() {
    const { language, setLanguage } = useContext(LanguageContext);
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const { toast } = useToast();

    const handleChangeLanguage = () => {
        setLanguage(selectedLanguage);
        const selectedLangLabel = languages.find(l => l.value === selectedLanguage)?.label;
        toast({
            title: "Language Changed",
            description: `App language has been set to ${selectedLangLabel}.`,
        });
    }

    return (
        <div className="flex h-full flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/profile/settings" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">Language</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-auto">
                            {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
            </main>
            <footer className="flex-shrink-0 border-t p-4">
                <Button className="w-full" onClick={handleChangeLanguage}>
                    Change Language
                </Button>
            </footer>
        </div>
    );
}
