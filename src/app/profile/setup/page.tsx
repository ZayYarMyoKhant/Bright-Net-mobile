
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2 } from "lucide-react";
import { saveProfile } from "@/lib/actions";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full mt-6" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save and Continue
    </Button>
  );
}


export default function ProfileSetupPage() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('error');


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
        <h1 className="mx-auto font-bold text-xl">Set Up Your Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {errorMessage && (
           <Alert variant="destructive" className="mb-4">
              <AlertTitle>Save Failed</AlertTitle>
              <AlertDescription>{decodeURIComponent(errorMessage)}</AlertDescription>
            </Alert>
        )}
        <form action={saveProfile}>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Avatar className="relative h-32 w-32 border-2 border-primary">
                        {previewUrl ? <AvatarImage src={previewUrl} alt="Avatar" data-ai-hint="person portrait"/> : <AvatarFallback>U</AvatarFallback>}
                        
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </Avatar>
                </label>
                <input id="avatar_file" name="avatar_file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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
            
            <SubmitButton />
        </form>
      </main>
    </div>
  );
}
