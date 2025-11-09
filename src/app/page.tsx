'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SplashPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    const checkUser = async () => {
      // Add a small delay for branding effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatus("Checking authentication...");
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error checking auth session:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Could not verify your session. Please try again.",
        });
        // Even on error, we might want to let them try to sign up/in
        router.push('/signup');
        return;
      }
      
      if (session) {
        // User is logged in, now check if they have a profile
        setStatus("Welcome back! Loading your feed...");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore 'no rows found' error
            console.error("Error fetching profile:", profileError);
            toast({ variant: "destructive", title: "Error", description: "Could not load your profile." });
            router.push('/signup'); // Go to signup on error
        } else if (profile) {
            router.push('/home');
        } else {
            // User is signed up but hasn't completed profile setup
            setStatus("Please complete your profile...");
            router.push('/profile/setup');
        }
      } else {
        // No user session, go to signup
        setStatus("Redirecting to sign up...");
        router.push('/signup');
      }
    };

    checkUser();
  }, [router, supabase, toast]);

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
      <p className="text-sm text-muted-foreground mt-2">{status}</p>
    </div>
  );
}
