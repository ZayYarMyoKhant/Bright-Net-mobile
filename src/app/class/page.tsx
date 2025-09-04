
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

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  link: string | null; // Assuming link might be added later
  created_by: string;
};

export default function ClassPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndClasses = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: classData, error } = await supabase
        .from('classes')
        .select('*');

      if (error) {
        console.error("Error fetching classes:", error);
      } else if (classData) {
        setClasses(classData.map(c => ({...c, link: 'https://example.com/class1'})));
      }
      setLoading(false);
    };

    fetchUserAndClasses();
  }, [supabase]);


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
                          {classItem.link && (
                            <a href={classItem.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                                <ExternalLink className="h-3 w-3" />
                                {classItem.link}
                            </a>
                          )}
                      </div>
                  </div>
              </CardHeader>
              <CardFooter>
                   {classItem.created_by !== currentUser?.id ? (
                      <Button className="w-full">Join</Button>
                  ) : (
                    <Link href={`/class/${classItem.id}`} className="w-full">
                      <Button variant="secondary" className="w-full">
                          <Video className="mr-2 h-4 w-4"/>
                          View Channel
                      </Button>
                    </Link>
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
