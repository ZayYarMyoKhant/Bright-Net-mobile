"use client";

import { useEffect, useRef } from "react";

export function AdsterraNative() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;
    
    // Simple check to prevent re-injection if component re-renders
    if (adRef.current.dataset.loaded === 'true') return;
    adRef.current.dataset.loaded = 'true';

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl28770334.effectivegatecpm.com/f69b712ae6b9e8c5427909b208ea75aa/invoke.js";
    
    adRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto bg-muted/30 rounded-lg overflow-hidden my-4">
      <div ref={adRef} id="container-f69b712ae6b9e8c5427909b208ea75aa"></div>
    </div>
  );
}
