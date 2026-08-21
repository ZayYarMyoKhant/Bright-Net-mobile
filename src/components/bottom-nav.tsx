"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ClipboardCheck, Settings, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: 'Roll Call', icon: ClipboardCheck },
    { href: "/students", label: 'Students', icon: Users },
    { href: "/settings", label: 'Settings', icon: Settings },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-white md:hidden">
      <nav className="flex h-14 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                  "relative flex flex-col items-center gap-1 text-xs font-medium transition-colors w-20",
                  isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
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