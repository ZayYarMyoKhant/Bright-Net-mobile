
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/language-context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: "/home", label: t('bottomNav.home'), icon: Home },
    { href: "/search", label: t('bottomNav.search'), icon: Search },
    { href: "/upload", label: 'Create', icon: PlusSquare, isSpecial: true },
    { href: "/bliss-zone", label: 'Bliss Zone', icon: Sparkles },
    { href: "/profile", label: t('bottomNav.profile'), icon: User },
  ];

  const specialItem = navItems.find(item => item.isSpecial);
  const regularItems = navItems.filter(item => !item.isSpecial);
  
  const leftItems = regularItems.slice(0, 2); // Home, Search
  const rightItems = regularItems.slice(2);   // Bliss Zone, Profile

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
                </Link>
          );
        })}
      </nav>
    </footer>
  );
}
