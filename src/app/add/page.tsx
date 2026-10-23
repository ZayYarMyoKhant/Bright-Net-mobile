
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PenLine, ArrowRight } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useRouter } from "next/navigation";

export default function AddLandingPage() {
  const router = useRouter();

  return (
    <div className="flex h-dvh flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex h-16 flex-shrink-0 items-center justify-center px-4 bg-deep-navy text-white sticky top-0 z-20 shadow-md">
        <h1 className="text-xl font-bold tracking-wider">Bright-Net</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card 
          className="w-full max-w-sm border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden active:scale-95 transition-all cursor-pointer relative group"
          onClick={() => router.push("/add/new")}
        >
          {/* Feather Pen Icon Decoration */}
          <div className="absolute top-4 right-4 text-blue-100 group-hover:text-blue-200 transition-colors">
            <PenLine className="h-20 w-20 rotate-12" />
          </div>

          <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="bg-deep-navy w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-100">
              <PenLine className="h-10 w-10 text-white" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800">စာရင်းမှတ်ပါ</h2>
              <p className="text-slate-400 text-sm font-medium">အချက်အလက်အသစ်များကို ဤနေရာတွင် မှတ်သားနိုင်ပါသည်။</p>
            </div>

            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-deep-navy group-hover:bg-deep-navy group-hover:text-white transition-all">
              <ArrowRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
