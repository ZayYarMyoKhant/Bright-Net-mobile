
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, School as SchoolIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SchoolSetupPage() {
    const router = useRouter();
    const supabase = createClient();
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
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('rc_schools')
                .insert({
                    name: formData.schoolName,
                    principal_name: formData.principalName,
                    location: formData.location,
                    phone: formData.phone
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase error:", error);
                toast({
                    variant: "destructive",
                    title: "ကျောင်းတည်ဆောက်မှု မအောင်မြင်ပါ",
                    description: error.message || "Database connection error ရှိနေပါသည်။"
                });
            } else if (data) {
                // Save to local storage for persistence
                localStorage.setItem("rc_school_id", data.id);
                toast({
                    title: "အောင်မြင်ပါသည်",
                    description: "ကျောင်းအသစ်ကို အောင်မြင်စွာ တည်ဆောက်ပြီးပါပြီ။"
                });
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            console.error("Execution error:", err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "စနစ်ချို့ယွင်းချက် ဖြစ်ပေါ်နေပါသည်။"
            });
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
