
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/products';
import { X, ArrowDown, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShowcasePage() {
  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black hide-scrollbar">
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Back Button */}
      <Link href="/" className="fixed top-8 right-8 z-50">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-12 w-12 border border-white/20 backdrop-blur-md">
          <X className="w-6 h-6" />
        </Button>
      </Link>

      {/* Floating Logo */}
      <div className="fixed top-8 left-8 z-50">
        <h2 className="text-2xl font-headline font-bold text-primary tracking-tighter">LuxeFinds</h2>
      </div>

      {PRODUCTS.map((product, index) => (
        <section 
          key={product.id} 
          className="h-screen w-full snap-start relative flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Image with immersive effect */}
          <div className="absolute inset-0 z-0">
            <Image 
              src={product.image} 
              alt={product.name} 
              fill 
              priority={index === 0}
              className="object-cover opacity-70 scale-105"
            />
            {/* Dark Overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent hidden md:block" />
          </div>

          {/* Content Container - Generalized across the page */}
          <div className="relative z-10 container mx-auto px-6 md:px-12 h-full flex flex-col justify-center text-white">
            <div className="max-w-4xl space-y-12">
              
              {/* Category & Badge */}
              <div className="animate-in slide-in-from-left duration-700">
                <span className="inline-block py-1 px-4 border border-primary text-primary font-bold tracking-[0.4em] uppercase text-[10px] mb-4">
                  {product.category}
                </span>
                <h1 className="text-6xl md:text-9xl font-headline italic leading-none drop-shadow-2xl">
                  {product.name}
                </h1>
              </div>

              {/* Specs Grid: Price & Materials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-l-2 border-primary/50 pl-8 py-4 animate-in slide-in-from-left delay-200 duration-700">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold">Price Point</p>
                  <p className="text-4xl md:text-5xl font-body font-light">${product.price.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold">Material Composition</p>
                  <p className="text-lg md:text-xl italic font-body text-white/90 leading-relaxed">
                    {product.materials}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 animate-in fade-in slide-in-from-bottom delay-500 duration-700">
                <Link href={`/product/${product.id}`}>
                  <Button className="bg-primary hover:bg-primary/90 text-white rounded-none px-12 h-16 text-sm font-bold uppercase tracking-widest transition-all hover:px-16">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Shop Piece
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button variant="outline" className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 rounded-none px-12 h-16 text-sm font-bold uppercase tracking-widest">
                    Browse More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Vertical Navigation Indicator */}
          {index < PRODUCTS.length - 1 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
               <span className="text-[10px] uppercase tracking-[0.5em] text-white font-bold">Scroll</span>
               <ArrowDown className="text-white w-4 h-4" />
            </div>
          )}

          {/* Side Progress Indicator */}
          <div className="fixed right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-4 z-40">
            {PRODUCTS.map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-8 transition-all duration-500 ${index === i ? 'bg-primary scale-x-150' : 'bg-white/20'}`} 
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
