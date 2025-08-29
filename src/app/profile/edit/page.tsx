
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function EditProfilePage() {
  const [user, setUser] = useState({
    name: "Aung Aung",
    username: "aungaung",
    avatar: "https://i.pravatar.cc/150?u=aungaung",
    bio: "Digital Creator | Love to share my life.",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUser(prev => ({
        ...prev,
        avatar: URL.createObjectURL(file)
      }));
    }
  };


  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4">
        <Link href="/profile" className="p-2 -ml-2">
           <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="mx-auto font-bold text-xl">Edit your profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
             <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="relative h-32 w-32 rounded-lg overflow-hidden border-2 border-primary">
                    <Image src={user.avatar} alt="Avatar" layout="fill" objectFit="cover" data-ai-hint="person portrait"/>
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                    </div>
                </div>
             </label>
             <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
        
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium">Name</label>
                <Input name="name" value={user.name} onChange={handleInputChange} className="mt-1"/>
            </div>
             <div>
                <label className="text-sm font-medium">Username</label>
                <Input name="username" value={user.username} onChange={handleInputChange} className="mt-1"/>
            </div>
             <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea name="bio" value={user.bio} onChange={handleInputChange} className="mt-1"/>
            </div>
        </div>
        
        <Button className="w-full">Save change</Button>

      </main>
    </div>
  );
}
