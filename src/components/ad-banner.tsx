
"use client";

import { useAdMob } from '@/hooks/use-admob';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';

export function AdBanner() {
  // The useAdMob hook handles showing the banner. We just need to call it.
  useAdMob(); 
  
  // This component will only render a placeholder on native platforms
  // to reserve space for the banner ad, which has a height of ~50px.
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  return <div id="admob-banner-container" className="h-[50px] w-full flex-shrink-0" />;
}
