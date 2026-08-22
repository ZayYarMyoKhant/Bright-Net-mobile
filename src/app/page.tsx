
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Clock, ClipboardCheck, X } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type ClassData = {
    id: string;
    name: string;
    periods: string;
};

export default function DashboardPage() {
    const [hasSchool, setHasSchool] = useState(true); // Simulated for prototype
    const [schoolName, setSchoolName] = useState("အမှတ် (၁) အခြေခံပညာအထက်တန်းကျောင်း");
    const [isCreating, setIsCreating] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newPeriods, setNewPeriods] = useState("8");
    
    const [classes, setClasses] = useState<ClassData[]>([
        { id: "1", name: "G-12", periods: "8" },
    ]);

    const handleAddClass = () => {
        if (!newClassName) return;
        const newClass: ClassData = {
            id: Date.now().toString(),
            name: newClassName,
            periods: newPeriods
        };
        setClasses([...classes, newClass]);
        setNewClassName("");
        setNewPeriods("8");
        setIsCreating(false);
    };

    if (!hasSchool) {
        return (
            <div className="flex h-dvh flex-col bg-slate-50 p-6 items-center justify-center text-center">
                <div className="bg-blue-50 p-6 rounded-3xl mb-6">
                    <ClipboardCheck className="h-16 w-16 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Roll Call System</h1>
                <p className="text-slate-600 mb-8 max-w-xs text-sm">
                    ကျောင်းအုပ်အနေဖြင့် ကျောင်းအသစ်တည်ဆောက်ပါ သို့မဟုတ် ဆရာအနေဖြင့် ရှိပြီးသားကျောင်းသို့ ဝင်ရောက်ပါ။
                </p>
                <div className="grid w-full gap-4 max-w-sm">
                    <Button onClick={() => setHasSchool(true)} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 font-bold rounded-2xl shadow-lg shadow-blue-100">
                        <Plus className="mr-2 h-5 w-5" /> ကျောင်းအသစ်ဖွင့်မည်
                    </Button>
                    <Link href="/school/join">
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
            {/* Header */}
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 bg-white sticky top-0 z-10">
                <Button variant="ghost" size="icon" className="mr-2">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <h1 className="text-lg font-bold text-slate-900 truncate">
                    {schoolName} အတွက် အတန်းများ
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                <div className="max-w-md mx-auto space-y-6">
                    
                    {/* Create Class Section */}
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
                                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl mt-2"
                                    >
                                        ဖန်တီးမည်
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Thick Blue Separator Line */}
                    <div className="h-1.5 w-full bg-blue-600 rounded-full opacity-90 shadow-sm" />

                    {/* Class List */}
                    <div className="space-y-3 pb-10">
                        {classes.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm italic py-10">အတန်းများ မရှိသေးပါ။ အပေါ်တွင် ဖန်တီးပါ။</p>
                        ) : (
                            classes.map((cls) => (
                                <Link key={cls.id} href={`/attendance/${cls.id}`}>
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
