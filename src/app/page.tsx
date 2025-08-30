
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

      // After 2 seconds, check session and profile
      setTimeout(async () => {
        if (session) {
          // User is logged in, check if they have a profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is expected for new users
             console.error('Error fetching profile:', error);
          }
          
          // If profile is incomplete (e.g., no username), go to setup. Otherwise, go to home.
          if (profile && profile.username && profile.full_name) {
            router.push('/home');
          } else {
            router.push('/profile/setup');
          }
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
