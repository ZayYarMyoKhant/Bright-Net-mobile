
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function CreatePage() {
  return (
    <>
      <div className="flex h-full flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 text-center">
          <h1 className="text-xl font-bold">Let's Create</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <Link href="/upload/post">
            <Card className="w-full cursor-pointer hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Create post</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center h-24">
                  <PlusCircle className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
