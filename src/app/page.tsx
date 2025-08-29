
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const [show, setShow] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      // After animation, you can redirect to login or home page
      // For now, let's assume we will build a login page next.
      // router.push('/login'); 
    }, 4000); // 4 seconds for the animation

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-black">
      <div className={`transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}>
        <h1 className="animate-splash text-4xl font-bold text-primary">
          Welcome to Bright-Net
        </h1>
      </div>
    </div>
  );
}
