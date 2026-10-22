"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Lock, Save } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: ""
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // For prototype purposes, we'll just navigate to home
    router.push("/home");
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-sm shadow-xl rounded-[2rem] border-none overflow-hidden">
        <CardHeader className="bg-deep-navy text-white text-center pb-8 pt-8">
          <CardTitle className="text-2xl font-bold">အကောင့်သစ်ဖွင့်ရန်</CardTitle>
          <p className="text-blue-200 text-sm mt-2">စာရင်းများမှတ်သားရန် အချက်အလက်ဖြည့်ပါ</p>
        </CardHeader>
        <CardContent className="p-8 space-y-6 bg-white">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold flex items-center gap-2">
                <User className="h-4 w-4" /> အမည်
              </Label>
              <Input 
                placeholder="နာမည်ရိုက်ထည့်ပါ" 
                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 font-bold flex items-center gap-2">
                <Phone className="h-4 w-4" /> ဖုန်းနံပါတ်
              </Label>
              <Input 
                type="tel"
                placeholder="၀၉xxxxxxxxx" 
                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 font-bold flex items-center gap-2">
                <Lock className="h-4 w-4" /> စကားဝှက်
              </Label>
              <Input 
                type="password"
                placeholder="စကားဝှက်ရိုက်ထည့်ပါ" 
                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <Button type="submit" className="w-full h-14 bg-deep-navy hover:bg-slate-800 text-lg font-bold rounded-2xl shadow-lg mt-4">
              <Save className="mr-2 h-5 w-5" /> သိမ်းဆည်းမည်
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}