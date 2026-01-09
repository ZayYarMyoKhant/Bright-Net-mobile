import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2l-2 5-5 2 5 2 2 5 2-5 5-2-5-2z" fill="hsl(var(--primary))"/>
      <path d="M2 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="hsl(var(--accent))" />
    </svg>
  );
}


export function Rose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
        <path d="M12 2c-2.8 0-5 2.2-5 5 0 1.4.6 2.7 1.5 3.5L6 14h12l-2.5-3.5c.9-.8 1.5-2.1 1.5-3.5 0-2.8-2.2-5-5-5z" fill="#f43f5e" stroke="#f43f5e" />
        <path d="M12 14v8" stroke="#16a34a" />
        <path d="M12 22a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z" />
        <path d="M9 16h6" stroke="#16a34a" />
    </svg>
  );
}
