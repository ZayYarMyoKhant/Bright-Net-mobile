
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
