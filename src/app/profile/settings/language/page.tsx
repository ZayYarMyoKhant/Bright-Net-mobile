
"use client";

import { useState } from 'react';
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

const languages = [
    { value: 'my', label: 'မြန်မာ' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'ar', label: 'العربية' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'bn', label: 'বাংলা' },
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'ms', label: 'Bahasa Melayu' },
    { value: 'th', label: 'ไทย' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'pl', label: 'Polski' },
    { value: 'sv', label: 'Svenska' },
    { value: 'da', label: 'Dansk' },
    { value: 'fi', label: 'Suomi' },
    { value: 'no', label: 'Norsk' },
    { value: 'cs', label: 'Čeština' },
    { value: 'hu', label: 'Magyar' },
    { value: 'ro', label: 'Română' },
    { value: 'el', label: 'Ελληνικά' },
    { value: 'he', label: 'עברית' },
    { value: 'uk', label: 'Українська' },
    { value: 'af', label: 'Afrikaans' },
    { value: 'sq', label: 'Shqip' },
    { value: 'am', label: 'አማርኛ' },
    { value: 'hy', label: 'Հայերեն' },
    { value: 'az', label: 'Azərbaycanca' },
    { value: 'eu', label: 'Euskara' },
    { value: 'be', label: 'Беларуская' },
    { value: 'bs', label: 'Bosanski' },
    { value: 'bg', label: 'Български' },
    { value: 'ca', label: 'Català' },
    { value: 'ceb', label: 'Cebuano' },
    { value: 'ny', label: 'Chichewa' },
    { value: 'co', label: 'Corsu' },
    { value: 'hr', label: 'Hrvatski' },
    { value: 'eo', label: 'Esperanto' },
    { value: 'et', label: 'Eesti' },
    { value: 'tl', label: 'Filipino' },
    { value: 'fy', label: 'Frysk' },
    { value: 'gl', label: 'Galego' },
    { value: 'ka', label: 'ქართული' },
    { value: 'gu', label: 'ગુજરાતી' },
    { value: 'ht', label: 'Kreyòl Ayisyen' },
    { value: 'ha', label: 'Hausa' },
    { value: 'haw', label: 'ʻŌlelo Hawaiʻi' },
    { value: 'is', label: 'Íslenska' },
    { value: 'ig', label: 'Igbo' },
    { value: 'ga', label: 'Gaeilge' },
    { value: 'jw', label: 'Basa Jawa' },
    { value: 'kn', label: 'ಕನ್ನಡ' },
    { value: 'kk', label: 'Қазақ тілі' },
    { value: 'km', label: 'ភាសាខ្មែរ' },
    { value: 'ku', label: 'Kurdî' },
    { value: 'ky', label: 'Кыргызча' },
    { value: 'lo', label: 'ລາວ' },
    { value: 'la', label: 'Latine' },
    { value: 'lv', label: 'Latviešu' },
    { value: 'lt', label: 'Lietuvių' },
    { value: 'lb', label: 'Lëtzebuergesch' },
    { value: 'mk', label: 'Македонски' },
    { value: 'mg', label: 'Malagasy' },
    { value: 'ml', label: 'മലയാളം' },
    { value: 'mt', label: 'Malti' },
    { value: 'mi', label: 'Māori' },
    { value: 'mr', label: 'मराठी' },
    { value: 'mn', label: 'Монгол' },
    { value: 'ne', label: 'नेपाली' },
    { value: 'ps', label: 'پښتو' },
    { value: 'fa', label: 'فارسی' },
    { value: 'pa', label: 'ਪੰਜਾਬੀ' },
    { value: 'sm', label: 'Gagana Samoa' },
    { value: 'gd', label: 'Gàidhlig' },
    { value: 'sr', label: 'Српски' },
    { value: 'st', label: 'Sesotho' },
    { value: 'sn', label: 'Shona' },
    { value: 'sd', label: 'سنڌي' },
    { value: 'si', label: 'සිංහල' },
    { value: 'sk', label: 'Slovenčina' },
    { value: 'sl', label: 'Slovenščina' },
    { value: 'so', label: 'Soomaali' },
    { value: 'su', label: 'Basa Sunda' },
    { value: 'sw', label: 'Kiswahili' },
    { value: 'tg', label: 'Тоҷикӣ' },
    { value: 'ta', label: 'தமிழ்' },
    { value: 'te', label: 'తెలుగు' },
    { value: 'ur', label: 'اردو' },
    { value: 'uz', label: 'O‘zbekcha' },
    { value: 'cy', label: 'Cymraeg' },
    { value: 'xh', label: 'isiXhosa' },
    { value: 'yi', label: 'ייִדיש' },
    { value: 'yo', label: 'Yorùbá' },
    { value: 'zu', label: 'isiZulu' },
];

export default function LanguageSettingsPage() {
    const [selectedLanguage, setSelectedLanguage] = useState('my');

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
                        <ScrollArea className="h-72">
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
                <Button className="w-full">
                    Change Language
                </Button>
            </footer>
        </div>
    );
}
