
"use client"

import Link from 'next/link';
import { Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500">
            <Sparkles className="text-white w-4 h-4 -rotate-45 group-hover:-rotate-90 transition-transform duration-500" />
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tighter text-primary">
            LuxeFinds
          </h1>
        </Link>
        
        <Link href="/contact">
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="h-4 w-4" />
            Contact Us
          </Button>
        </Link>
      </div>
    </nav>
  );
}
