
"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save Change
    </Button>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState("Aung Aung");
  const [username, setUsername] = useState("aungaung");
  const [bio, setBio] = useState("Digital Creator | Building cool stuff with code ✨");
  const [avatarUrl, setAvatarUrl] = useState("https://i.pravatar.cc/150?u=aungaung");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      // Mock saving logic
      toast({ title: 'Profile Updated!', description: 'Your changes have been saved (mocked).' });
      router.push('/profile');
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4">
        <Link href="/profile" className="p-2 -ml-2">
           <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="mx-auto font-bold text-xl">Edit your profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <form onSubmit={handleSave}>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                 <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Avatar className="relative h-32 w-32 border-2 border-primary">
                        <AvatarImage src={avatarUrl} alt="Avatar" data-ai-hint="person portrait"/>
                        <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                    </Avatar>
                 </label>
                 <input id="avatar-upload" name="avatar_file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
                <div>
                    <label className="text-sm font-medium" htmlFor="full_name">Name</label>
                    <Input id="full_name" name="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1"/>
                </div>
                 <div>
                    <label className="text-sm font-medium" htmlFor="username">Username</label>
                    <Input id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1"/>
                </div>
                 <div>
                    <label className="text-sm font-medium" htmlFor="bio">Bio</label>
                    <Textarea id="bio" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1"/>
                </div>
            </div>
            
            <SubmitButton />
        </form>

      </main>
    </div>
  );
}
