
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type ProfileDesignValue = 'standard' | 'premium' | 'luxury';

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileDesign, setProfileDesign] = useState<ProfileDesignValue>('standard');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
    const fetchProfile = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            setUser(authUser);
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();
            
            if (profile) {
                setFullName(profile.full_name || '');
                setUsername(profile.username || '');
                setBio(profile.bio || '');
                setPreviewUrl(profile.avatar_url || null);

                // Map database value to UI value
                if (profile.profile_design === true) {
                    setProfileDesign('luxury');
                } else if (profile.profile_design === null) {
                    setProfileDesign('premium');
                } else {
                    setProfileDesign('standard');
                }

            } else if (error && error.code !== 'PGRST116') {
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to load profile data.' });
            }
        } else {
            router.replace('/signup');
        }
        setLoading(false);
    }
    fetchProfile();
  }, [router, supabase, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow re-selection of the same file
    e.target.value = "";
  };
  
  const handleCropComplete = (croppedImageFile: File) => {
    setAvatarFile(croppedImageFile);
    setPreviewUrl(URL.createObjectURL(croppedImageFile));
    setCropperImageSrc(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    let publicAvatarUrl = previewUrl; // Keep old URL if no new file

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

    // Map UI value back to database value
    let dbProfileDesign: boolean | null;
    if (profileDesign === 'luxury') {
        dbProfileDesign = true;
    } else if (profileDesign === 'premium') {
        dbProfileDesign = null;
    } else {
        dbProfileDesign = false;
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        username,
        full_name: fullName,
        bio,
        avatar_url: publicAvatarUrl,
        updated_at: new Date().toISOString(),
        profile_design: dbProfileDesign,
    });

    setSaving(false);
    if (profileError) {
        toast({ variant: "destructive", title: "Profile Error", description: profileError.message });
    } else {
        toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
        router.push(`/profile/${user.id}`);
        router.refresh();
    }
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
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
          <h1 className="mx-auto font-bold text-xl">Edit your profile</h1>
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
                  <input id="avatar-upload" name="avatar_file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
                </div>
              </div>
              
              <div className="space-y-4">
                  <div>
                      <Label className="text-sm font-medium" htmlFor="full_name">Name</Label>
                      <Input id="full_name" name="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1"/>
                  </div>
                  <div>
                      <Label className="text-sm font-medium" htmlFor="username">Username</Label>
                      <Input id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1"/>
                  </div>
                  <div>
                      <Label className="text-sm font-medium" htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1"/>
                  </div>
                  <div>
                      <Label className="text-sm font-medium">Profile Design</Label>
                      <Select value={profileDesign} onValueChange={(value) => setProfileDesign(value as ProfileDesignValue)}>
                          <SelectTrigger className="w-full mt-1">
                              <SelectValue placeholder="Select a design" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="premium">Premium (Blue)</SelectItem>
                              <SelectItem value="luxury">Luxury (Gold)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Change
              </Button>
          </form>

        </main>
      </div>
    </>
  );
}
