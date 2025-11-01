
"use client";

import { useEffect, useRef } from 'react';
import { Card } from './ui/card';

export function AdBanner() {
  const adRef = useRef<HTMLDivElement>(null);
  // Updated key from user
  const key = 'cc7adb1b3a072d4a1b1c04a74077b968';

  useEffect(() => {
    const container = adRef.current;
    if (container && container.children.length === 0) {
      const atOptionsScript = document.createElement('script');
      atOptionsScript.type = 'text/javascript';
      atOptionsScript.innerHTML = `
        atOptions = {
          'key' : '${key}',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;
      
      // Clear container before appending to avoid duplicates on fast refresh
      container.innerHTML = '';
      container.appendChild(atOptionsScript);
      container.appendChild(invokeScript);
    }
  }, [key]);

  return (
    <Card className="w-full max-w-[468px] h-[60px] mx-auto flex items-center justify-center overflow-hidden">
      <div ref={adRef} className="w-full h-full flex items-center justify-center" />
    </Card>
  );
}
