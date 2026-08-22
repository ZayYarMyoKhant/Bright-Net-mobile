
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Users, School as SchoolIcon, Plus, LogIn } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";

export default function DashboardPage() {
    // Mock user status - in a real app, this comes from DB
    const [hasSchool, setHasSchool] = useState(false);
    const [userRole, setUserRole] = useState<"principal" | "teacher" | null>(null);

    const classes = [
        { id: "10-A", name: "Grade 10 - A", students: 45 },
        { id: "10-B", name: "Grade 10 - B", students: 42 },
        { id: "11-C", name: "Grade 11 - C", students: 38 },
    ];

    if (!hasSchool) {
        return (
            <div className="flex h-dvh flex-col bg-slate-50 p-6 items-center justify-center text-center pb-24">
                <SchoolIcon className="h-20 w-20 text-blue-600 mb-6" />
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Roll Call System မှ ကြိုဆိုပါတယ်</h1>
                <p className="text-slate-600 mb-8 max-w-xs text-sm">
                    ကျောင်းအုပ်အနေဖြင့် ကျောင်းအသစ်တည်ဆောက်ပါ သို့မဟုတ် ဆရာအနေဖြင့် ရှိပြီးသားကျောင်းသို့ ဝင်ရောက်ပါ။
                </p>
                <div className="grid w-full gap-4 max-w-sm">
                    <Link href="/school/setup">
                        <Button className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 font-bold">
                            <Plus className="mr-2 h-5 w-5" /> ကျောင်းအသစ်ဖွင့်မည်
                        </Button>
                    </Link>
                    <Link href="/school/join">
                        <Button variant="outline" className="w-full h-14 text-lg border-blue-600 text-blue-600 font-bold">
                            <LogIn className="mr-2 h-5 w-5" /> ကျောင်းသို့ဝင်မည်
                        </Button>
                    </Link>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col bg-slate-50 pb-16">
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">အမှတ် (၁) အခြေခံပညာအထက်တန်းကျောင်း</h1>
                    <p className="text-xs text-blue-600 font-medium">Dashboard • {userRole === 'principal' ? 'ကျောင်းအုပ်' : 'အတန်းပိုင်ဆရာ'}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-slate-100">
                    <Users className="h-5 w-5 text-slate-600" />
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-blue-600 text-white border-none shadow-md">
                        <CardContent className="p-4 flex flex-col items-center">
                            <p className="text-xs opacity-80 mb-1">စုစုပေါင်းအတန်း</p>
                            <p className="text-3xl font-bold">၁၂</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-500 text-white border-none shadow-md">
                        <CardContent className="p-4 flex flex-col items-center">
                            <p className="text-xs opacity-80 mb-1">ယနေ့ရောက်ရှိ</p>
                            <p className="text-3xl font-bold">၉၈%</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <h2 className="text-lg font-bold text-slate-800">သင်ကြားရမည့် အတန်းများ</h2>
                    <Button variant="link" className="text-blue-600 p-0 h-auto text-sm font-bold">အားလုံးကြည့်ရန်</Button>
                </div>

                <div className="space-y-3">
                    {classes.map((cls) => (
                        <Link key={cls.id} href={`/attendance/${cls.id}`}>
                            <Card className="hover:shadow-md transition-shadow active:scale-[0.98] border-none shadow-sm mb-3">
                                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-md font-bold">{cls.name}</CardTitle>
                                        <CardDescription className="text-xs">ကျောင်းသားဦးရေ - {cls.students}</CardDescription>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                        <ClipboardCheck className="h-5 w-5 text-blue-600" />
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>

                <Button className="w-full bg-white text-blue-600 border-2 border-dashed border-blue-200 hover:bg-blue-50 h-16 rounded-xl font-bold">
                    <Plus className="mr-2 h-5 w-5" /> အတန်းသစ်ထည့်မည်
                </Button>
            </main>

            <BottomNav />
        </div>
    );
}
