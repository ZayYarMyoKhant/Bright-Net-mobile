
// /src/app/class/[id]/page.tsx
import { Suspense } from "react";
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Loader2 } from "lucide-react";
import IndividualClassPageContent from "./IndividualClassPageContent";
import { Profile } from "@/lib/data";

// This is the Server Page component that handles the route.
export default async function IndividualClassPage({ params }: { params: { id:string } }) {
  const supabase = createClient(cookies());
  const classId = params.id;

  if (!classId) {
      const initialData = { classData: null, isEnrolled: false, error: 'Class ID is missing.' };
      return <IndividualClassPageContent params={params} initialData={initialData} />;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select('id, name, description, avatar_url')
      .eq('id', classId)
      .single();

  if (classError || !classInfo) {
      const errorMessage = classError?.message || 'The class could not be found.';
      const initialData = { classData: null, isEnrolled: false, error: errorMessage };
      return <IndividualClassPageContent params={params} initialData={initialData} />;
  }

  const { data: studentData } = await supabase
      .from('class_enrollments')
      .select('profiles:user_id(*)')
      .eq('class_id', classId);
  
  const students = studentData ? studentData.map((s: any) => s.profiles) : [];
  
  const isUserEnrolled = user ? students.some((student: Profile) => student.id === user.id) : false;

  const initialData = {
      classData: { ...classInfo, students },
      isEnrolled: isUserEnrolled,
      error: null
  };

  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
        <IndividualClassPageContent params={params} initialData={initialData} />
    </Suspense>
  );
}

    