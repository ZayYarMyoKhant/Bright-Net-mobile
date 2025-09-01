
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
        const errorMessage = encodeURIComponent("Your session could not be verified. Please log in and try again.");
        return redirect(`/login?error=${errorMessage}`);
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
        const errorMessage = encodeURIComponent("Failed to upload avatar: " + uploadError.message);
        return redirect(`/profile/edit?error=${errorMessage}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      publicAvatarUrl = publicUrl;
    }

    const updates = {
      id: user.id,
      full_name: fullName,
      username: username,
      bio: bio,
      updated_at: new Date().toISOString(),
      ...(publicAvatarUrl && { avatar_url: publicAvatarUrl }), // Only include avatar_url if a new one was uploaded
    };


    const { error: updateError } = await supabase.from('profiles').upsert(updates);

    if (updateError) {
       console.error("Profile Update Error:", updateError);
       const errorMessage = encodeURIComponent("Failed to save profile: " + updateError.message);
       const currentPath = formData.get("current_path") || "/profile/edit";
       return redirect(`${currentPath}?error=${errorMessage}`);
    }
    
    // Redirect on success
    return redirect('/profile');
}


export async function createPost(formData: FormData) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/login');
  }

  const caption = formData.get('caption') as string;
  const mediaFile = formData.get('media') as File;

  if (!mediaFile || mediaFile.size === 0) {
      const errorMessage = encodeURIComponent("Please select a file to upload.");
      return redirect(`/upload/post?error=${errorMessage}`);
  }

  // Upload media to storage
  const fileExt = mediaFile.name.split('.').pop();
  const filePath = `${user.id}/posts/${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('posts')
    .upload(filePath, mediaFile);

  if (uploadError) {
    console.error('Post Upload Error:', uploadError);
    const errorMessage = encodeURIComponent(`Failed to upload media: ${uploadError.message}`);
    return redirect(`/upload/post?error=${errorMessage}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('posts')
    .getPublicUrl(filePath);

  // Insert post into the database
  const { error: insertError } = await supabase.from('posts').insert({
    user_id: user.id,
    caption: caption,
    media_url: publicUrl,
    media_type: mediaFile.type.startsWith('image/') ? 'image' : 'video',
  });

  if (insertError) {
    console.error('Post Insert Error:', insertError);
    const errorMessage = encodeURIComponent(`Failed to create post: ${insertError.message}`);
    return redirect(`/upload/post?error=${errorMessage}`);
  }

  revalidatePath('/home');
  redirect('/home');
}
