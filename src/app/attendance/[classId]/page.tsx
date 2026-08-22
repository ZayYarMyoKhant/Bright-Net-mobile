
"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Share2, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type Student = {
  id: string;
  name: string;
  rollNo: string;
  attendance: {
    status: 'present' | 'absent' | 'leave';
  };
};

const dummyStudents: Student[] = [
  { id: "1", name: "မောင်မောင်", rollNo: "၁", attendance: { status: 'present' } },
  { id: "2", name: "မမ", rollNo: "၂", attendance: { status: 'present' } },
  { id: "3", name: "ကျော်ကျော်", rollNo: "၃", attendance: { status: 'absent' } },
  { id: "4", name: "အေးအေး", rollNo: "၄", attendance: { status: 'present' } },
  { id: "5", name: "လှလှ", rollNo: "၅", attendance: { status: 'leave' } },
];

export default function AttendancePage({ params }: { params: { classId: string } }) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>(dummyStudents);
  const classId = decodeURIComponent(params.classId);

  const toggleAttendance = (studentId: string) => {
    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? { ...s, attendance: { ...s.attendance, status: s.attendance.status === 'present' ? 'absent' : 'present' } }
          : s
      )
    );
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold truncate max-w-[150px]">{classId} - Attendance</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{new Date().toLocaleDateString('my-MM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex gap-1">
            <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4 text-slate-600" />
            </Button>
            <Button variant="ghost" size="icon">
                <Printer className="h-4 w-4 text-slate-600" />
            </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden mb-6">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[180px] font-bold text-slate-900">ကျောင်းသားနာမည်</TableHead>
                <TableHead className="w-[80px] font-bold text-slate-900 text-center">ခုံနံပါတ်</TableHead>
                <TableHead className="text-center font-bold text-slate-900">ရောက်ရှိ</TableHead>
                <TableHead className="text-center font-bold text-slate-900">မှတ်ချက်</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} className="hover:bg-slate-50 border-b">
                  <TableCell className="font-semibold text-sm py-4">{student.name}</TableCell>
                  <TableCell className="text-center font-mono">{student.rollNo}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={student.attendance.status === 'present'} 
                      onCheckedChange={() => toggleAttendance(student.id)}
                      className="h-6 w-6 rounded-md"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                     {student.attendance.status === 'absent' && <Badge variant="destructive" className="text-[10px]">ပျက်ကွက်</Badge>}
                     {student.attendance.status === 'leave' && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">ခွင့်</Badge>}
                     {student.attendance.status === 'present' && <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">ရောက်</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl mb-6 border border-blue-100">
            <div className="text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total</p>
                <p className="text-lg font-bold text-slate-800">{students.length}</p>
            </div>
            <div className="text-center border-x px-6 border-blue-200">
                <p className="text-[10px] text-emerald-600 uppercase font-bold">Present</p>
                <p className="text-lg font-bold text-emerald-600">{students.filter(s => s.attendance.status === 'present').length}</p>
            </div>
            <div className="text-center">
                <p className="text-[10px] text-red-600 uppercase font-bold">Absent</p>
                <p className="text-lg font-bold text-red-600">{students.filter(s => s.attendance.status !== 'present').length}</p>
            </div>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 rounded-xl text-lg font-bold shadow-lg shadow-blue-200">
          <Save className="h-5 w-5 mr-2" />
          သိမ်းဆည်းမည်
        </Button>
      </main>
    </div>
  );
}
