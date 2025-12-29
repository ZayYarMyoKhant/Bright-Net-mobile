
"use client";

import { useAdMob } from '@/hooks/use-admob';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export function AdBanner() {
  const [isClient, setIsClient] = useState(false);

  // This ensures the component only renders on the client side, after hydration.
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // The useAdMob hook handles showing the banner. We just need to call it.
  useAdMob(); 
  
  // Prevent server-side rendering and only render a placeholder on native platforms.
  if (!isClient || !Capacitor.isNativePlatform()) {
    return null;
  }

  // Reserve space for the banner ad, which has a height of ~50px.
  return <div id="admob-banner-container" className="h-[50px] w-full flex-shrink-0 bg-transparent" />;
}
