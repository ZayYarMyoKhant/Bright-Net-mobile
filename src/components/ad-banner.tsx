
"use client";

import Script from 'next/script';
import { useEffect, useRef } from 'react';
import { Card } from './ui/card';

export function AdBanner() {
  const adRef = useRef<HTMLDivElement>(null);
  const key = 'e772f8c2482319d13453502dbb8278db';

  useEffect(() => {
    const container = adRef.current;
    if (container && container.children.length === 0) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        atOptions = {
          'key' : '${key}',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;

      const invocationScript = document.createElement('script');
      invocationScript.type = 'text/javascript';
      invocationScript.src = `//www.highperformanceformat.com/${key}/invoke.js`;

      container.appendChild(script);
      container.appendChild(invocationScript);
    }
  }, [key]);

  return (
    <Card className="w-full max-w-[468px] h-[60px] mx-auto flex items-center justify-center overflow-hidden">
      <div ref={adRef} className="w-full h-full flex items-center justify-center" />
    </Card>
  );
}

export function NativeAd() {
    const adRef = useRef<HTMLDivElement>(null);
    const containerId = 'container-87e64407782861e951d8e4eb444a2923';
    const scriptSrc = '//pl27709318.revenuecpmgate.com/87e64407782861e951d8e4eb444a2923/invoke.js';

    useEffect(() => {
        const container = adRef.current;
        if (container && container.children.length === 0) {
            const script = document.createElement('script');
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src = scriptSrc;

            const adContainerDiv = document.createElement('div');
            adContainerDiv.id = containerId;

            container.appendChild(script);
            container.appendChild(adContainerDiv);
        }
    }, []);

    return <div ref={adRef} className="w-full my-4" />;
}
