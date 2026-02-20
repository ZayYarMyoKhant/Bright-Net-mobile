
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
    const mainPages = ['/home', '/search', '/upload', '/bliss-zone', '/profile'];
    
    if (mainPages.some(page => pathname === page || (page !== '/home' && pathname.startsWith(page)))) {
        if (typeof window !== 'undefined' && window.show_10630894 && typeof window.show_10630894 === 'function') {
            try {
                // Wrap the call in Promise.resolve to safely handle if it returns a promise or not
                // This prevents unhandled rejection errors like "adex timeout"
                Promise.resolve(window.show_10630894({
                    type: 'inApp',
                    inAppSettings: {
                        frequency: 2,
                        capping: 0.1,
                        interval: 30,
                        timeout: 5,
                        everyPage: false
                    }
                })).catch(error => {
                    // Log as a warning but don't show a runtime error to the user
                    console.warn("Monetag In-App Ad skipped or timed out:", error);
                });
            } catch (error) {
                console.error("Monetag In-App Ad initialization failed:", error);
            }
        }
    }
  }, [pathname]);

  return null;
}
