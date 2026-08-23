import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Bag',
  description: 'Your LuxeFinds boutique bag.',
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
