
"use client";

import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';

export default function ProfileSetupPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true); // For initial user fetch
  const [saving, setSaving] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setAuthUser(user);
        } else {
            // This case should ideally not happen if coming from signup.
            // But as a fallback, we can redirect.
            // However, the user's main complaint is this redirection.
            // So we will just log it and let the user fill the form.
            console.error("No user session found on setup page.");
        }
        setLoading(false);
    };
    fetchUser();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    // We now fetch the user again right before saving.
    // This is more robust than relying on the initial useEffect.
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
        toast({ variant: "destructive", title: "Authentication session expired.", description: "Please log in and try again." });
        router.push('/login');
        return;
    };

    setSaving(true);
    
    let publicAvatarUrl = avatarUrl;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${currentUser.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) {
        toast({ variant: "destructive", title: "Failed to upload avatar." });
        console.error(uploadError);
        setSaving(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      publicAvatarUrl = publicUrl;
    }

    const { error: updateError } = await supabase.from('profiles').upsert({
      id: currentUser.id,
      full_name: fullName,
      username: username,
      bio: bio,
      avatar_url: publicAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      toast({ variant: "destructive", title: "Failed to save profile.", description: updateError.message });
      console.error(updateError);
    } else {
      toast({ title: "Profile saved successfully!" });
      // Use window.location.href for a full page refresh to ensure all states are cleared.
      window.location.href = '/home';
    }
    setSaving(false);
  };
  
  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
        <h1 className="mx-auto font-bold text-xl">Set Up Your Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
             <label htmlFor="avatar-upload" className="cursor-pointer">
                <Avatar className="relative h-32 w-32 border-2 border-primary">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" data-ai-hint="person portrait"/>}
                    <AvatarFallback>{username.charAt(0) || fullName.charAt(0) || 'U'}</AvatarFallback>
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                    </div>
                </Avatar>
             </label>
             <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input name="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required/>
            </div>
             <div>
                <label className="text-sm font-medium">Username</label>
                <Input name="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" required/>
            </div>
             <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea name="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1" placeholder="Tell us about yourself"/>
            </div>
        </div>
        
        <Button className="w-full" onClick={handleSaveProfile} disabled={saving || !fullName || !username}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save and Continue
        </Button>

      </main>
    </div>
  );
}
