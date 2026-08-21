"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserPlus, Save, ClipboardList } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";

type Student = {
  id: string;
  name: string;
  rollNo: string;
  attendance: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
  };
};

const dummyStudents: Student[] = [
  { id: "1", name: "မောင်မောင်", rollNo: "၁", attendance: { mon: false, tue: false, wed: false, thu: false, fri: false } },
  { id: "2", name: "မမ", rollNo: "၂", attendance: { mon: false, tue: false, wed: false, thu: false, fri: false } },
  { id: "3", name: "ကျော်ကျော်", rollNo: "၃", attendance: { mon: false, tue: false, wed: false, thu: false, fri: false } },
  { id: "4", name: "အေးအေး", rollNo: "၄", attendance: { mon: false, tue: false, wed: false, thu: false, fri: false } },
  { id: "5", name: "လှလှ", rollNo: "၅", attendance: { mon: false, tue: false, wed: false, thu: false, fri: false } },
];

export default function RollCallPage() {
  const [students, setStudents] = useState<Student[]>(dummyStudents);

  const toggleAttendance = (studentId: string, day: keyof Student["attendance"]) => {
    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? { ...s, attendance: { ...s.attendance, [day]: !s.attendance[day] } }
          : s
      )
    );
  };

  return (
    <div className="flex h-dvh flex-col bg-white text-slate-900 pb-16">
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b px-4 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold">Roll Call System</h1>
        </div>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[150px] font-bold text-slate-900">ကျောင်းသားနာမည်</TableHead>
                <TableHead className="w-[80px] font-bold text-slate-900 text-center">ခုံနံပါတ်</TableHead>
                <TableHead className="text-center font-bold text-slate-900">တနင်္လာ</TableHead>
                <TableHead className="text-center font-bold text-slate-900">အင်္ဂါ</TableHead>
                <TableHead className="text-center font-bold text-slate-900">ဗုဒ္ဓဟူး</TableHead>
                <TableHead className="text-center font-bold text-slate-900">ကြာသပတေး</TableHead>
                <TableHead className="text-center font-bold text-slate-900">သောကြာ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-center">{student.rollNo}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={student.attendance.mon} 
                      onCheckedChange={() => toggleAttendance(student.id, "mon")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={student.attendance.tue} 
                      onCheckedChange={() => toggleAttendance(student.id, "tue")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={student.attendance.wed} 
                      onCheckedChange={() => toggleAttendance(student.id, "wed")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={student.attendance.thu} 
                      onCheckedChange={() => toggleAttendance(student.id, "thu")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={student.attendance.fri} 
                      onCheckedChange={() => toggleAttendance(student.id, "fri")}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            <Save className="h-4 w-4 mr-2" />
            Save Attendance
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}