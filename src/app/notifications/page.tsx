
"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { Loader2, ArrowLeft, MessageSquare, UserPlus, BellOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Profile } from '@/lib/data';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CommentSheet } from "@/components/comment-sheet";
import type { Post } from "@/lib/data";

type Notification = {
  id: string;
  actor_id: string;
  recipient_id: string;
  type: 'new_comment' | 'new_follower';
  is_read: boolean;
  target_id: string | null;
  target_post_id: number | null; // Use this for post-related notifications
  created_at: string;
  actor: Profile;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [postForCommentSheet, setPostForCommentSheet] = useState<Post | null>(null);
  const [openCommentSheet, setOpenCommentSheet] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchNotifications = useCallback(async (user: User) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(*)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } else {
      setNotifications(data as unknown as Notification[]);
    }
    setLoading(false);
  }, [supabase]);

  const markAsRead = useCallback(async (user: User) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/signup');
      } else {
        setCurrentUser(user);
        fetchNotifications(user);
        markAsRead(user); 
      }
    });
  }, [supabase, router, fetchNotifications, markAsRead]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`notifications_for_${currentUser.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${currentUser.id}`,
      }, (payload) => {
        fetchNotifications(currentUser);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase, fetchNotifications]);
  
  const handleNotificationClick = async (notification: Notification) => {
     if (notification.type === 'new_comment' && notification.target_post_id) {
        const postId = notification.target_post_id;
        
        const { data: postData, error } = await supabase
            .from('posts')
            .select('*, profiles!posts_user_id_fkey(*), likes:post_likes(count), comments:post_comments(count)')
            .eq('id', postId)
            .single();

        if (error || !postData) {
            console.error("Post for comment not found");
            router.push(`/post/${postId}`);
            return;
        }
        
         const { data: userLike } = currentUser ? await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUser.id)
          .eq('post_id', postData.id)
          .single() : { data: null };

        const formattedPost: Post = {
            id: postData.id,
            // @ts-ignore
            user: postData.profiles,
            media_url: postData.media_url,
            media_type: postData.media_type,
            caption: postData.caption,
            created_at: postData.created_at,
            // @ts-ignore
            likes: postData.likes[0]?.count || 0,
            // @ts-ignore
            comments: postData.comments[0]?.count || 0,
            isLiked: !!userLike,
        };
        
        setPostForCommentSheet(formattedPost);
        setOpenCommentSheet(true);

     } else if (notification.type === 'new_follower') {
        router.push('/profile/friend-request');
     }
  };


  const renderNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'new_comment':
        return <>commented on your post.</>;
      case 'new_follower':
        return <>started following you.</>;
      default:
        return 'sent you a notification.';
    }
  };
  
   const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'new_comment':
            return <MessageSquare className="h-5 w-5 text-white" />;
        case 'new_follower':
            return <UserPlus className="h-5 w-5 text-white" />;
        default:
            return <BellOff className="h-5 w-5 text-white" />;
    }
  };
  
  const getIconBgColor = (type: Notification['type']) => {
    switch (type) {
        case 'new_comment':
            return 'bg-blue-500';
        case 'new_follower':
            return 'bg-green-500';
        default:
            return 'bg-gray-500';
    }
  };

  return (
    <Sheet open={openCommentSheet} onOpenChange={setOpenCommentSheet}>
        <div className="flex h-dvh flex-col bg-background text-foreground">
        <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
            <Link href="/chat" className="p-2 -ml-2 absolute left-4">
            <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold mx-auto">Notifications</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
            {loading ? (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            ) : notifications.length > 0 ? (
            <div className="divide-y">
                {notifications.map((noti) => (
                <button
                    key={noti.id}
                    onClick={() => handleNotificationClick(noti)}
                    className="w-full text-left p-4 flex items-center gap-4 hover:bg-muted/50"
                >
                    <div className="relative">
                        <Avatar className="h-12 w-12" profile={noti.actor} />
                         <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center ${getIconBgColor(noti.type)}`}>
                            {getNotificationIcon(noti.type)}
                        </div>
                    </div>
                    <div className="flex-1">
                    <p className="text-sm">
                        <span className="font-bold">{noti.actor.full_name}</span>{' '}
                        {renderNotificationText(noti)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(noti.created_at), { addSuffix: true })}
                    </p>
                    </div>
                    {!noti.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                </button>
                ))}
            </div>
            ) : (
            <div className="text-center p-10 text-muted-foreground flex flex-col items-center pt-20">
                <BellOff className="h-12 w-12 mb-4" />
                <p className="font-bold">No notifications yet</p>
                <p className="text-sm mt-1">When you get notifications, they'll show up here.</p>
            </div>
            )}
        </main>
        </div>
         <SheetContent side="bottom" className="h-[75dvh] flex flex-col p-0">
            {postForCommentSheet && currentUser && <CommentSheet post={postForCommentSheet} currentUser={currentUser} />}
        </SheetContent>
    </Sheet>
  );
}
