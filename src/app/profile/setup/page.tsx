
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { saveProfile } from "@/lib/actions";

export default function ProfileSetupPage() {
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    
    const formData = new FormData(event.currentTarget);
    if (avatarFile) {
      formData.append('avatar_file', avatarFile);
    }
    
    const result = await saveProfile(formData);

    if (result?.error) {
      toast({
        variant: "destructive",
        title: "Failed to save profile.",
        description: result.error,
      });
      setSaving(false);
    }
    // On success, the server action will redirect, so no need to handle success case here.
  };


  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
        <h1 className="mx-auto font-bold text-xl">Set Up Your Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Avatar className="relative h-32 w-32 border-2 border-primary">
                        {previewUrl && <AvatarImage src={previewUrl} alt="Avatar" data-ai-hint="person portrait"/>}
                        <AvatarFallback>U</AvatarFallback>
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </Avatar>
                </label>
                {/* The file input is not part of the form data directly, handled in state */}
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
                <div>
                    <label className="text-sm font-medium" htmlFor="full_name">Full Name</label>
                    <Input id="full_name" name="full_name" className="mt-1" required/>
                </div>
                <div>
                    <label className="text-sm font-medium" htmlFor="username">Username</label>
                    <Input id="username" name="username" className="mt-1" required/>
                </div>
                <div>
                    <label className="text-sm font-medium" htmlFor="bio">Bio</label>
                    <Textarea id="bio" name="bio" className="mt-1" placeholder="Tell us about yourself"/>
                </div>
            </div>
            
            <Button type="submit" className="w-full mt-6" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and Continue
            </Button>
        </form>
      </main>
    </div>
  );
}
