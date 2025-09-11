
"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


const stickerCategories = {
    love: [
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/love/Screenshot_2025-09-08-22-23-55-73.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/love/Screenshot_2025-09-08-22-24-44-05.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/love/Screenshot_2025-09-08-22-25-53-93.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/love/Screenshot_2025-09-08-22-26-09-58.jpg'
    ],
    laugh: [
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/laugh/Screenshot_2025-09-08-22-27-56-24.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/laugh/Screenshot_2025-09-08-22-28-10-61.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/laugh/Screenshot_2025-09-08-22-28-26-72.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/laugh/Screenshot_2025-09-08-22-28-41-13.jpg'
    ],
    cry: [
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/cry/Screenshot_2025-09-08-22-32-03-18.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/cry/Screenshot_2025-09-08-22-32-21-29.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/cry/Screenshot_2025-09-08-22-32-41-59.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/cry/Screenshot_2025-09-08-22-32-55-95.jpg'
    ],
    angry: [
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/angry/IMG_20250908_221753.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/angry/IMG_20250908_221810.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/angry/IMG_20250908_222157.jpg',
      'https://blbqaojfppwybkjqiyeb.supabase.co/storage/v1/object/public/avatars/stickers/angry/Screenshot_2025-08-31-07-06-18-50.jpg'
    ],
};

const emojiCategories = [
  { name: 'Smileys & Emotion', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'] },
  { name: 'People & Body', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'] },
];

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
                                {stickers.map((sticker) => (
                                    <button
                                        key={sticker}
                                        onClick={() => onStickerSelect(sticker)}
                                        className="rounded-md hover:bg-muted aspect-square flex items-center justify-center p-1"
                                    >
                                       <div className="w-full h-full relative">
                                            <Image 
                                                src={sticker} 
                                                alt={`${name} sticker`} 
                                                fill
                                                className="w-full h-full object-contain"
                                                unoptimized={true}
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
