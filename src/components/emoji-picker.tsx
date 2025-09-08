
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

const emojiCategories = [
  { name: 'Special', emojis: ['🫰'] },
  { name: 'Smileys & Emotion', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'] },
  { name: 'People & Body', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'] },
];

const stickerCategories = {
    love: Array.from({ length: 8 }, (_, i) => `https://picsum.photos/100/100?random=love${i}`),
    laugh: Array.from({ length: 8 }, (_, i) => `https://picsum.photos/100/100?random=laugh${i}`),
    cry: Array.from({ length: 8 }, (_, i) => `https://picsum.photos/100/100?random=cry${i}`),
    angry: Array.from({ length: 8 }, (_, i) => `https://picsum.photos/100/100?random=angry${i}`),
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
                                            <Image src={sticker} alt={`${name} sticker ${index + 1}`} layout="fill" objectFit="contain" data-ai-hint={`${name} sticker`} />
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
