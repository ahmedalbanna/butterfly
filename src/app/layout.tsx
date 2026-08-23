import type {Metadata} from 'next';
import { Alegreya } from 'next/font/google';
import './globals.css';
import {CartProvider} from '@/context/cart-context';
import {VoiceCallProvider} from '@/context/voice-call-context';
import {ChatProvider} from '@/context/chat-context';
import {Toaster} from '@/components/ui/toaster';
import {VoiceCallOverlay} from '@/components/voice-call-overlay';
import {ChatOverlay} from '@/components/chat-overlay';

const alegreya = Alegreya({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400','500','600','700','800'],
  style: ['normal','italic'],
  variable: '--font-alegreya',
});

export const metadata: Metadata = {
  title: {
    default: 'LuxeFinds | Elegant Accessories',
    template: '%s | LuxeFinds',
  },
  description: 'High-end accessories for the modern aesthetic — jewelry, watches, bags curated by The Luxe Stylist.',
  metadataBase: new URL('https://luxefinds.example.com'),
  openGraph: {
    title: 'LuxeFinds | Elegant Accessories',
    description: 'Curated luxury jewelry, watches and bags. Cinematic boutique + AI stylist.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LuxeFinds | Elegant Accessories',
    description: 'Curated luxury — cinematic boutique experience.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={alegreya.variable}>
      <body className="font-body antialiased min-h-screen bg-background text-foreground">
        <ChatProvider>
          <VoiceCallProvider>
            <CartProvider>
              {children}
              <VoiceCallOverlay />
              <ChatOverlay />
              <Toaster />
            </CartProvider>
          </VoiceCallProvider>
        </ChatProvider>
      </body>
    </html>
  );
}
