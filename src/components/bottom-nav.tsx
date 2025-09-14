
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, User, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/language-context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: "/home", label: t('bottomNav.home'), icon: Home },
    { href: "/search", label: t('bottomNav.search'), icon: Search },
    { href: "/upload", label: t('bottomNav.upload'), icon: PlusSquare, isSpecial: true },
    { href: "/ai-tool", label: t('bottomNav.aiTool'), icon: Sparkles },
    { href: "/chat", label: t('bottomNav.chat'), icon: MessageCircle },
    { href: "/profile", label: t('bottomNav.profile'), icon: User },
  ];


  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/80 backdrop-blur-sm md:hidden">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item, index) => {
          // Adjust index for special button placement
          const layoutIndex = index >= 2 ? index + 1 : index;

          const isActive = item.href === "/" && pathname === "/" || item.href !== "/" && pathname.startsWith(item.href);

          if (item.isSpecial) {
            return (
              <div key={item.label} className="order-3 flex h-full items-center">
                  <Link
                    href={item.href}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
                  >
                    <item.icon className="h-7 w-7" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
              </div>
            );
          }
          return (
             <div key={item.label} className={cn("flex-1 flex justify-center items-center", 
                layoutIndex < 3 ? 'order-' + layoutIndex : 'order-' + (layoutIndex + 1))}>
                <Link
                href={item.href}
                className={cn(
                    "flex flex-col items-center gap-1 text-xs font-medium transition-colors w-14",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] text-center">{item.label}</span>
                </Link>
            </div>
          );
        })}
      </nav>
    </footer>
  );
}
