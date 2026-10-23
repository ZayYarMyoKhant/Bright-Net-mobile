
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Trash2, TrendingUp, TrendingDown, Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type LedgerItem = {
  id: string;
  title: string;
  amount: number;
  date: string;
};

export default function LedgerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<LedgerItem | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [subAmount, setSubAmount] = useState("");

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("ledger_data") || "[]");
    const found = data.find((i: LedgerItem) => i.id === params.id);
    if (found) {
      setItem(found);
    } else {
      router.push("/home");
    }
  }, [params.id, router]);

  const handleUpdate = () => {
    if (!item) return;
    const data = JSON.parse(localStorage.getItem("ledger_data") || "[]");
    const updatedAmount = item.amount + (parseFloat(addAmount) || 0) - (parseFloat(subAmount) || 0);
    
    const updatedData = data.map((i: LedgerItem) => 
      i.id === item.id ? { ...i, amount: updatedAmount } : i
    );
    
    localStorage.setItem("ledger_data", JSON.stringify(updatedData));
    router.push("/home");
  };

  const handleDelete = () => {
    if (!item) return;
    const data = JSON.parse(localStorage.getItem("ledger_data") || "[]");
    const updatedData = data.filter((i: LedgerItem) => i.id !== item.id);
    localStorage.setItem("ledger_data", JSON.stringify(updatedData));
    router.push("/home");
  };

  if (!item) return null;

  return (
    <div className="flex h-dvh flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex h-16 flex-shrink-0 items-center px-4 bg-deep-navy text-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="ml-2 text-lg font-bold">စာရင်းအသေးစိတ်</h1>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto pb-12">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-3 text-slate-400">
                <User className="h-4 w-4" /> <span className="text-sm font-bold uppercase tracking-widest">Name</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800">{item.title}</h2>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Banknote className="h-3 w-3" /> <span className="text-[10px] font-bold uppercase">Current Amount</span>
                    </div>
                    <p className="text-xl font-black text-emerald-600">{item.amount.toLocaleString()} Ks</p>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="h-3 w-3" /> <span className="text-[10px] font-bold uppercase">Date</span>
                    </div>
                    <p className="text-sm font-bold text-slate-600">{item.date}</p>
                </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-emerald-600 font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> ထပ်ပေါင်းထည့်ပါ
              </Label>
              <Input 
                type="number"
                placeholder="0 Ks" 
                className="h-14 rounded-2xl bg-white border-none shadow-sm text-lg font-bold"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-rose-600 font-bold flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> ပြန်လည်နုတ်ယူပါ
              </Label>
              <Input 
                type="number"
                placeholder="0 Ks" 
                className="h-14 rounded-2xl bg-white border-none shadow-sm text-lg font-bold"
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
              />
            </div>
        </div>

        <div className="pt-6 space-y-4">
            <Button onClick={handleUpdate} className="w-full h-16 bg-deep-navy hover:bg-slate-800 text-xl font-bold rounded-2xl shadow-xl">
                <Save className="mr-2 h-6 w-6" /> သိမ်းဆည်းမည်
            </Button>

            <Button onClick={handleDelete} variant="ghost" className="w-full h-14 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold">
                <Trash2 className="mr-2 h-5 w-5" /> စာရင်းဖျက်သိမ်းပါ
            </Button>
        </div>
      </main>
    </div>
  );
}

import { Banknote } from "lucide-react";
