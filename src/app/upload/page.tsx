
"use client";

import { BottomNav } from "@/components/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { AdBanner } from "@/components/ad-banner";

export default function CreatePage() {
  return (
    <>
      <div className="flex h-dvh flex-col bg-background text-foreground pb-16">
        <header className="flex h-16 flex-shrink-0 items-center justify-center border-b px-4 text-center">
          <h1 className="text-xl font-bold">Let's Create</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <Link href="/upload/customize">
            <Card className="w-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
              <CardHeader>
                <CardTitle className="text-lg">Create Post</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center h-24">
                  <PlusCircle className="h-12 w-12 text-primary-foreground/70" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/upload/class">
            <Card className="w-full cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <CardHeader>
                <CardTitle className="text-lg">Create Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center h-24">
                  <BookOpen className="h-12 w-12 text-secondary-foreground/70" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <div className="pt-4">
            <AdBanner />
          </div>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
