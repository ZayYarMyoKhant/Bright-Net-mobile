
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MoreVertical, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { useRouter } from "next/navigation";

type LedgerItem = {
  id: string;
  title: string;
  amount: number;
  date: string;
};

export default function LedgerHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<LedgerItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ledger_data");
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-dvh flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex h-16 flex-shrink-0 items-center justify-between px-4 bg-deep-navy text-white sticky top-0 z-20 shadow-md">
        <h1 className="text-xl font-bold tracking-wider">Bright-Net</h1>
        <div className="relative w-40 md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="ရှာဖွေပါ..." 
            className="h-9 pl-9 bg-white/10 border-none text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-400 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-slate-400">
            <p className="font-bold">စာရင်းမှတ်တမ်း မရှိသေးပါ။</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              onClick={() => router.push(`/ledger/${item.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{item.title}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-emerald-600">
                    {item.amount.toLocaleString()} <span className="text-xs">Ks</span>
                  </p>
                  <button className="text-slate-300">
                    <MoreVertical className="h-4 w-4 ml-auto" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Total Bar and Nav Area */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="mx-4 mb-2">
            <div className="bg-deep-navy text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-blue-900/50">
                <div className="flex flex-col">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">စုစုပေါင်း အရေအတွက်</span>
                    <span className="text-xl font-black">{items.length} <span className="text-sm font-normal opacity-70">ခု</span></span>
                </div>
                <div className="h-10 w-[1px] bg-blue-800" />
                <div className="flex flex-col text-right">
                    <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">စုစုပေါင်း လက်ကျန်ငွေ</span>
                    <span className="text-xl font-black text-blue-400">{totalAmount.toLocaleString()} <span className="text-sm font-normal text-white opacity-70">Ks</span></span>
                </div>
            </div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
