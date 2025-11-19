
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

type ClassData = {
    id: string;
    name: string;
    description: string;
    students: Profile[];
};

export default function IndividualClassPageContent({ params }: { params: { id: string } }) {
    const classId = params.id;
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const [classData, setClassData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);

    useEffect(() => {
        const fetchClassData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const { data: classInfo, error: classError } = await supabase
                .from('classes')
                .select('id, name, description')
                .eq('id', classId)
                .single();

            if (classError || !classInfo) {
                toast({ variant: 'destructive', title: 'Class not found' });
                router.push('/home');
                return;
            }

            const { data: studentData, error: studentError } = await supabase
                .from('class_enrollments')
                .select('profiles:user_id(*)')
                .eq('class_id', classId);
            
            const students = studentData ? studentData.map((s: any) => s.profiles) : [];
            
            setClassData({ ...classInfo, students } as ClassData);

            if (user) {
                const isUserEnrolled = students.some((student: Profile) => student.id === user.id);
                setIsEnrolled(isUserEnrolled);
            }

            setLoading(false);
        };

        fetchClassData();
    }, [classId, router, supabase, toast]);

    const handleEnroll = async () => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'You must be logged in to enroll.' });
            return;
        }

        if (isEnrolled) return;

        const { error } = await supabase.from('class_enrollments').insert({
            class_id: classId,
            user_id: currentUser.id
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to enroll', description: error.message });
        } else {
            toast({ title: 'Successfully enrolled!' });
            setIsEnrolled(true);
            // Refresh students list
            setClassData(prev => prev ? ({ ...prev, students: [...prev.students, {id: currentUser.id, username: currentUser.user_metadata.username, avatar_url: currentUser.user_metadata.avatar_url}] as Profile[]}) : null);
        }
    };

    if (loading || !classData) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
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
                <h2 className="text-2xl font-bold">{classData.name}</h2>
                
                <p className="text-muted-foreground">{classData.description}</p>
                
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

    