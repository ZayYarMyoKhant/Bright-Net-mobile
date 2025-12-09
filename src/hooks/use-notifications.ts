
"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const supabase = createClient();

  const fetchUnreadCount = useCallback(async (user: User) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error fetching unread notification count:', error);
      setUnreadCount(0);
    } else {
      setUnreadCount(count || 0);
    }
  }, [supabase]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null;
        setCurrentUser(user);
        if (user) {
            fetchUnreadCount(user);
        } else {
            setUnreadCount(0);
        }
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
        if(user) {
            setCurrentUser(user);
            fetchUnreadCount(user);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [supabase.auth, fetchUnreadCount]);


  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`notifications-count-for-${currentUser.id}`)
      .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${currentUser.id}`,
        },
        (payload) => {
          // Re-fetch count on any change to the user's notifications
          fetchUnreadCount(currentUser);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase, fetchUnreadCount]);

  return { unreadCount };
}
