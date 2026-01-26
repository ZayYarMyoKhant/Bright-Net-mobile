"use client";

import { BottomNav } from "@/components/bottom-nav";
import { BookOpen } from "lucide-react";

export default function ClassListPage() {

  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4">
          <h1 className="text-xl font-bold">Classes</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground pt-20">
            <BookOpen className="h-16 w-16" />
            <h2 className="mt-4 text-lg font-semibold">Feature Removed</h2>
            <p className="mt-1 text-sm">This feature is currently not available.</p>
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
