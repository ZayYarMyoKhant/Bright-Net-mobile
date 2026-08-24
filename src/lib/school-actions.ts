
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createSchoolAction(formData: {
    schoolName: string;
    principalName: string;
    location: string;
    phone: string;
}) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('rc_schools')
            .insert([
                {
                    name: formData.schoolName,
                    principal_name: formData.principalName,
                    location: formData.location,
                    phone: formData.phone
                }
            ])
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/');
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message || 'An unknown error occurred on the server.' };
    }
}

export async function fetchSchoolById(schoolId: string) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('rc_schools')
            .select('name')
            .eq('id', schoolId)
            .single();
        
        if (error) return null;
        return data;
    } catch (err) {
        return null;
    }
}
