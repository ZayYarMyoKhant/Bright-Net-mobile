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
