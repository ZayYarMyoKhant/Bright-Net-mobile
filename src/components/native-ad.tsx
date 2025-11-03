
"use client";

import { useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

export function NativeAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (adRef.current && adRef.current.children.length === 0) {
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-format', 'fluid');
        ins.setAttribute('data-ad-client', 'ca-pub-2750761696337886');
        // This is a generic native ad slot ID. Replace with a real one from your AdSense account if you have it.
        ins.setAttribute('data-ad-slot', '4982969294'); 
        
        adRef.current.appendChild(ins);
        
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense Native Ad Error: ", e);
    }
  }, []);

  return (
    <Card className="rounded-xl overflow-hidden">
      <div ref={adRef} className="w-full h-full p-4">
        {/* AdSense Native Ad will render here */}
        <div className="text-xs text-muted-foreground">
           <Badge variant="secondary">Ad</Badge>
        </div>
      </div>
    </Card>
  );
}
