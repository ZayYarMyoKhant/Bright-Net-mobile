"use client";

import { BottomNav } from "@/components/bottom-nav";
import { MessageSquarePlus } from "lucide-react";

export default function ChatListPage() {

  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4 relative">
          <h1 className="text-xl font-bold">Chats</h1>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-20">
            <MessageSquarePlus className="h-16 w-16" />
            <h2 className="mt-4 text-lg font-semibold">Feature Removed</h2>
            <p className="mt-1 text-sm">This feature is currently not available.</p>
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
