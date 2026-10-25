
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if user info already exists in local storage
      const userInfo = localStorage.getItem("user_info");
      if (userInfo) {
        router.push("/home");
      } else {
        router.push("/signup");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-deep-navy text-white relative overflow-hidden">
      <div className="relative">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold tracking-tight"
        >
          မင်္ဂလာပါ
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute -bottom-6 -right-8 text-xl font-medium text-blue-200"
        >
          Welcome
        </motion.p>
      </div>
    </div>
  );
}
