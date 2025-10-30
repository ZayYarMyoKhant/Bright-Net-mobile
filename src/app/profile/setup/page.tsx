
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { PhotoCropper } from "@/components/photo-cropper";

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
        } else {
            router.replace('/signup');
        }
        setLoading(false);
    }
    fetchUser();
  }, [router, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleCropComplete = (croppedImageFile: File) => {
    setAvatarFile(croppedImageFile);
    setPreviewUrl(URL.createObjectURL(croppedImageFile));
    setCropperImageSrc(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You are not logged in." });
      return;
    }
    if (!fullName || !username) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please enter your name and a username." });
      return;
    }

    setSaving(true);
    
    let publicAvatarUrl = null;

    if (avatarFile) {
        const filePath = `${user.id}/${Date.now()}_${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile);

        if (uploadError) {
            toast({ variant: "destructive", title: "Upload Error", description: uploadError.message });
            setSaving(false);
            return;
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        publicAvatarUrl = urlData.publicUrl;
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: username,
        full_name: fullName,
        bio: bio,
        avatar_url: publicAvatarUrl,
        updated_at: new Date().toISOString(),
        show_active_status: true,
    });

    if (profileError) {
        toast({ variant: "destructive", title: "Profile Error", description: profileError.message });
    } else {
        toast({ title: 'Profile Created!', description: 'Welcome to Bright-Net!' });
        router.push('/home');
    }

    setSaving(false);
  }

  if (loading) {
    return (
        <div className="flex h-dvh w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <>
      <PhotoCropper 
        imageSrc={cropperImageSrc}
        onCropComplete={handleCropComplete}
        onClose={() => setCropperImageSrc(null)}
      />
      <div className="flex h-full flex-col bg-background text-foreground">
        <header className="flex h-16 flex-shrink-0 items-center border-b px-4">
          <h1 className="mx-auto font-bold text-xl">Set up your profile</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                      <Avatar className="relative h-32 w-32 border-2 border-primary" src={previewUrl} alt={username}>
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Camera className="h-8 w-8 text-white" />
                          </div>
                      </Avatar>
                  </label>
                  <input id="avatar-upload" name="avatar_file" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </div>
              </div>
              
              <div className="space-y-4">
                  <div>
                      <label className="text-sm font-medium" htmlFor="full_name">Name *</label>
                      <Input id="full_name" name="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required placeholder="Enter your full name"/>
                  </div>
                  <div>
                      <label className="text-sm font-medium" htmlFor="username">Username *</label>
                      <Input id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" required placeholder="Choose a username"/>
                  </div>
                  <div>
                      <label className="text-sm font-medium" htmlFor="bio">Bio</label>
                      <Textarea id="bio" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1" placeholder="Tell us about yourself"/>
                  </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
          </form>

        </main>
      </div>
    </>
  );
}
