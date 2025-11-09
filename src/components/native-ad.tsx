
"use client";

import { useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export function NativeAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This is a more complex script setup, we need to create the container div and then load the script
    if (adRef.current && adRef.current.children.length === 0) {
        const containerDiv = document.createElement('div');
        containerDiv.id = 'container-fbc3e194891f6a7ad7ab14a8124ea375';
        
        const script = document.createElement('script');
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = '//pl28016241.effectivegatecpm.com/fbc3e194891f6a7ad7ab14a8124ea375/invoke.js';

        adRef.current.appendChild(containerDiv);
        adRef.current.appendChild(script);
    }
  }, []);

  return (
    <Card className="rounded-xl overflow-hidden">
      <div ref={adRef} className="w-full h-full">
        {/* Adsterra Native Ad will render here */}
      </div>
    </Card>
  );
}
