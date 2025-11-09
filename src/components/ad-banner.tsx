
"use client";

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { Card } from './ui/card';

export function AdBanner() {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adsterra ads are usually handled via scripts.
    // The main script is loaded here to invoke the ad.
    // This setup might need adjustments based on how Adsterra's specific ad format works in React/Next.js
    const adScript = document.createElement('script');
    
    // @ts-ignore
    window.atOptions = {
        'key' : '7cb270a0cb7d1e82f838ca9f696e3fec',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
    };

    adScript.src = "//www.highperformanceformat.com/7cb270a0cb7d1e82f838ca9f696e3fec/invoke.js";
    adScript.type = 'text/javascript';
    adScript.async = true;

    if (adContainerRef.current) {
        // Clear previous ads if any
        adContainerRef.current.innerHTML = '';
        adContainerRef.current.appendChild(adScript);
    }
    
    return () => {
        // Cleanup if necessary
        if (adContainerRef.current) {
            adContainerRef.current.innerHTML = '';
        }
    };

  }, []);

  return (
    <Card className="w-full h-auto min-h-[60px] mx-auto flex items-center justify-center overflow-hidden">
      <div ref={adContainerRef} className="w-full h-full flex items-center justify-center" style={{ width: '468px', height: '60px' }}>
        {/* Adsterra Banner Ad will load here */}
      </div>
    </Card>
  );
}
