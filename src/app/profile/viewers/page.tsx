
"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Loader2, ArrowLeft, UserX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Profile } from '@/lib/data';

type ProfileViewer = {
  viewer_id: string;
  viewed_at: string;
  profiles: Profile;
};

export default function ProfileViewersPage() {
  const [viewers, setViewers] = useState<ProfileViewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchViewers = useCallback(async (user: User) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profile_views')
      .select('viewer_id, viewed_at, profiles!profile_views_viewer_id_fkey(*)')
      .eq('profile_id', user.id)
      .order('viewed_at', { ascending: false });

    if (error) {
      console.error('Error fetching profile viewers:', error);
      setViewers([]);
    } else {
      setViewers(data as unknown as ProfileViewer[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/signup');
      } else {
        setCurrentUser(user);
        fetchViewers(user);
      }
    });
  }, [supabase, router, fetchViewers]);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
        <Link href="/profile" className="p-2 -ml-2 absolute left-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold mx-auto">Profile Viewers</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : viewers.length > 0 ? (
          <div className="divide-y">
            {viewers.map((viewer) => (
              <Link href={`/profile/${viewer.viewer_id}`} key={viewer.viewer_id}>
                <div className="p-4 flex items-center gap-4 hover:bg-muted/50">
                  <Avatar className="h-12 w-12" profile={viewer.profiles} />
                  <div className="flex-1">
                    <p className="font-semibold">{viewer.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{viewer.profiles.username}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(viewer.viewed_at), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
            <UserX className="h-12 w-12 mb-4" />
            <p className="font-bold">No profile views yet</p>
            <p className="text-sm mt-1">When someone views your profile, they'll show up here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
