
"use client";
import { useEffect, useRef } from 'react';

export function AdsterraNative() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.firstChild) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://pl28770334.effectivegatecpm.com/f69b712ae6b9e8c5427909b208ea75aa/invoke.js';
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full my-4 flex justify-center bg-card rounded-lg overflow-hidden border border-border">
      <div id="container-f69b712ae6b9e8c5427909b208ea75aa" ref={containerRef} className="w-full min-h-[100px]"></div>
    </div>
  );
}
