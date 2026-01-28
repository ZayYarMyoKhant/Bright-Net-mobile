
// /src/app/class/[id]/page.tsx
import { Suspense } from "react";
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Loader2 } from "lucide-react";
import IndividualClassPageContent from "./IndividualClassPageContent";
import { Profile } from "@/lib/data";

// This is the Server Page component that handles the route.
export default async function IndividualClassPage({ params }: { params: { id:string } }) {
  const supabase = createClient();
  const classId = params.id;

  const { data: { user } } = await supabase.auth.getUser();

  if (!classId) {
      const initialData = { classData: null, isEnrolled: false, messages: [], error: 'Class ID is missing.' };
      return <IndividualClassPageContent initialData={initialData} />;
  }


  // Fetch class info and student count in parallel
  const classInfoPromise = supabase
      .from('classes')
      .select('id, name, description, avatar_url, creator_id')
      .eq('id', classId)
      .single();
      
  const studentCountPromise = supabase
      .from('class_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('class_id', classId);
      
  const isEnrolledPromise = user ? supabase
      .from('class_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('user_id', user.id) : Promise.resolve({ count: 0, error: null });

  const [classInfoRes, studentCountRes, isEnrolledRes] = await Promise.all([classInfoPromise, studentCountPromise, isEnrolledRes]);

  const { data: classInfo, error: classError } = classInfoRes;
  
  if (classError || !classInfo) {
      const errorMessage = classError?.message || 'The class could not be found.';
      const initialData = { classData: null, isEnrolled: false, messages: [], error: errorMessage };
      return <IndividualClassPageContent initialData={initialData} />;
  }
  
  const isUserEnrolled = (isEnrolledRes.count ?? 0) > 0;
  let messages = [];

  if (isUserEnrolled && user) {
    const { data: messagesData, error: messagesError } = await supabase
      .from('class_messages')
      .select('*, profiles:user_id(*), read_by:class_message_read_status(count)')
      .eq('class_id', classId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (messagesError) {
      const initialData = { classData: null, isEnrolled: false, messages: [], error: messagesError.message };
      return <IndividualClassPageContent initialData={initialData} />;
    }
    
    // @ts-ignore
    messages = (messagesData || []).map(msg => ({
        ...msg,
        read_by_count: msg.read_by[0]?.count || 0
    }));
  }


  const initialData = {
      classData: { 
          ...classInfo, 
          student_count: studentCountRes.count ?? 0,
      },
      isEnrolled: isUserEnrolled,
      messages,
      error: null
  };

  return (
    <Suspense fallback={<div className="flex h-dvh w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
        <IndividualClassPageContent initialData={initialData} />
    </Suspense>
  );
}
