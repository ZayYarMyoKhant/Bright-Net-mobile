
"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const translateSchema = z.object({
  description: z.string(),
});

export async function translateDescriptionAction(formData: FormData) {
  try {
    const validatedData = translateSchema.safeParse({
      description: formData.get("description"),
    });

    if (!validatedData.success) {
      return {
        success: false,
        error: "Invalid input.",
      };
    }
    
    // This part is not being used in the current context but is kept.
    // const result = await translateVideoDescription({ descriptionMyanmar: validatedData.data.description });

    return {
      success: true,
      // translatedText: result.descriptionEnglish,
      translatedText: "Translated: " + validatedData.data.description,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to translate. Please try again.",
    };
  }
}


export async function signup(formData: FormData) {
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const countryCode = formData.get("country_code") as string;

  const supabase = createClient();
  const fullPhoneNumber = `+${countryCode}${phone}`;

  const { error } = await supabase.auth.signUp({
    phone: fullPhoneNumber,
    password,
  });

  if (error) {
    console.error("Signup Error:", error.message);
    const errorMessage = encodeURIComponent(error.message);
    return redirect(`/signup?error=${errorMessage}`);
  }

  return redirect("/profile/setup");
}


export async function login(formData: FormData) {
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const countryCode = formData.get("country_code") as string;
    
    const supabase = createClient();
    const fullPhoneNumber = `+${countryCode}${phone}`;

    const { error } = await supabase.auth.signInWithPassword({
        phone: fullPhoneNumber,
        password,
    });

    if (error) {
       console.error("Login Error:", error.message);
       const errorMessage = encodeURIComponent(error.message);
       return redirect(`/login?error=${errorMessage}`);
    }

    return redirect('/home');
}

export async function saveProfile(formData: FormData) {
    const supabase = createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return { error: "Your session could not be verified. Please try signing up again." };
    }

    const fullName = formData.get("full_name") as string;
    const username = formData.get("username") as string;
    const bio = formData.get("bio") as string;
    const avatarFile = formData.get("avatar_file") as File | null;
    
    let publicAvatarUrl: string | null = null;

    if (avatarFile && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) {
        console.error("Avatar Upload Error:", uploadError);
        return { error: "Failed to upload avatar." };
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      publicAvatarUrl = publicUrl;
    }

    const { error: updateError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      username: username,
      bio: bio,
      avatar_url: publicAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
       console.error("Profile Update Error:", updateError);
       return { error: "Failed to save profile." };
    }
    
    // Redirect on success
    return redirect('/home');
}
