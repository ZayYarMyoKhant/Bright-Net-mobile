
"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { saveProfile } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';

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
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const getProfile = useCallback(async (user: User) => {
    setAuthUser(user);
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url, bio')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      console.error('Error fetching profile for editing:', error);
      toast({ variant: 'destructive', title: 'Error fetching your data', description: "Please try again later." });
      setLoading(false);
      return;
    }
    
    setFullName(data.full_name || "");
    setUsername(data.username || "");
    setBio(data.bio || "");
    setAvatarUrl(data.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`);
    setLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
     const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            getProfile(user);
        } else {
            router.push('/login');
        }
    };
    checkUser();
  }, [getProfile, router, supabase]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  if (loading) {
      return (
          <div className="flex h-dvh w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
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
        <form action={saveProfile}>
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
