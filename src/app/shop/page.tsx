
"use client"

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PRODUCTS, CATEGORIES } from '@/lib/products';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts = activeCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  // مصفوفة تحتوي على 3 أنماط من الإطارات الجذابة لتكرارها في الشبكة
  const productFrames = [
    "border-[10px] border-white shadow-lg", // نمط المعرض
    "outline outline-1 outline-primary/30 outline-offset-4 shadow-sm", // النمط العصري
    "border-2 border-primary/5 p-2 bg-white/30 backdrop-blur-sm" // النمط الفاخر
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <header className="mb-12 space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-headline italic">The Collection</h1>
            <p className="text-secondary max-w-xl">
              Explore our full range of curated accessories, from artisanal jewelry to precision timepieces.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 border-b pb-6">
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                variant="ghost"
                className={cn(
                  "rounded-none px-6 uppercase text-xs tracking-widest font-bold border-b-2 border-transparent transition-all",
                  activeCategory === cat ? "border-primary text-primary" : "text-secondary hover:text-primary"
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-16">
          {filteredProducts.map((product, index) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group flex flex-col">
              <div className={`relative aspect-[4/5] overflow-hidden mb-6 transition-transform duration-500 group-hover:scale-[1.03] ${productFrames[index % 3]}`}>
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {product.featured && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-bold tracking-widest uppercase z-10">
                    Featured
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center">
                <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">{product.category}</span>
                <h3 className="text-lg font-headline transition-colors group-hover:text-primary">{product.name}</h3>
                <p className="text-md font-body text-secondary">${product.price.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <h3 className="text-2xl font-headline">No products found</h3>
            <Button variant="outline" onClick={() => setActiveCategory('All')}>Clear Filter</Button>
          </div>
        )}
      </main>
    </div>
  );
}
