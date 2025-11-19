
"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { Card, CardHeader } from '@/components/ui/card';
import { Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';

type ClassSummary = {
  id: string;
  name: string;
};

export default function ClassListPage() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('id, name');

    if (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    } else {
      setClasses(data as ClassSummary[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4">
          <h1 className="text-xl font-bold">Explore Classes</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-20">
              <BookOpen className="h-16 w-16" />
              <h2 className="mt-4 text-lg font-semibold">No Classes Available</h2>
              <p className="mt-1 text-sm">Check back later for new classes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <Link href={`/class/${cls.id}`} key={cls.id}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-24 flex items-center">
                     <CardHeader>
                        <p className="font-bold truncate">{cls.name}</p>
                     </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </>
  );
}

    