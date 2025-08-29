"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, User, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./icons";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Discover", icon: Search },
  { href: "/upload", label: "Upload", icon: PlusSquare, isSpecial: true },
  { href: "/subscriptions", label: "Subscriptions", icon: Clapperboard },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

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
                className="flex h-10 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
              >
                <item.icon className="h-6 w-6" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
