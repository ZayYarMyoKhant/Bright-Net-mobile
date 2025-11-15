
"use client";

import { use, Suspense, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Users, Crown, Loader2, ImageOff, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/lib/data";

type ClassDetails = {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    creator_id: string;
    profiles: Profile; // Creator's profile
    class_members: { count: number }[];
}

// This function is required for static export
export async function generateStaticParams() {
  return [];
}


function ClassInfoContent({ params }: { params: { id: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchClassDetails = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*, profiles!classes_creator_id_fkey(*), class_members(count)')
            .eq('id', params.id)
            .single();

        if (error || !data) {
            toast({ variant: "destructive", title: "Error", description: "Could not fetch class details."});
            router.push('/class');
        } else {
            setClassDetails(data as unknown as ClassDetails);
        }
        setLoading(false);
    }, [params.id, supabase, toast, router]);

    useEffect(() => {
        fetchClassDetails();
    }, [fetchClassDetails]);


    if (loading || !classDetails) {
        return (
             <div className="flex h-dvh flex-col bg-background text-foreground items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const memberCount = classDetails.class_members[0]?.count ?? 0;

    return (
         <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 items-center flex-shrink-0 border-b p-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                 <h1 className="text-xl font-bold mx-auto">Class Info</h1>
                 <div className="w-9 h-9"></div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                 <div className="flex flex-col items-center gap-4 text-center">
                    <Avatar className="h-24 w-24 border-2 border-primary rounded-md" src={classDetails.avatar_url} alt={classDetails.name}>
                        <AvatarFallback className="rounded-md">
                            <GraduationCap className="h-10 w-10" />
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold">{classDetails.name}</h1>
                        <p className="text-muted-foreground text-sm mt-1">{classDetails.description || "No description provided."}</p>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                        <Users className="h-6 w-6 text-primary" />
                        <div>
                            <p className="font-semibold">Total Members</p>
                            <p className="text-muted-foreground">{memberCount} member(s)</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <Crown className="h-6 w-6 text-yellow-500" />
                        <div>
                            <p className="font-semibold">Created by</p>
                            <p className="text-muted-foreground">{classDetails.profiles.full_name} (@{classDetails.profiles.username})</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


export default function ClassInfoPage({ params: paramsPromise }: { params: Promise<{ id:string }> }) {
  const params = use(paramsPromise);
  return (
    <Suspense fallback={
        <div className="flex h-dvh flex-col bg-background text-foreground items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    }>
      <ClassInfoContent params={params} />
    </Suspense>
  );
}
