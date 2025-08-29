
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // After animation, navigate to the sign up page for new users
      router.push('/signup'); 
    }, 4000); // Wait for 4 seconds to match animation duration

    return () => clearTimeout(timer);
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
