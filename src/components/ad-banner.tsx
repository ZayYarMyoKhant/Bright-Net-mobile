
"use client";

import { useAdMob } from '@/hooks/use-admob';

export function AdBanner() {
  useAdMob(); // This hook will initialize AdMob and show the banner
  
  // The banner is positioned absolutely by the plugin, so we don't need to render anything here.
  // We can return a placeholder div with a fixed height to reserve space if needed.
  return <div id="admob-banner-container" style={{ height: '50px' }} />;
}
