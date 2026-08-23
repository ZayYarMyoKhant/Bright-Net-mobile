
"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, ChevronDown, Check, X, UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AttendanceStatus = 'present' | 'absent' | 'none';

type StudentRow = {
  id: string;
  order: string;
  name: string;
  rollNo: string;
  periods: AttendanceStatus[];
};

const periodNames = [
  "ပထမချိန်", "ဒုတိယချိန်", "တတိယချိန်", "စတုတ္ထချိန်", "ပဉ္စမချိန်", 
  "ဆဋ္ဌမချိန်", "သတ္တမချိန်", "အဋ္ဌမချိန်", "နဝမချိန်", "ဒသမချိန်", 
  "ဧကာဒသမ", "ဒွါဒသမ"
];

export default function AttendancePage({ params }: { params: { classId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const className = searchParams.get("name") || "အတန်းအမည်";
  const periodCount = parseInt(searchParams.get("periods") || "8");
  
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [students, setStudents] = useState<StudentRow[]>([
    { id: "1", order: "၁", name: "", rollNo: "", periods: Array(periodCount).fill('none') }
  ]);

  const toggleStatus = (studentId: string, periodIndex: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const newPeriods = [...s.periods];
        const current = newPeriods[periodIndex];
        if (current === 'none') newPeriods[periodIndex] = 'present';
        else if (current === 'present') newPeriods[periodIndex] = 'absent';
        else newPeriods[periodIndex] = 'none';
        return { ...s, periods: newPeriods };
      }
      return s;
    }));
  };

  const handleInputChange = (id: string, field: 'name' | 'rollNo' | 'order', value: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addRow = () => {
    const nextOrder = (students.length + 1).toString(); // simple auto-increment for prototype
    setStudents([...students, { 
      id: Date.now().toString(), 
      order: nextOrder, 
      name: "", 
      rollNo: "", 
      periods: Array(periodCount).fill('none') 
    }]);
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="truncate">
            <h1 className="text-base font-bold truncate">{className}</h1>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{periodCount} ချိန်ပါ အတန်း</p>
          </div>
        </div>
      </header>

      {/* Day Selector */}
      <div className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="w-[140px] h-10 font-bold text-slate-700 bg-slate-50 border-none shadow-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <Button variant="outline" size="sm" onClick={addRow} className="border-blue-200 text-blue-600">
            <UserPlus className="h-4 w-4 mr-1" /> ကျောင်းသားထည့်
        </Button>
      </div>

      {/* Roll Call Table */}
      <main className="flex-1 overflow-auto bg-white">
        <div className="min-w-max">
            <Table>
                <TableHeader className="bg-slate-100">
                    <TableRow>
                        <TableHead className="w-12 text-center font-bold text-slate-700">စဉ်</TableHead>
                        <TableHead className="w-40 font-bold text-slate-700">ကျောင်းသားအမည်</TableHead>
                        <TableHead className="w-24 text-center font-bold text-slate-700">ခုံအမှတ်</TableHead>
                        {Array.from({ length: periodCount }).map((_, i) => (
                            <TableHead key={i} className="w-24 text-center font-bold text-slate-700">
                                {periodNames[i] || `${i + 1} ချိန်`}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                        <TableRow key={student.id} className="hover:bg-slate-50">
                            <TableCell className="p-2">
                                <Input 
                                    value={student.order} 
                                    onChange={(e) => handleInputChange(student.id, 'order', e.target.value)}
                                    className="h-9 w-10 text-center border-none bg-transparent focus-visible:ring-1 p-0 font-mono"
                                />
                            </TableCell>
                            <TableCell className="p-2">
                                <Input 
                                    placeholder="အမည်ရိုက်ပါ"
                                    value={student.name} 
                                    onChange={(e) => handleInputChange(student.id, 'name', e.target.value)}
                                    className="h-9 border-none bg-transparent focus-visible:ring-1"
                                />
                            </TableCell>
                            <TableCell className="p-2">
                                <Input 
                                    placeholder="ခုံနံပါတ်"
                                    value={student.rollNo} 
                                    onChange={(e) => handleInputChange(student.id, 'rollNo', e.target.value)}
                                    className="h-9 w-20 text-center border-none bg-transparent focus-visible:ring-1"
                                />
                            </TableCell>
                            {student.periods.map((status, idx) => (
                                <TableCell key={idx} className="p-2 text-center">
                                    <button 
                                        onClick={() => toggleStatus(student.id, idx)}
                                        className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center transition-all border shadow-sm mx-auto",
                                            status === 'present' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : 
                                            status === 'absent' ? "bg-red-50 border-red-200 text-red-600" : 
                                            "bg-slate-50 border-slate-200 text-slate-300"
                                        )}
                                    >
                                        {status === 'present' && <Check className="h-6 w-6 stroke-[3px]" />}
                                        {status === 'absent' && <X className="h-6 w-6 stroke-[3px]" />}
                                        {status === 'none' && <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                                    </button>
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </main>

      {/* Footer / Save Button */}
      <footer className="p-4 bg-white border-t flex-shrink-0">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-100 active:scale-[0.98] transition-transform">
          <Save className="h-5 w-5 mr-2" />
          သိမ်းဆည်းမည်
        </Button>
      </footer>
    </div>
  );
}
