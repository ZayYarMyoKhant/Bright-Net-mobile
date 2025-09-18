
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

// Define the type for a class, mirroring the DB structure
type Class = {
  id: string;
  name: string;
  creator_id: string;
  avatar_url: string;
};

export default function ClassPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserAndClasses = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      router.push('/signup');
      setLoading(false);
      return;
    }
    setCurrentUser(user);

    // Fetch the class IDs the user is a member of
    const { data: memberEntries, error: memberError } = await supabase
      .from('class_members')
      .select('class_id')
      .eq('user_id', user.id);

    if (memberError) {
      console.error("Error fetching user's classes:", memberError);
      toast({ variant: 'destructive', title: "Error loading your classes", description: memberError.message });
      setLoading(false);
      return;
    }
    
    const classIds = memberEntries.map(entry => entry.class_id);

    if (classIds.length > 0) {
      // Fetch the details of those classes
      const { data: classDetails, error: classError } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds);
      
      if (classError) {
          console.error("Error fetching class details:", classError);
          toast({ variant: 'destructive', title: "Error loading class details", description: classError.message });
      } else {
          setClasses(classDetails as Class[]);
      }
    } else {
      setClasses([]);
    }

    setLoading(false);
  }, [supabase, router, toast]);

  useEffect(() => {
    fetchUserAndClasses();
    
    // Set up a real-time subscription
    const channel = supabase.channel('class-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_members' }, (payload) => {
        // Re-fetch classes when membership changes
        console.log('Class membership changed, refetching...');
        fetchUserAndClasses();
      })
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };

  }, [fetchUserAndClasses]);

  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4">
          <h1 className="text-xl font-bold">Class</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
           {loading ? (
             <div className="flex items-center justify-center h-full pt-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
           ) : classes.length > 0 ? (
             <div className="divide-y">
                {classes.map((cls) => (
                    <Link href={`/class/${cls.id}`} key={cls.id}>
                        <div className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer">
                            <Avatar className="h-14 w-14 rounded-md">
                                <AvatarImage src={cls.avatar_url} />
                                <AvatarFallback>
                                    <GraduationCap/>
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold text-primary">{cls.name}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <Button variant="outline" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black border-none pointer-events-none">
                                    View
                                </Button>
                            </div>
                        </div>
                    </Link>
                ))}
             </div>
           ) : (
             <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                <GraduationCap className="h-12 w-12 mb-4" />
                <p className="font-bold">No Classes Available</p>
                <p className="text-sm mt-1">Join or create a class to get started!</p>
            </div>
           )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
