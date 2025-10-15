
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, User, MessageCircle, Heart, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/language-context";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [hasUnread, setHasUnread] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUnreadMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_conversations');
      
      if (!error && data) {
          const totalUnread = data.reduce((acc: number, convo: any) => acc + convo.unread_count, 0);
          setHasUnread(totalUnread > 0);
      }
    };

    checkUnreadMessages();

    const channel = supabase.channel('public:direct_messages:bottom-nav')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        checkUnreadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const navItems = [
    { href: "/home", label: t('bottomNav.home'), icon: Home },
    { href: "/search", label: t('bottomNav.search'), icon: Search },
    { href: "/bliss-zone", label: t('bottomNav.blissZone'), icon: Heart },
    { href: "/upload", label: t('bottomNav.upload'), icon: PlusSquare, isSpecial: true },
    { href: "/class", label: t('bottomNav.class'), icon: GraduationCap },
    { href: "/chat", label: t('bottomNav.chat'), icon: MessageCircle, notification: hasUnread },
    { href: "/profile", label: t('bottomNav.profile'), icon: User },
  ];

  const specialButtonIndex = navItems.findIndex(item => item.isSpecial);
  const leftItems = navItems.slice(0, specialButtonIndex);
  const specialItem = navItems[specialButtonIndex];
  const rightItems = navItems.slice(specialButtonIndex + 1);


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
