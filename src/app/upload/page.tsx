
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
        <header className="flex h-16 flex-shrink-0 items-center justify-center bg-primary text-primary-foreground px-4 text-center">
          <h1 className="text-xl font-bold">Let's Create</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          <Link href="/upload/customize">
            <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow border-2 border-primary/50 hover:border-primary">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <PlusCircle className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle className="text-lg">Create a New Post</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Share a photo or video with your friends.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </Link>

          <AdBanner />

          <Link href="/upload/class">
            <Card className="w-full cursor-pointer hover:shadow-lg transition-shadow border-2 border-primary/50 hover:border-primary">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <BookOpen className="h-10 w-10 text-primary" />
                    <div>
                        <CardTitle className="text-lg">Create a New Class</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Start a community and share knowledge.</p>
                    </div>
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
