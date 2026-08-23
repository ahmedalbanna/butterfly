import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Style AI',
  description: 'Let the Luxe Stylist curate exquisite accessories for your outfit — upload a photo or describe your style.',
};

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
