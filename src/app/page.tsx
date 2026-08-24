
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, ClipboardCheck, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchSchoolById } from "@/lib/school-actions";

type ClassData = {
    id: string;
    name: string;
    periods: string;
};

export default function RootPage() {
    const router = useRouter();
    const supabase = createClient();
    
    const [loading, setLoading] = useState(true);
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [schoolName, setSchoolName] = useState("");
    
    const [isCreating, setIsCreating] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newPeriods, setNewPeriods] = useState("8");
    const [isSavingClass, setIsSavingClass] = useState(false);
    
    const [classes, setClasses] = useState<ClassData[]>([]);

    useEffect(() => {
        const checkExistingSchool = async () => {
            const savedSchoolId = localStorage.getItem("rc_school_id");
            if (savedSchoolId) {
                // Use Server Action to check school to avoid client-side fetch issues
                const data = await fetchSchoolById(savedSchoolId);
                
                if (data) {
                    setSchoolId(savedSchoolId);
                    setSchoolName(data.name);
                    fetchClasses(savedSchoolId);
                } else {
                    localStorage.removeItem("rc_school_id");
                }
            }
            setLoading(false);
        };
        checkExistingSchool();
    }, []);

    const fetchClasses = async (id: string) => {
        const { data, error } = await supabase
            .from('rc_classes')
            .select('*')
            .eq('school_id', id)
            .order('created_at', { ascending: false });
        
        if (data && !error) {
            setClasses(data.map(c => ({
                id: c.id,
                name: c.name,
                periods: c.periods.toString()
            })));
        }
    };

    const handleAddClass = async () => {
        if (!newClassName || !schoolId) return;
        setIsSavingClass(true);

        const { data, error } = await supabase
            .from('rc_classes')
            .insert({
                school_id: schoolId,
                name: newClassName,
                periods: parseInt(newPeriods)
            })
            .select()
            .single();

        if (data && !error) {
            setClasses([{
                id: data.id,
                name: data.name,
                periods: data.periods.toString()
            }, ...classes]);
            setNewClassName("");
            setNewPeriods("8");
            setIsCreating(false);
        }
        setIsSavingClass(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("rc_school_id");
        setSchoolId(null);
        setSchoolName("");
        setClasses([]);
    };

    if (loading) {
        return (
            <div className="flex h-dvh items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!schoolId) {
        return (
            <div className="flex h-dvh flex-col bg-slate-50 p-6 items-center justify-center text-center">
                <div className="bg-blue-50 p-6 rounded-3xl mb-6">
                    <ClipboardCheck className="h-16 w-16 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Roll Call System</h1>
                <p className="text-slate-600 mb-10 max-w-xs text-sm leading-relaxed">
                    ကျောင်းအုပ်အနေဖြင့် ကျောင်းအသစ်တည်ဆောက်ပါ သို့မဟုတ် ဆရာအနေဖြင့် ရှိပြီးသားကျောင်းသို့ ဝင်ရောက်ပါ။
                </p>
                <div className="grid w-full gap-4 max-w-sm">
                    <Link href="/school/setup" className="w-full">
                        <Button className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 font-bold rounded-2xl shadow-lg shadow-blue-100">
                            <Plus className="mr-2 h-5 w-5" /> ကျောင်းအသစ်ဖွင့်မည်
                        </Button>
                    </Link>
                    <Link href="/school/join" className="w-full">
                        <Button variant="outline" className="w-full h-14 text-lg border-blue-600 text-blue-600 font-bold rounded-2xl">
                             ကျောင်းသို့ဝင်မည်
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col bg-white overflow-hidden">
            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="flex-shrink-0">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <h1 className="text-lg font-bold text-slate-900 truncate">
                        {schoolName} အတွက် အတန်းများ
                    </h1>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 text-center">အတန်းများ ဖန်တီးပါ</h2>
                        {!isCreating ? (
                            <Card 
                                onClick={() => setIsCreating(true)}
                                className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer rounded-2xl group active:scale-[0.98]"
                            >
                                <CardContent className="p-10 flex flex-col items-center justify-center gap-3">
                                    <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <Plus className="h-8 w-8 text-slate-400 group-hover:text-white" />
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-2 border-blue-500 bg-blue-50/30 rounded-2xl animate-in zoom-in-95 duration-200 shadow-xl shadow-blue-50">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-blue-900">အတန်းသစ်ထည့်မည်</h3>
                                        <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="className">အတန်းအမည်</Label>
                                        <Input 
                                            id="className"
                                            placeholder="ဥပမာ - Grade 12"
                                            value={newClassName}
                                            onChange={(e) => setNewClassName(e.target.value)}
                                            className="h-12 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>အချိန်များ</Label>
                                        <Select value={newPeriods} onValueChange={setNewPeriods}>
                                            <SelectTrigger className="h-12 bg-white">
                                                <SelectValue placeholder="အချိန်ရွေးပါ" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[6, 7, 8, 9, 10, 11, 12].map((p) => (
                                                    <SelectItem key={p} value={p.toString()}>{p} ချိန်</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button 
                                        onClick={handleAddClass}
                                        disabled={isSavingClass || !newClassName}
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl mt-2 shadow-lg shadow-blue-200"
                                    >
                                        {isSavingClass ? <Loader2 className="h-5 w-5 animate-spin" /> : "ဖန်တီးမည်"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    <div className="h-1.5 w-full bg-blue-600 rounded-full opacity-90 shadow-sm" />
                    <div className="space-y-3 pb-10">
                        {classes.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm italic py-10">အတန်းများ မရှိသေးပါ။ အပေါ်တွင် ဖန်တီးပါ။</p>
                        ) : (
                            classes.map((cls) => (
                                <Link key={cls.id} href={`/attendance/${cls.id}?name=${encodeURIComponent(cls.name)}&periods=${cls.periods}`}>
                                    <Card className="hover:shadow-md transition-all active:scale-[0.98] border-none shadow-sm mb-3 bg-slate-50/50 hover:bg-slate-100/80">
                                        <CardContent className="p-5 flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-lg font-extrabold text-slate-900">{cls.name}</h3>
                                                <p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block w-fit">
                                                    {cls.periods} ချိန်ပါ အတန်း
                                                </p>
                                            </div>
                                            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
