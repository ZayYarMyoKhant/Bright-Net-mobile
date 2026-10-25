
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, LogOut } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState({ name: "-", phone: "-", password: "-" });

  useEffect(() => {
    const info = localStorage.getItem("user_info");
    if (info) {
      setUser(JSON.parse(info));
    }
  }, []);

  const handleLogout = () => {
    // Clear login session and go to splash
    localStorage.removeItem("user_info");
    router.push("/");
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex h-16 flex-shrink-0 items-center justify-center px-4 bg-deep-navy text-white sticky top-0 z-20 shadow-md">
        <h1 className="text-xl font-bold tracking-wider">Bright-Net</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">
        <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <User className="h-5 w-5 text-deep-navy" /> အကောင့်အချက်အလက်
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Name</span>
                <span className="text-lg font-bold text-slate-700">{user.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</span>
                <span className="text-lg font-bold text-slate-700">{user.phone}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</span>
                <span className="text-lg font-bold text-slate-700">••••••••</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-rose-100 text-rose-500 hover:bg-rose-50 font-bold"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" /> အကောင့်မှထွက်ရန်
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
