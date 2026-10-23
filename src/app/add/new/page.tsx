
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Calendar, User, Banknote } from "lucide-react";

export default function NewRecordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    date: new Date().toISOString().split('T')[0],
    amount: ""
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const currentData = JSON.parse(localStorage.getItem("ledger_data") || "[]");
    const newItem = {
      id: Date.now().toString(),
      title: formData.name,
      amount: parseFloat(formData.amount),
      date: formData.date
    };
    localStorage.setItem("ledger_data", JSON.stringify([...currentData, newItem]));
    router.push("/home");
  };

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Header */}
      <header className="flex h-16 flex-shrink-0 items-center px-4 bg-deep-navy text-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="ml-2 text-lg font-bold">စာရင်းအသစ်ထည့်ရန်</h1>
      </header>

      {/* Form */}
      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold flex items-center gap-2">
                <User className="h-4 w-4" /> Name
              </Label>
              <Input 
                placeholder="အကြောင်းအရာ အမည်" 
                className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Date
              </Label>
              <Input 
                type="date"
                className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 font-bold flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Amount
              </Label>
              <Input 
                type="number"
                placeholder="ပမာဏ (Ks)" 
                className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold text-emerald-600"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-16 bg-deep-navy hover:bg-slate-800 text-xl font-bold rounded-2xl shadow-xl mt-8">
            <Save className="mr-2 h-6 w-6" /> သိမ်းဆည်းမည်
          </Button>
        </form>
      </main>
    </div>
  );
}
