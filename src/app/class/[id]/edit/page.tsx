
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, UserX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type ClassMember = {
    user_id: string;
    profiles: Profile;
};

type ClassDetails = {
    id: string;
    name: string;
    creator_id: string;
};

export default function EditClassPage({ params }: { params: { id: string } }) {
    const classId = params.id;
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [className, setClassName] = useState("");
    const [members, setMembers] = useState<ClassMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchClassData = useCallback(async (user: User) => {
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('id, name, creator_id')
            .eq('id', classId)
            .single();

        if (classError || !classData) {
            setError("Could not load class details or you do not have permission to edit it.");
            setLoading(false);
            return;
        }

        if (classData.creator_id !== user.id) {
            setError("You are not the creator of this class.");
            setLoading(false);
            return;
        }

        setClassDetails(classData);
        setClassName(classData.name);

        const { data: memberData, error: memberError } = await supabase
            .from('class_members')
            .select('user_id, profiles:user_id(*)')
            .eq('class_id', classId);

        if (memberError) {
            toast({ variant: "destructive", title: "Error fetching members", description: memberError.message });
        } else {
            setMembers(memberData as unknown as ClassMember[]);
        }

        setLoading(false);
    }, [classId, supabase, toast]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setCurrentUser(user);
                fetchClassData(user);
            } else {
                router.push('/signup');
            }
        });
    }, [supabase, router, fetchClassData]);

    const handleSaveChanges = async () => {
        if (!className.trim() || !classDetails) return;
        setIsSaving(true);
        
        const { error } = await supabase
            .from('classes')
            .update({ name: className.trim() })
            .eq('id', classDetails.id);

        setIsSaving(false);
        if (error) {
            toast({ variant: "destructive", title: "Failed to update class", description: error.message });
        } else {
            toast({ title: "Class name updated successfully!" });
        }
    };

    const handleKickMember = async (memberId: string) => {
        if (!classDetails) return;

        // Optimistically update UI
        setMembers(prev => prev.filter(m => m.user_id !== memberId));

        const { error } = await supabase
            .from('class_members')
            .delete()
            .match({ class_id: classDetails.id, user_id: memberId });

        if (error) {
            toast({ variant: "destructive", title: "Failed to kick member", description: error.message });
            // Revert UI on failure
            if (currentUser) fetchClassData(currentUser); 
        } else {
            toast({ title: "Member kicked" });
        }
    };
    
    if (loading) {
        return <div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return (
            <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
                 <Alert variant="destructive" className="max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        <p>{error}</p>
                        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold mx-auto">Edit your class</h1>
            </header>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    <div>
                        <label className="text-sm font-medium" htmlFor="class_name">Class Name</label>
                        <Input 
                            id="class_name" 
                            value={className} 
                            onChange={(e) => setClassName(e.target.value)} 
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold border-b pb-2 mb-4">Class Members</h2>
                        {members.length > 1 ? (
                            <div className="divide-y">
                                {members.filter(m => m.user_id !== currentUser?.id).map(member => (
                                    <div key={member.user_id} className="py-2 flex items-center gap-4">
                                        <Link href={`/profile/${member.profiles.id}`} className="flex-shrink-0">
                                            <Avatar className="h-10 w-10" profile={member.profiles} />
                                        </Link>
                                        <div className="flex-1">
                                            <p className="font-semibold">{member.profiles.full_name}</p>
                                            <p className="text-sm text-muted-foreground">@{member.profiles.username}</p>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">Kick</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove {member.profiles.full_name} from the class. They can rejoin later if invited or from the search page.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleKickMember(member.user_id)} className="bg-destructive hover:bg-destructive/80">Confirm Kick</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 text-muted-foreground flex flex-col items-center">
                                <UserX className="h-10 w-10 mb-2" />
                                <p className="font-bold">Only you are in the class</p>
                                <p className="text-sm mt-1">Add new members from the class page.</p>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            <footer className="p-4 border-t">
                <Button className="w-full" disabled={isSaving} onClick={handleSaveChanges}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </footer>
        </div>
    );
}
