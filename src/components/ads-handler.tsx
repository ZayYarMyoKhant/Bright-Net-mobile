
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    show_10630894: any;
  }
}

export function AdsHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // These are the main root pages where we want to trigger ads on entry/transition
    const mainPages = ['/home', '/search', '/upload', '/bliss-zone', '/profile'];
    
    if (mainPages.some(page => pathname.startsWith(item => page === pathname || (page !== '/home' && pathname.startsWith(page))))) {
        // Initialize/Trigger In-App Interstitial
        if (typeof window !== 'undefined' && window.show_10630894) {
            try {
                window.show_10630894({
                    type: 'inApp',
                    inAppSettings: {
                        frequency: 2,
                        capping: 0.1,
                        interval: 30,
                        timeout: 5,
                        everyPage: false
                    }
                });
            } catch (error) {
                console.error("Monetag In-App Ad initialization failed:", error);
            }
        }
    }
  }, [pathname]);

  return null;
}
