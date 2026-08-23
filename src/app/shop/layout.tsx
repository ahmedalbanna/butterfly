import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse curated luxury jewelry, watches, bags and accessories at LuxeFinds.',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
