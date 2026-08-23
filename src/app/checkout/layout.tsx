import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Secure luxury checkout at LuxeFinds.',
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
