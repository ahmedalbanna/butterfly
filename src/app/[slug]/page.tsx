'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCategoryBySlug } from '@/app/actions/categories';
import { getProductsByCategorySlug } from '@/app/actions/products';
import { Product, Category } from '@prisma/client';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ButterflyLogo } from '@/components/butterfly-logo';
import { ArrowLeft, ShoppingBag, Sparkles, Star, ChevronRight, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [catData, prodData] = await Promise.all([
          getCategoryBySlug(slug),
          getProductsByCategorySlug(slug)
        ]);
        setCategory(catData);
        setProducts(prodData);
      } catch (error) {
        console.error('Error loading category page:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
    toast({
      title: "Added to Bag",
      description: `${product.name} has been added to your curated selection.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <Package className="w-16 h-16 text-white/10 mb-6" />
        <h1 className="text-4xl font-headline italic mb-4">Segment Not Found</h1>
        <p className="text-white/40 mb-8 max-w-md">This luxury segment is currently not in our active collection.</p>
        <Link href="/">
          <Button className="bg-primary hover:bg-white hover:text-primary transition-all rounded-none uppercase tracking-widest px-8">
            Return to Boutique
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 w-full bg-black/60 backdrop-blur-xl border-b border-white/5 h-20 flex items-center px-6 md:px-12">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-primary/20 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all">
              <ButterflyLogo className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-headline font-bold tracking-tighter text-primary">Butterfly Store</h1>
              <p className="text-[7px] uppercase tracking-[0.3em] text-white/40 font-bold -mt-1">Luxury Boutique</p>
            </div>
          </Link>

        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 space-y-20">
        {/* Hero Section */}
        <header className="max-w-3xl space-y-6">
          
        <div className="flex items-center gap-6">
            <Link href="/" className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40 hover:text-primary transition-colors flex items-center gap-2">
              <ArrowLeft className="w-3 h-3" /> Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
            <Badge variant="outline" className="rounded-none border-primary/30 text-primary uppercase text-[8px] tracking-[0.4em] px-4 py-1 bg-primary/5">
              Collection Segment
            </Badge>
            <div className="h-px w-20 bg-white/10" />
          </div>
          <h1 className="text-5xl md:text-7xl font-headline italic tracking-tighter animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            {category.name}
          </h1>
          <p className="text-lg md:text-xl text-white/60 font-body leading-relaxed animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
            {category.description || `Explore our meticulously curated selection of ${category.name.toLowerCase()}, where craftsmanship meets timeless elegance.`}
          </p>
        </header>

        {/* Product Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.length === 0 ? (
            <div className="col-span-full py-32 text-center border border-dashed border-white/10 bg-white/[0.02]">
              <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-4" />
              <p className="font-headline italic text-2xl text-white/40">Curating new additions for this segment...</p>
            </div>
          ) : (
            products.map((product, idx) => (
              <div 
                key={product.id} 
                className="group relative flex flex-col bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Visual Asset */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900">
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
                      className="w-full h-12 bg-primary text-white hover:bg-white hover:text-primary rounded-none uppercase tracking-widest text-[10px] font-bold shadow-2xl"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" /> Add To Bag
                    </Button>
                  </div>
                </div>

                {/* Information */}
                <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-2xl font-headline italic leading-tight group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <span className="font-mono text-lg text-primary/80">${product.price.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4">{product.materials}</p>
                    <p className="text-sm text-white/60 line-clamp-2 italic font-light">{product.description}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] uppercase tracking-[0.3em] text-white/20 font-bold">Ref. Piece #{product.id.slice(-6).toUpperCase()}</span>
                    <ChevronRight className="w-4 h-4 text-primary/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Note */}
        <footer className="pt-20 border-t border-white/10 text-center space-y-6">
          <div className="inline-flex items-center gap-4 text-white/10 text-[8px] uppercase tracking-[0.6em] font-bold">
            Certified Luxury Acquisition • Butterfly Store Ledger
          </div>
          <p className="text-[10px] text-white/30 italic max-w-xl mx-auto leading-loose">
            Each piece in our segment collection is verified for its aesthetic integrity and material excellence. Butterfly Store represents the pinnacle of digital curation for the modern collector.
          </p>
        </footer>
      </main>
    </div>
  );
}
