
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, School as SchoolIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createSchoolAction } from "@/lib/school-actions";

export default function SchoolSetupPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        schoolName: "",
        principalName: "",
        location: "",
        phone: ""
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.schoolName) {
            toast({ variant: "destructive", title: "ကျောင်းအမည် လိုအပ်ပါသည်" });
            return;
        }

        setLoading(true);

        try {
            const result = await createSchoolAction(formData);

            if (result.success && result.data) {
                // Save to local storage for persistence
                localStorage.setItem("rc_school_id", result.data.id);
                toast({
                    title: "အောင်မြင်ပါသည်",
                    description: "ကျောင်းအသစ်ကို အောင်မြင်စွာ တည်ဆောက်ပြီးပါပြီ။"
                });
                
                router.push('/');
            } else {
                alert("Error: " + result.error);
                toast({
                    variant: "destructive",
                    title: "ကျောင်းတည်ဆောက်မှု မအောင်မြင်ပါ",
                    description: result.error
                });
            }
        } catch (err: any) {
            alert("စနစ်ချို့ယွင်းချက်ဖြစ်ပေါ်ပါသည်- " + (err.message || "Unknown Error"));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    return (
        <div className="flex h-dvh flex-col bg-white">
            <header className="p-4 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </header>
            <main className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col items-center max-w-sm mx-auto w-full pb-10">
                    <div className="bg-blue-50 p-4 rounded-2xl mb-6">
                        <SchoolIcon className="h-12 w-12 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">ကျောင်းအသစ်ဖွင့်ရန်</h1>
                    <p className="text-slate-500 text-sm text-center mb-8">ကျောင်း၏ အချက်အလက်များကို ဖြည့်သွင်းပြီး Roll Call စနစ်ကို စတင်အသုံးပြုပါ။</p>

                    <form onSubmit={handleCreate} className="w-full space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="schoolName" className="font-bold text-slate-700">ကျောင်းအမည် *</Label>
                            <Input 
                                id="schoolName" 
                                placeholder="ဥပမာ - အထက (၁) အင်းစိန်" 
                                required 
                                className="h-12 border-slate-200"
                                value={formData.schoolName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="principalName" className="font-bold text-slate-700">ကျောင်းအုပ် အမည်</Label>
                            <Input 
                                id="principalName" 
                                placeholder="အမည် ဖြည့်စွက်ပါ" 
                                className="h-12 border-slate-200"
                                value={formData.principalName}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="font-bold text-slate-700">တည်နေရာ / မြို့နယ်</Label>
                            <Input 
                                id="location" 
                                placeholder="ရန်ကုန်မြို့၊ အင်းစိန်" 
                                className="h-12 border-slate-200"
                                value={formData.location}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="font-bold text-slate-700">ဆက်သွယ်ရန် ဖုန်းနံပါတ်</Label>
                            <Input 
                                id="phone" 
                                type="tel" 
                                placeholder="၀၉xxxxxxxxx" 
                                className="h-12 border-slate-200"
                                value={formData.phone}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-bold mt-4 shadow-lg shadow-blue-100" disabled={loading}>
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            {loading ? "ဆောင်ရွက်နေပါသည်..." : "ကျောင်းတည်ဆောက်မည်"}
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
}
