
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, School as SchoolIcon, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SchoolSetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate creation
        setTimeout(() => {
            router.push('/');
        }, 1500);
    };

    return (
        <div className="flex h-dvh flex-col bg-white">
            <header className="p-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </header>
            <main className="flex-1 p-6 flex flex-col items-center max-w-sm mx-auto w-full">
                <div className="bg-blue-50 p-4 rounded-2xl mb-6">
                    <SchoolIcon className="h-12 w-12 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">ကျောင်းအသစ်ဖွင့်ရန်</h1>
                <p className="text-slate-500 text-sm text-center mb-8">ကျောင်း၏ အချက်အလက်များကို ဖြည့်သွင်းပြီး စနစ်ကို စတင်အသုံးပြုပါ။</p>

                <form onSubmit={handleCreate} className="w-full space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="schoolName">ကျောင်းအမည် *</Label>
                        <Input id="schoolName" placeholder="ဥပမာ - အထက (၁) အင်းစိန်" required className="h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="principalName">ကျောင်းအုပ် အမည်</Label>
                        <Input id="principalName" placeholder="အမည် ဖြည့်စွက်ပါ" className="h-12" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="location">တည်နေရာ / မြို့နယ်</Label>
                        <Input id="location" placeholder="ရန်ကုန်မြို့၊ အင်းစိန်" className="h-12" />
                    </div>

                    <Button type="submit" className="w-full h-12 bg-blue-600 text-lg font-bold mt-4" disabled={loading}>
                        {loading ? "ဆောင်ရွက်နေပါသည်..." : "ကျောင်းတည်ဆောက်မည်"}
                    </Button>
                </form>
            </main>
        </div>
    );
}
