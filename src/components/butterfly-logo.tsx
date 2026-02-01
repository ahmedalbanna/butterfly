'use client';

import { cn } from "@/lib/utils";

export function ButterflyLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Left Wing */}
      <path
        d="M12 12C12 12 8 4 4 6C2 8 3 14 7 16C10 17 12 12 12 12Z"
        fill="currentColor"
        className="text-primary"
      />
      {/* Right Wing */}
      <path
        d="M12 12C12 12 16 4 20 6C22 8 21 14 17 16C14 17 12 12 12 12Z"
        fill="currentColor"
        className="text-primary"
      />
      {/* Body */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="1.2" 
        ry="7" 
        fill="currentColor" 
        className="text-secondary" 
      />
      {/* Antennae */}
      <path 
        d="M11 6L9 3" 
        stroke="currentColor" 
        className="text-secondary" 
        strokeWidth="1" 
        strokeLinecap="round" 
      />
      <path 
        d="M13 6L15 3" 
        stroke="currentColor" 
        className="text-secondary" 
        strokeWidth="1" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
