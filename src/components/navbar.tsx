"use client"

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButterflyLogo } from '@/components/butterfly-logo';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-primary/20 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all">
            <ButterflyLogo className="w-6 h-6" />
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
