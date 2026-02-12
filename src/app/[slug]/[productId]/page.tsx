'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@prisma/client';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ButterflyLogo } from '@/components/butterfly-logo';
import { ArrowLeft, ShoppingBag, Sparkles, Star, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductById } from '@/app/actions/products';
import ProductImageGallery from '@/components/product-image-gallery';
import ProductQASection from '@/components/product-qa-section';

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = use(params);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      try {
        const data = await getProductById(productId);
        setProduct(data);
      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [productId, toast]);

  const handleAddToCart = () => {
    if (product) {
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
    }
  };

  const images = product?.images && product.images.length > 0 ? product.images : [product?.image || ''];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <Sparkles className="w-16 h-16 text-white/10 mb-6" />
        <h1 className="text-4xl font-headline italic mb-4">Item Not Found</h1>
        <p className="text-white/40 mb-8 max-w-md">This exquisite piece is not in our active collection.</p>
        <Link href={`/${slug}`}>
          <Button className="bg-primary hover:bg-white hover:text-primary transition-all rounded-none uppercase tracking-widest px-8">
            Return to Collection
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

          <div className="flex items-center gap-4">
            <Link href={`/${slug}`}>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Link href="/checkout">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <ShoppingBag className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery Section */}
          <div className="flex flex-col gap-6">
            <ProductImageGallery 
              images={images}
              productName={product.name}
              selectedIndex={selectedImageIndex}
              onSelectIndex={setSelectedImageIndex}
            />
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col gap-8">
            {/* Product Header */}
            <div className="space-y-4">
              <h1 className="text-5xl font-headline italic font-bold leading-tight">{product.name}</h1>
              <p className="text-3xl font-headline italic text-primary">${product.price.toFixed(2)}</p>
              
              {product.featured && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  <span className="text-sm uppercase tracking-widest text-primary font-bold">Featured Collection</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-4 border-y border-white/10 py-8">
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white/60 mb-3">Description</h3>
                <p className="text-white/80 leading-relaxed font-body">{product.description}</p>
              </div>
            </div>

            {/* Materials & Care */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white/60">Materials</h3>
                <p className="text-white/80 font-body text-sm leading-relaxed">{product.materials}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white/60">Care Instructions</h3>
                <p className="text-white/80 font-body text-sm leading-relaxed">{product.care}</p>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                product.stock > 0 ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm text-white/60">
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-primary hover:bg-white hover:text-primary text-white transition-all rounded-none uppercase tracking-widest py-6 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Add to Bag
              </Button>
            </div>
          </div>
        </div>

        {/* Product Q&A Section */}
        <div className="mt-20 pt-12 border-t border-white/10">
          <ProductQASection productId={product.id} productName={product.name} />
        </div>
      </div>
    </div>
  );
}
