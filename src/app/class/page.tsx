
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Video, Loader2, BookOpen } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  is_member: boolean; // Added to track membership
};

export default function ClassPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [joiningClass, setJoiningClass] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchUserAndClasses = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (!user) {
        setLoading(false);
        return;
    }

    const { data: classData, error } = await supabase
      .from('classes')
      .select('*, class_members(user_id)');

    if (error) {
      console.error("Error fetching classes:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch classes.' });
    } else if (classData) {
      const processedClasses = classData.map(c => ({
        ...c,
        is_member: c.class_members.some(m => m.user_id === user.id)
      }));
      setClasses(processedClasses);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserAndClasses();
  }, [supabase]);

  const handleJoinClass = async (classId: string) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not logged in', description: 'You must be logged in to join a class.' });
      return;
    }

    setJoiningClass(classId);

    const { error } = await supabase.from('class_members').insert({
        class_id: classId,
        user_id: currentUser.id,
    });

    if (error) {
      console.error("Error joining class:", error);
      toast({ variant: 'destructive', title: 'Failed to Join', description: error.message });
    } else {
      toast({ title: 'Successfully Joined!', description: 'You are now a member of the class.' });
      // Refresh class list to update UI
      fetchUserAndClasses();
    }
    setJoiningClass(null);
  }

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4">
          <h1 className="text-xl font-bold">Class</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full pt-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : classes.length > 0 ? (
            classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                  <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border">
                          <AvatarFallback className="font-bold text-xl">{classItem.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                          <CardTitle>{classItem.name}</CardTitle>
                          {classItem.description && <p className="text-sm text-muted-foreground mt-1">{classItem.description}</p>}
                      </div>
                  </div>
              </CardHeader>
              <CardFooter>
                   {classItem.created_by === currentUser?.id || classItem.is_member ? (
                      <Link href={`/class/${classItem.id}`} className="w-full">
                        <Button variant="secondary" className="w-full">
                            <Video className="mr-2 h-4 w-4"/>
                            View Channel
                        </Button>
                      </Link>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleJoinClass(classItem.id)}
                      disabled={joiningClass === classItem.id}
                    >
                      {joiningClass === classItem.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Join
                    </Button>
                  )}
              </CardFooter>
            </Card>
            ))
          ) : (
             <div className="text-center p-10 text-muted-foreground flex flex-col items-center h-full justify-center">
                <BookOpen className="h-12 w-12 mb-4" />
                <p className="font-bold">There are no classes yet</p>
                <p className="text-sm mt-1">Create a new class to get started.</p>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
