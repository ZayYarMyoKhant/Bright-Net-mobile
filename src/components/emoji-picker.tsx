
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

const emojiCategories = [
  { name: 'Special', emojis: ['🫰'] },
  { name: 'Smileys & Emotion', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'] },
  { name: 'People & Body', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'] },
];

const stickerUrlBase = "https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers";

const stickerCategories = {
    love: [
        `${stickerUrlBase}/love/love-1.webp`,
        `${stickerUrlBase}/love/love-2.webp`,
        `${stickerUrlBase}/love/love-3.webp`,
        `${stickerUrlBase}/love/love-4.webp`,
        `${stickerUrlBase}/love/love-5.webp`,
        `${stickerUrlBase}/love/love-6.webp`,
        `${stickerUrlBase}/love/love-7.webp`,
        `${stickerUrlBase}/love/love-8.webp`,
    ],
    laugh: [
        `${stickerUrlBase}/laugh/laugh-1.webp`,
        `${stickerUrlBase}/laugh/laugh-2.webp`,
        `${stickerUrlBase}/laugh/laugh-3.webp`,
        `${stickerUrlBase}/laugh/laugh-4.webp`,
        `${stickerUrlBase}/laugh/laugh-5.webp`,
        `${stickerUrlBase}/laugh/laugh-6.webp`,
        `${stickerUrlBase}/laugh/laugh-7.webp`,
        `${stickerUrlBase}/laugh/laugh-8.webp`,
    ],
    cry: [
        `${stickerUrlBase}/cry/cry-1.webp`,
        `${stickerUrlBase}/cry/cry-2.webp`,
        `${stickerUrlBase}/cry/cry-3.webp`,
        `${stickerUrlBase}/cry/cry-4.webp`,
        `${stickerUrlBase}/cry/cry-5.webp`,
        `${stickerUrlBase}/cry/cry-6.webp`,
        `${stickerUrlBase}/cry/cry-7.webp`,
        `${stickerUrlBase}/cry/cry-8.webp`,
    ],
    angry: [
        `${stickerUrlBase}/angry/angry-1.webp`,
        `${stickerUrlBase}/angry/angry-2.webp`,
        `${stickerUrlBase}/angry/angry-3.webp`,
        `${stickerUrlBase}/angry/angry-4.webp`,
        `${stickerUrlBase}/angry/angry-5.webp`,
        `${stickerUrlBase}/angry/angry-6.webp`,
        `${stickerUrlBase}/angry/angry-7.webp`,
        `${stickerUrlBase}/angry/angry-8.webp`,
    ],
};


type EmojiPickerProps = {
    onEmojiSelect: (emoji: string) => void;
    onStickerSelect: (stickerUrl: string) => void;
}

export function EmojiPicker({ onEmojiSelect, onStickerSelect }: EmojiPickerProps) {
  return (
    <div className="h-64 w-full bg-background border-t">
        <Tabs defaultValue="emoji" className="flex flex-col h-full">
            <TabsContent value="emoji" className="flex-1 overflow-y-hidden mt-0">
                <ScrollArea className="h-full p-2">
                    {emojiCategories.map(category => (
                        <div key={category.name} className="mb-4">
                            <p className="text-sm font-semibold text-muted-foreground px-2 mb-2">{category.name}</p>
                            <div className="grid grid-cols-8 gap-2">
                                {category.emojis.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => onEmojiSelect(emoji)}
                                        className="text-2xl rounded-md hover:bg-muted aspect-square flex items-center justify-center"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </TabsContent>
            <TabsContent value="stickers" className="flex-1 overflow-y-hidden mt-0">
                 <ScrollArea className="h-full p-2">
                    {Object.entries(stickerCategories).map(([name, stickers]) => (
                        <div key={name} className="mb-4">
                            <p className="text-sm font-semibold text-muted-foreground px-2 mb-2 capitalize">{name}</p>
                            <div className="grid grid-cols-4 gap-2">
                                {stickers.map((sticker, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onStickerSelect(sticker)}
                                        className="rounded-md hover:bg-muted aspect-square flex items-center justify-center p-1"
                                    >
                                       <div className="relative w-full h-full">
                                            <Image 
                                                src={sticker} 
                                                alt={`${name} sticker ${index + 1}`} 
                                                width={64}
                                                height={64}
                                                unoptimized={true}
                                                className="w-full h-full object-contain"
                                                data-ai-hint={`${name} sticker`} 
                                            />
                                       </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </TabsContent>
            <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="emoji">Emoji</TabsTrigger>
                <TabsTrigger value="stickers">Stickers</TabsTrigger>
            </TabsList>
        </Tabs>
    </div>
  );
}
