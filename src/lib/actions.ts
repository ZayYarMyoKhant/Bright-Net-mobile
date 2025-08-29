"use server";

import { translateVideoDescription } from "@/ai/flows/translate-video-description";
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
    
    const result = await translateVideoDescription({ descriptionMyanmar: validatedData.data.description });

    return {
      success: true,
      translatedText: result.descriptionEnglish,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to translate. Please try again.",
    };
  }
}
