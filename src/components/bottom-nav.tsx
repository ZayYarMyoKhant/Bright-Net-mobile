
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, User, MessageCircle, Heart, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/language-context";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [hasUnread, setHasUnread] = useState(false);
  const supabase = createClient();

  const checkUnreadMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setHasUnread(false);
      return;
    }

    const { data: userConvoIds, error: convoIdError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (convoIdError || !userConvoIds || userConvoIds.length === 0) {
      setHasUnread(false);
      return;
    }
    const conversationIds = userConvoIds.map(c => c.conversation_id);
    
    const { data: unreadMessages, error: unreadError } = await supabase
      .from('direct_messages')
      .select('id')
      .in('conversation_id', conversationIds)
      .neq('sender_id', user.id);
      
    if (unreadError || !unreadMessages || unreadMessages.length === 0) {
        setHasUnread(false);
        return;
    }
    
    const unreadMessageIds = unreadMessages.map(m => m.id);
    const { data: readStatuses, error: readStatusError } = await supabase
      .from('direct_message_read_status')
      .select('message_id')
      .eq('user_id', user.id)
      .in('message_id', unreadMessageIds);
      
    if(readStatusError){
        setHasUnread(false);
        return;
    }

    const readMessageIds = new Set(readStatuses.map(s => s.message_id));
    const finalUnreadCount = unreadMessageIds.filter(id => !readMessageIds.has(id)).length;
    
    setHasUnread(finalUnreadCount > 0);

  }, [supabase]);


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
             checkUnreadMessages();
        } else if (event === 'SIGNED_OUT') {
            setHasUnread(false);
        }
    });

    checkUnreadMessages(); // Initial check

    const channel = supabase.channel('public:direct_messages:bottom-nav-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, 
        () => checkUnreadMessages()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_message_read_status' }, 
        () => checkUnreadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, [supabase, checkUnreadMessages]);

  const navItems = [
    { href: "/home", label: t('bottomNav.home'), icon: Home },
    { href: "/search", label: t('bottomNav.search'), icon: Search },
    { href: "/bliss-zone", label: 'Bliss Zone', icon: Heart },
    { href: "/upload", label: 'Create', icon: PlusSquare, isSpecial: true },
    { href: "/class", label: 'Class', icon: BookOpen },
    { href: "/chat", label: t('bottomNav.chat'), icon: MessageCircle, notification: hasUnread },
    { href: "/profile", label: t('bottomNav.profile'), icon: User },
  ];

  const specialButtonIndex = navItems.findIndex(item => item.isSpecial);
  
  const allRegularItems = navItems.filter(item => !item.isSpecial);
  const specialItem = navItems[specialButtonIndex];
  
  const midPoint = Math.floor(allRegularItems.length / 2);
  const leftItems = allRegularItems.slice(0, midPoint);
  const rightItems = allRegularItems.slice(midPoint);


  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/80 backdrop-blur-sm md:hidden">
      <nav className="flex h-14 items-center justify-around">
        {leftItems.map((item) => {
          const isActive = (item.href === "/home" && pathname === "/home") || (item.href !== "/home" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                  "relative flex flex-col items-center gap-1 text-xs font-medium transition-colors w-14",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] text-center">{item.label}</span>
              {item.notification && <div className="absolute top-0.5 right-3 h-2 w-2 rounded-full bg-primary" />}
            </Link>
          );
        })}

        {specialItem && (
             <div key={specialItem.label} className="flex-shrink-0 mx-1">
                  <Link
                    href={specialItem.href}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
                  >
                    <specialItem.icon className="h-6 w-6" />
                    <span className="sr-only">{specialItem.label}</span>
                  </Link>
              </div>
        )}

        {rightItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
             return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                      "relative flex flex-col items-center gap-1 text-xs font-medium transition-colors w-14",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] text-center">{item.label}</span>
                  {item.notification && <div className="absolute top-0.5 right-3 h-2 w-2 rounded-full bg-primary" />}
                </Link>
          );
        })}
      </nav>
    </footer>
  );
}
