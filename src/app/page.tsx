
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    // Wait a bit for dramatic effect then go to home page
    const timer = setTimeout(() => {
      router.push('/home');
    }, 1500); // 1.5 seconds delay

    return () => clearTimeout(timer);
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
