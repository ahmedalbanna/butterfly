
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { getProductPageData } from '@/app/actions/page-data';
import { Button } from '@/components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ChevronRight, ShoppingBag, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { AddToCartButton } from './add-to-cart-button';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { product, relatedProducts } = await getProductPageData(params.id);

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl font-headline mb-4">Product not found</h1>
          <Link href="/">
            <Button className="bg-primary text-white">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-secondary mb-8">
          <Link href="/" className="hover:text-primary">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-bold">{product.category}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-muted overflow-hidden rounded-sm shadow-sm">
              <Image 
                src={product.image} 
                alt={product.name} 
                fill 
                priority
                className="object-cover"
              />
            </div>
            {/* Mock thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square relative bg-muted cursor-pointer hover:opacity-80 transition-opacity rounded-sm overflow-hidden">
                   <Image src={product.image} alt="alt" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-headline">{product.name}</h1>
              <p className="text-2xl font-body font-light">${product.price.toLocaleString()}</p>
            </div>

            <p className="text-secondary leading-relaxed">
              {product.description}
            </p>

            <AddToCartButton 
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image
              }}
            />

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
                <AccordionContent className="text-secondary leading-relaxed">
                  {product.materials}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="uppercase text-xs tracking-widest font-bold">Care Instructions</AccordionTrigger>
                <AccordionContent className="text-secondary leading-relaxed">
                  {product.care}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="uppercase text-xs tracking-widest font-bold">Sustainability</AccordionTrigger>
                <AccordionContent className="text-secondary leading-relaxed">
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
