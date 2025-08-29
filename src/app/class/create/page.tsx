
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ImagePlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";


export default function CreateClassPage() {
    const [className, setClassName] = useState("");
    const [description, setDescription] = useState("");
    const [privacy, setPrivacy] = useState("public");

    return (
        <div className="flex h-full flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/upload" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">Let's create your own class</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                 <div className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/50">
                    <div className="text-center text-muted-foreground">
                        <ImagePlus className="mx-auto h-12 w-12" />
                        <p className="mt-2 text-sm font-medium">Upload class cover photo</p>
                    </div>
                </div>
                
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

                <Button className="w-full" disabled={!className || !description}>Create</Button>
            </main>
        </div>
    )
}
