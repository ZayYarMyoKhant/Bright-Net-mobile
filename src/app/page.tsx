
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // After 2 seconds, check session
      setTimeout(async () => {
        if (session) {
          // If a session exists, the auth/callback logic or subsequent navigation will handle profile checks.
          // Just go to the home page. If the profile is not set up, they will be redirected from there if necessary,
          // but our new callback handles it first.
          router.push('/home');
        } else {
          // No session, go to sign up
          router.push('/signup');
        }
      }, 4000); // Wait for 4 seconds to match animation duration
    };
    
    checkUser();
  }, [router]);

  return (
    <div className="bg-black flex h-dvh w-full items-center justify-center">
      <h1 className="text-4xl font-bold text-center">
        <span className="animate-fade-in-1 inline-block text-white">
          Welcome to
        </span>
        <span className="animate-fade-in-2 ml-3 inline-block text-blue-500">
          Bright-Net
        </span>
      </h1>
    </div>
  );
}
