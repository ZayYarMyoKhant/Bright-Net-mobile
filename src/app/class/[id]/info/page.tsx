
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, User, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ClassInfo = {
    id: string;
    name: string;
    description: string;
    cover_photo_url: string;
    memberCount: number;
    createdBy: {
      full_name: string;
      avatar_url: string;
    };
};

export default function ClassInfoPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchClassInfo = async () => {
        setLoading(true);

        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select(`
                id,
                name,
                description,
                cover_photo_url,
                profiles (
                    full_name,
                    avatar_url
                )
            `)
            .eq('id', params.id)
            .single();

        if (classError || !classData) {
            console.error("Error fetching class info:", classError);
            setLoading(false);
            return;
        }

        const { data: membersData, error: membersError } = await supabase
            .from('class_members')
            .select('user_id', { count: 'exact' })
            .eq('class_id', params.id);
        
        if (membersError) {
            console.error("Error fetching member count:", membersError);
        }

        setClassInfo({
            id: classData.id,
            name: classData.name,
            description: classData.description || "No description provided.",
            cover_photo_url: classData.cover_photo_url || "https://picsum.photos/800/400?random=50",
            // @ts-ignore
            createdBy: classData.profiles,
            memberCount: membersData?.length || 0,
        });

        setLoading(false);
    }
    
    fetchClassInfo();
  }, [params.id, supabase]);

  if (loading || !classInfo) {
      return (
        <div className="flex h-dvh flex-col bg-background text-foreground items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading class details...</p>
        </div>
      )
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4">
        <Link href={`/class/${classInfo.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="mx-auto text-xl font-bold">Info</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="relative h-48 w-full">
          <Image
            src={classInfo.cover_photo_url}
            alt={classInfo.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="abstract design"
          />
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{classInfo.name}</h2>
            <p className="mt-2 text-muted-foreground">{classInfo.description}</p>
          </div>

          <div className="border-t border-b divide-y">
             <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Class Members</span>
                </div>
                <span className="text-muted-foreground">{classInfo.memberCount}</span>
            </div>
             <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Created by</span>
                </div>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={classInfo.createdBy.avatar_url} alt={classInfo.createdBy.full_name} data-ai-hint="person portrait" />
                        <AvatarFallback>{classInfo.createdBy.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{classInfo.createdBy.full_name}</span>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
