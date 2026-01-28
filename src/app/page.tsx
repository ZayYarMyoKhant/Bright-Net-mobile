
'use client';

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MultiAccountContext } from "@/hooks/use-multi-account";

export default function SplashPage() {
  const router = useRouter();
  const multiAccount = useContext(MultiAccountContext);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    // Add a small delay for branding effect
    const brandingTimer = setTimeout(() => {
        if (!multiAccount || multiAccount.isLoading) {
            setStatus("Checking authentication...");
        }
    }, 1500);

    if (multiAccount && !multiAccount.isLoading) {
        if (multiAccount.currentAccount) {
            setStatus("Welcome back! Loading your feed...");
            // A short delay before redirecting to home to show the welcome message
            setTimeout(() => {
                router.push('/home');
            }, 500);
        } else {
            setStatus("Redirecting to sign up...");
            // Redirect immediately if no account is found
            router.push('/signup');
        }
    }

    return () => clearTimeout(brandingTimer);

  }, [multiAccount, router]);

  return (
    <div className="bg-black flex h-dvh w-full flex-col items-center justify-center gap-4 relative">
      <div className="flex flex-col items-center justify-center gap-4">
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
      <div className="absolute bottom-8 text-center">
          <p className="text-sm text-muted-foreground">
              power by <span className="font-semibold text-blue-500">ULife & ZMT</span>
          </p>
      </div>
    </div>
  );
}
