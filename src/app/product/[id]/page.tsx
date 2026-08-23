"use client"

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { PRODUCTS } from '@/lib/products';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ShoppingBag, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const product = PRODUCTS.find(p => p.id === id);

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl font-headline mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">The piece you seek is no longer in our boutique.</p>
          <Link href="/shop">
            <Button className="bg-primary text-white">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const activeImage = product.images[activeImageIndex] || product.image;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently unavailable.`,
        variant: "destructive",
      });
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    toast({
      title: "Added to bag",
      description: `${product.name} has been added to your boutique bag.`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-8">
          <Link href="/shop" className="hover:text-primary">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/shop?category=${product.category}`} className="hover:text-primary">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-bold truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-muted overflow-hidden rounded-sm shadow-sm group">
              <Image 
                src={activeImage} 
                alt={`${product.name} - view ${activeImageIndex + 1}`} 
                fill 
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-opacity duration-300"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Badge variant="destructive" className="text-sm uppercase tracking-widest px-4 py-2 rounded-none">Sold Out</Badge>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(0, 4).map((img, idx) => (
                <button
                  key={`${product.id}-thumb-${idx}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View ${product.name} image ${idx + 1}`}
                  className={cn(
                    "aspect-square relative bg-muted rounded-sm overflow-hidden border-2 transition-all",
                    activeImageIndex === idx ? "border-primary opacity-100" : "border-transparent opacity-70 hover:opacity-100 hover:border-primary/30"
                  )}
                >
                   <Image src={img} alt={`${product.name} thumbnail ${idx + 1}`} fill className="object-cover" sizes="20vw" />
                </button>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">SKU: {product.sku} • {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
          </div>

          {/* Details */}
          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl md:text-5xl font-headline">{product.name}</h1>
                {product.featured && <Badge className="bg-primary text-white rounded-full uppercase text-[10px] tracking-widest">Featured</Badge>}
              </div>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-body font-light">${product.price.toLocaleString()}</p>
                {isLowStock && <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Low stock</span>}
                {isOutOfStock && <span className="text-xs font-bold uppercase tracking-widest text-destructive">Out of stock</span>}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <Button 
              size="lg" 
              disabled={isOutOfStock}
              className="w-full h-14 rounded-none bg-primary text-white text-lg font-bold tracking-widest uppercase hover:bg-primary/90 disabled:opacity-50"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="mr-2 h-5 w-5" /> {isOutOfStock ? 'Out of Stock' : 'Add To Bag'}
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y">
              <div className="flex flex-col items-center text-center space-y-2">
                <Truck className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <RefreshCcw className="w-5 h-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Easy Returns</span>
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="uppercase text-xs tracking-widest font-bold">Materials</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {product.materials}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="uppercase text-xs tracking-widest font-bold">Care Instructions</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {product.care}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="uppercase text-xs tracking-widest font-bold">Sustainability</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Our materials are ethically sourced and hand-crafted in small batches to minimize waste and ensure the highest quality standards.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}
