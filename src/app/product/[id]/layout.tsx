import type { Metadata } from 'next';
import { PRODUCTS } from '@/lib/products';

export async function generateStaticParams() {
  return PRODUCTS.map(p => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default function ProductIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
