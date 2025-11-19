
"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Profile } from "@/lib/data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type ClassData = {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    students: Profile[];
};

type InitialClassData = {
    classData: ClassData | null;
    isEnrolled: boolean;
    error: string | null;
}

export default function IndividualClassPageContent({ initialData, params }: { initialData: InitialClassData, params: { id: string } }) {
    const classId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [classData, setClassData] = useState<ClassData | null>(initialData.classData);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(initialData.isEnrolled);
    const [error, setError] = useState<string | null>(initialData.error);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, [supabase]);


    const handleEnroll = async () => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'You must be logged in to enroll.' });
            return;
        }
        if (isEnrolled || !classData) return;

        const { error } = await supabase.from('class_enrollments').insert({
            class_id: classData.id,
            user_id: currentUser.id
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to enroll', description: error.message });
        } else {
            toast({ title: 'Successfully enrolled!' });
            setIsEnrolled(true);
            // Optimistically update students list
            const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            if (userProfile) {
                setClassData(prev => prev ? ({ ...prev, students: [...prev.students, userProfile] }) : null);
            }
        }
    };

    if (error) {
         return (
            <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
                 <Alert variant="destructive" className="max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        <p>Could not load the class data. Here's the specific error:</p>
                        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs font-mono">{error}</pre>
                        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!classData) {
        return (
             <div className="flex h-dvh w-full items-center justify-center text-center">
                <p>Class could not be loaded. It might have been deleted.</p>
                 <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
             </div>
        )
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-bold text-lg truncate px-2">{classData.name}</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center gap-4">
                     <Avatar className="h-20 w-20" src={classData.avatar_url} alt={classData.name} />
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">{classData.name}</h2>
                        <p className="text-muted-foreground">{classData.description}</p>
                    </div>
                </div>
                
                <Button className="w-full" onClick={handleEnroll} disabled={isEnrolled}>
                    {isEnrolled ? 'Enrolled' : 'Enroll in this Class'}
                </Button>
                
                <div className="border-t pt-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5" />
                        Students ({classData.students.length})
                    </h3>
                     <div className="grid grid-cols-2 gap-4">
                        {classData.students.map(student => (
                            <Link href={`/profile/${student.id}`} key={student.id}>
                                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                                    <Avatar className="h-10 w-10" profile={student} />
                                    <p className="font-semibold truncate">{student.full_name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

    