"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", label: 'Home', icon: Home },
    { href: "#", label: 'Add', icon: Plus, isSpecial: true },
    { href: "/profile", label: 'Account', icon: User },
  ];

  return (
    <footer className="h-16 bg-white border-t flex items-center justify-around px-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.isSpecial) {
          return (
            <button
              key={item.label}
              className="h-12 w-12 bg-deep-navy text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 active:scale-90 transition-all -mt-4 border-4 border-slate-50"
            >
              <item.icon className="h-7 w-7" />
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-deep-navy" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <item.icon className={cn("h-6 w-6", isActive && "scale-110")} />
            <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </footer>
  );
}