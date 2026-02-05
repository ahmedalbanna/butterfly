'use client';

import { useEffect, useRef } from 'react';
import { useSearch } from '@/context/search-context';
import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, X, ShoppingBag, Loader2, Sparkles, ArrowRight, Star } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function SearchOverlay() {
  const { isOpen, query, results, isLoading, closeSearch, setQuery, performSearch } = useSearch();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    performSearch(val);
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    toast({
      title: "Added to Bag",
      description: `${product.name} has been added to your collection.`,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500 overflow-hidden flex flex-col">
      {/* Search Header */}
      <header className="relative px-6 md:px-12 lg:px-20 py-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="relative flex-1 group">
            <Search className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 transition-colors duration-500",
              isLoading ? "text-primary animate-pulse" : "text-white/20 group-focus-within:text-primary"
            )} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search our elite collection..."
              className="w-full bg-transparent border-none text-3xl md:text-5xl font-headline italic text-white placeholder:text-white/5 focus:outline-none pl-14 md:pl-16 h-20"
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeSearch}
            className="text-white/20 hover:text-white hover:bg-white/10 rounded-full h-14 w-14 border border-white/5 shrink-0"
          >
            <X className="w-8 h-8" />
          </Button>
        </div>
      </header>

      {/* Results Area */}
      <ScrollArea className="flex-1 px-6 md:px-12 lg:px-20 py-12">
        <div className="max-w-7xl mx-auto">
          {!query.trim() ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-30">
              <Sparkles className="w-16 h-16" />
              <div>
                <h3 className="text-2xl font-headline italic mb-2">What are you looking for?</h3>
                <p className="text-xs uppercase tracking-[0.4em] font-bold">Discover our curated luxury assets</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-xs uppercase tracking-[0.4em] font-bold text-white/40">Scouring the Boutique Ledger...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-40">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-headline italic mb-2">No matching pieces found</h3>
                <p className="text-xs uppercase tracking-[0.4em] font-bold">Try adjusting your inquiry parameters</p>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.4em] font-bold text-white/40">
                  {results.length} Pieces found for "{query}"
                </p>
                <div className="h-px flex-1 bg-white/10 ml-8" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {results.map((product, idx) => (
                  <div 
                    key={product.id}
                    className="group flex flex-col bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      
                      {product.featured && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary text-black rounded-none uppercase text-[8px] tracking-widest font-bold border-none">
                            <Star className="w-2.5 h-2.5 mr-1 fill-current" /> Spotlight
                          </Badge>
                        </div>
                      )}

                      <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <Button 
                          onClick={() => handleAddToCart(product)}
                          className="w-full h-12 bg-primary text-white hover:bg-white hover:text-primary rounded-none uppercase tracking-widest text-[10px] font-bold"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" /> Add To Bag
                        </Button>
                      </div>
                    </div>

                    <div className="p-8 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-xl font-headline italic leading-tight text-white group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <span className="font-mono text-lg text-primary/80">${product.price.toLocaleString()}</span>
                      </div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">{product.materials}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Branding */}
      <footer className="px-10 py-8 border-t border-white/10 bg-black text-center">
        <div className="inline-flex items-center gap-4 text-white/10 text-[8px] uppercase tracking-[0.6em] font-bold">
          Butterfly Store Ledger • Secure Discovery Protocol
        </div>
      </footer>
    </div>
  );
}
