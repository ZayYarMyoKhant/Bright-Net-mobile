
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, User, BookOpen, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/language-context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: "/", label: t('bottomNav.home'), icon: Home },
    { href: "/search", label: t('bottomNav.search'), icon: Search },
    { href: "/ai-tool", label: t('bottomNav.aiTool'), icon: Sparkles },
    { href: "/upload", label: t('bottomNav.upload'), icon: PlusSquare, isSpecial: true },
    { href: "/class", label: t('bottomNav.class'), icon: BookOpen },
    { href: "/chat", label: t('bottomNav.chat'), icon: MessageCircle },
    { href: "/profile", label: t('bottomNav.profile'), icon: User },
  ];


  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/80 backdrop-blur-sm md:hidden">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
          if (item.isSpecial) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
              >
                <item.icon className="h-7 w-7" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs font-medium transition-colors w-14",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] text-center">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
