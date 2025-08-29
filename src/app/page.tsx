
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VideoFeed } from "@/components/video-feed";

export default function SplashPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [showFeed, setShowFeed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      // After the splash animation, start showing the feed.
      // In a real app, you might navigate to a login page first.
      setShowFeed(true); 
    }, 4000); // 4 seconds for the animation

    return () => clearTimeout(splashTimer);
  }, [router]);

  if (showSplash) {
    return (
      <div className="flex flex-1 h-dvh w-full items-center justify-center bg-black">
        <div className={`transition-opacity duration-1000 ${showSplash ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="animate-splash text-4xl font-bold text-primary">
            Welcome to Bright-Net
          </h1>
        </div>
      </div>
    );
  }

  // Once splash is done, render the video feed
  if (showFeed) {
    return <VideoFeed />;
  }

  // Render nothing while transitioning (or a loading spinner)
  return null;
}
