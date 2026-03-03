
"use client";
import { useEffect, useRef } from 'react';

export function AdsterraBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const atOptions = {
        'key' : '3302b46afa77d252d2391b9ae84b3716',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `atOptions = ${JSON.stringify(atOptions)};`;
      bannerRef.current.appendChild(script);

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/3302b46afa77d252d2391b9ae84b3716/invoke.js';
      bannerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className="flex justify-center my-4 overflow-hidden min-h-[60px] w-full">
      <div ref={bannerRef} />
    </div>
  );
}
