
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";


export default function CreateClassPage() {
    const [className, setClassName] = useState("");
    const [description, setDescription] = useState("");
    const [privacy, setPrivacy] = useState("public");
    const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCoverPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateClass = async () => {
        startTransition(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a class." });
                return;
            }

            let cover_photo_url = null;

            if (coverPhotoFile) {
                const filePath = `class-covers/${user.id}/${Date.now()}_${coverPhotoFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars') // Or a new bucket for class covers
                    .upload(filePath, coverPhotoFile);

                if (uploadError) {
                    toast({ variant: "destructive", title: "Upload Error", description: uploadError.message });
                    return;
                }

                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                cover_photo_url = urlData.publicUrl;
            }

            // Step 1: Insert the new class and get its ID
            const { data: newClass, error: classError } = await supabase
                .from('classes')
                .insert({
                    name: className,
                    description,
                    privacy,
                    created_by: user.id,
                    cover_photo_url,
                })
                .select('id')
                .single();

            if (classError || !newClass) {
                toast({ variant: "destructive", title: "Database Error", description: classError?.message || "Failed to create class." });
                return;
            }

            // Step 2: Add the creator as a member of the new class
            const { error: memberError } = await supabase
                .from('class_members')
                .insert({
                    class_id: newClass.id,
                    user_id: user.id,
                });
            
            if (memberError) {
                 toast({ variant: "destructive", title: "Membership Error", description: "Failed to add you as a member to the new class." });
                 // Note: You might want to handle cleanup here, e.g., delete the created class
            } else {
                toast({ title: "Class Created!", description: `The class "${className}" has been successfully created.` });
                router.push('/class');
                router.refresh();
            }
        });
    };

    return (
        <div className="flex h-full flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/upload" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">Let's create your own class</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/50 overflow-hidden"
                 >
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Cover preview" layout="fill" objectFit="cover" data-ai-hint="class cover" />
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <ImagePlus className="mx-auto h-12 w-12" />
                            <p className="mt-2 text-sm font-medium">Upload class cover photo</p>
                        </div>
                    )}
                </div>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Class Name</Label>
                        <Input id="name" name="name" value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1"/>
                    </div>
                     <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1"/>
                    </div>
                </div>
                
                <RadioGroup defaultValue="public" value={privacy} onValueChange={setPrivacy}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="r1" />
                        <Label htmlFor="r1">Public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="r2" />
                        <Label htmlFor="r2">Private</Label>
                    </div>
                </RadioGroup>

                <Button className="w-full" disabled={!className || isPending} onClick={handleCreateClass}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                </Button>
            </main>
        </div>
    )
}
