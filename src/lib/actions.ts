
"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";


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
