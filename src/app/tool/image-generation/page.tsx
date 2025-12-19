
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Bot, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function ImageGenerationPage() {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleCreateImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            toast({ variant: 'destructive', title: 'Prompt is empty', description: 'Please enter a prompt to generate an image.' });
            return;
        }

        setLoading(true);
        setImageUrl(null);

        try {
            const response = await fetch(`https://ai.zmt51400.workers.dev/?prompt=${encodeURIComponent(prompt)}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            // The API returns a JSON with a URL, not the image blob directly.
            const data = await response.json();
            
            // Assuming the JSON response has a key like "url" or "imageUrl"
            const generatedUrl = data.url || data.imageUrl;

            if (generatedUrl && typeof generatedUrl === 'string') {
                setImageUrl(generatedUrl);
            } else {
                throw new Error('API response did not contain a valid image URL.');
            }

        } catch (error) {
            console.error("Image generation error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Image Generation Failed",
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };
    
    const handleViewFullScreen = () => {
        if(imageUrl) {
            router.push(`/search/image/${encodeURIComponent(imageUrl)}`);
        }
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/tool" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">ZMT image generation model</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                <form onSubmit={handleCreateImage} className="flex items-center gap-2">
                    <Input
                        placeholder="Enter a prompt to create an image..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading || !prompt.trim()}>
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create'}
                    </Button>
                </form>

                <div className="flex-1 flex items-center justify-center">
                    {loading ? (
                        <Card className="w-full max-w-sm p-6 text-center bg-muted border-dashed">
                           <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="font-semibold text-muted-foreground">Generating image...</p>
                                <p className="text-sm text-muted-foreground">please wait a few time</p>
                           </div>
                        </Card>
                    ) : imageUrl ? (
                        <div 
                            className="relative w-full max-w-lg aspect-square cursor-pointer group"
                            onClick={handleViewFullScreen}
                        >
                            <Image
                                src={imageUrl}
                                alt={prompt}
                                fill
                                className="object-contain rounded-lg"
                                data-ai-hint="generated image"
                            />
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                <p className="text-white font-bold">View Full Screen</p>
                            </div>
                        </div>
                    ) : (
                         <Card className="w-full max-w-sm p-6 text-center bg-muted/50 border-dashed">
                           <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                <Bot className="h-12 w-12" />
                                <p className="font-semibold">Your generated image will appear here.</p>
                           </div>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
