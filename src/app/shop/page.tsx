"use client"

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS, CATEGORIES, MAX_PRODUCT_PRICE, MIN_PRODUCT_PRICE } from '@/lib/products';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, SlidersHorizontal } from 'lucide-react';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRODUCT_PRICE, MAX_PRODUCT_PRICE]);
  const [sort, setSort] = useState<SortOption>('featured');
  const { addToCart } = useCart();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    let out = PRODUCTS.filter(p => {
      const catOk = activeCategory === 'All' || p.category === activeCategory;
      const priceOk = p.price >= priceRange[0] && p.price <= priceRange[1];
      return catOk && priceOk;
    });
    switch (sort) {
      case 'price-asc': out = [...out].sort((a,b) => a.price - b.price); break;
      case 'price-desc': out = [...out].sort((a,b) => b.price - a.price); break;
      case 'name-asc': out = [...out].sort((a,b) => a.name.localeCompare(b.name)); break;
      default: out = [...out].sort((a,b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return out;
  }, [activeCategory, priceRange, sort]);

  const handleAdd = (p: typeof PRODUCTS[number]) => {
    if (p.stock === 0) {
      toast({ title: "Out of stock", description: `${p.name} is unavailable.`, variant: "destructive" });
      return;
    }
    addToCart({ id: p.id, name: p.name, price: p.price, image: p.image });
    toast({ title: "Added to bag", description: `${p.name} added.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-headline">The Boutique</h1>
            <p className="text-muted-foreground mt-2">Curated accessories — {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</p>
          </div>
          <div className="flex gap-3 items-center">
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-[160px] rounded-none">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low → High</SelectItem>
                <SelectItem value="price-desc">Price: High → Low</SelectItem>
                <SelectItem value="name-asc">Name A→Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <div className="border-y py-6 mb-8 space-y-6 bg-card/30 px-4">
          <div className="flex flex-wrap gap-2 items-center">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs uppercase tracking-widest font-bold mr-2">Category</span>
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 ${activeCategory === cat ? 'bg-primary text-white' : ''}`}
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest font-bold mb-3 block">Price range: ${priceRange[0]} — ${priceRange[1].toLocaleString()}</label>
              <Slider
                min={MIN_PRODUCT_PRICE}
                max={MAX_PRODUCT_PRICE}
                step={10}
                value={priceRange}
                onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                <span>${MIN_PRODUCT_PRICE}</span><span>${MAX_PRODUCT_PRICE.toLocaleString()}</span>
              </div>
            </div>
            <Button variant="ghost" onClick={() => { setActiveCategory('All'); setPriceRange([MIN_PRODUCT_PRICE, MAX_PRODUCT_PRICE]); setSort('featured'); }} className="rounded-none uppercase text-xs tracking-widest">
              Reset filters
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed">
            <p className="font-headline text-2xl mb-2">No pieces found</p>
            <p className="text-muted-foreground text-sm">Try adjusting category or price.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map(p => (
              <div key={p.id} className="group bg-card border rounded-sm overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                <Link href={`/product/${p.id}`} className="relative aspect-[4/5] bg-muted overflow-hidden block">
                  <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.featured && <Badge className="absolute top-3 left-3 bg-primary text-white rounded-full text-[10px] uppercase">Featured</Badge>}
                  {p.stock === 0 && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-white text-black px-3 py-1 text-xs uppercase tracking-widest font-bold">Sold out</span></div>}
                  {p.stock >0 && p.stock <=3 && <Badge variant="secondary" className="absolute top-3 right-3 rounded-full text-[10px] uppercase bg-amber-100 text-amber-800">Low stock</Badge>}
                </Link>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{p.category}</span>
                    <span className="text-[10px] text-muted-foreground">SKU {p.sku}</span>
                  </div>
                  <Link href={`/product/${p.id}`} className="font-headline text-lg leading-tight hover:text-primary line-clamp-2">{p.name}</Link>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <span className="font-bold">${p.price.toLocaleString()}</span>
                    <Button size="sm" disabled={p.stock===0} onClick={() => handleAdd(p)} className="rounded-none bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                      <ShoppingBag className="w-3 h-3 mr-2" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
