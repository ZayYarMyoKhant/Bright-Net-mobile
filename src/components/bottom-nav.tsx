
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: 'Dashboard', icon: LayoutDashboard },
    { href: "/classes", label: 'My Classes', icon: BookOpen },
    { href: "/reports", label: 'Reports', icon: ClipboardCheck },
    { href: "/settings", label: 'Settings', icon: Settings },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-white md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <nav className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                  "relative flex flex-col items-center gap-1 transition-all duration-300 py-2 rounded-xl w-16",
                  isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "scale-110")} />
              <span className="text-[9px] font-bold text-center tracking-tight">{item.label}</span>
              {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
