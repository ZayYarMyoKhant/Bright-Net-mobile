
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, School as SchoolIcon, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function SchoolJoinPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    
    const schools = [
        { id: 1, name: "အထက (၁) အင်းစိန်", location: "ရန်ကုန်" },
        { id: 2, name: "အထက (၂) လှိုင်", location: "ရန်ကုန်" },
        { id: 3, name: "အထက (၁) ပုသိမ်", location: "ဧရာဝတီ" },
    ];

    return (
        <div className="flex h-dvh flex-col bg-slate-50">
            <header className="bg-white p-4 flex items-center gap-3 border-b sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold">ကျောင်းရှာဖွေရန်</h1>
            </header>

            <main className="p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="ကျောင်းအမည်ဖြင့် ရှာဖွေပါ..." 
                        className="pl-10 h-12 bg-white border-none shadow-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="pt-2">
                    <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">အကြံပြုထားသော ကျောင်းများ</p>
                    <div className="space-y-3">
                        {schools.map((school) => (
                            <Card key={school.id} className="border-none shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                            <SchoolIcon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{school.name}</h3>
                                            <p className="text-xs text-slate-500">{school.location}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
