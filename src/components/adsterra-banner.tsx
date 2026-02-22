"use client";

import { useEffect, useRef } from "react";

export function AdsterraBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current) return;

    // Check if script is already injected to avoid duplicates
    if (bannerRef.current.children.length > 0) return;

    const script1 = document.createElement("script");
    script1.type = "text/javascript";
    script1.innerHTML = `
      atOptions = {
        'key' : '3302b46afa77d252d2391b9ae84b3716',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    const script2 = document.createElement("script");
    script2.type = "text/javascript";
    script2.src = "https://www.highperformanceformat.com/3302b46afa77d252d2391b9ae84b3716/invoke.js";

    bannerRef.current.appendChild(script1);
    bannerRef.current.appendChild(script2);
  }, []);

  return (
    <div className="flex justify-center w-full my-2 overflow-hidden min-h-[60px]">
      <div ref={bannerRef}></div>
    </div>
  );
}
