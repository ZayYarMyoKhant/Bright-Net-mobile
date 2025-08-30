
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // Wait a bit for dramatic effect and to ensure session is resolved
      setTimeout(() => {
        if (session) {
          // User is logged in, go to home
          router.push('/home');
        } else {
          // No session, go to sign up
          router.push('/signup');
        }
      }, 1500); // 1.5 seconds delay
    };
    
    checkUserAndRedirect();
  }, [router]);

  return (
    <div className="bg-black flex h-dvh w-full flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-center">
        <span className="animate-fade-in-1 inline-block text-white">
          Welcome to
        </span>
        <span className="animate-fade-in-2 ml-3 inline-block text-blue-500">
          Bright-Net
        </span>
      </h1>
      <Loader2 className="h-8 w-8 animate-spin text-white mt-4" />
    </div>
  );
}
