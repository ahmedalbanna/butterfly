
"use client"

import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { ShoppingBag, Search, Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const { cartCount } = useCart();

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-background">
              <div className="flex flex-col gap-6 mt-12">
                <Link href="/" className="text-xl font-headline hover:text-primary transition-colors">Home</Link>
                <Link href="/shop" className="text-xl font-headline hover:text-primary transition-colors">Shop All</Link>
                <Link href="/ai-stylist" className="text-xl font-headline hover:text-primary transition-colors flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> AI Stylist
                </Link>
              </div>
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="text-3xl font-headline font-bold tracking-tighter text-primary">
            LuxeFinds
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/shop" className="text-sm font-medium hover:text-primary transition-colors">SHOP ALL</Link>
            <Link href="/ai-stylist" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> AI STYLIST
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="w-5 h-5 text-secondary" />
          </Button>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
