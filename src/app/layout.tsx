
import type {Metadata} from 'next';
import './globals.css';
import {CartProvider} from '@/context/cart-context';
import {VoiceCallProvider} from '@/context/voice-call-context';
import {Toaster} from '@/components/ui/toaster';
import {VoiceCallOverlay} from '@/components/voice-call-overlay';

export const metadata: Metadata = {
  title: 'LuxeFinds | Elegant Accessories',
  description: 'High-end accessories for the modern aesthetic.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground">
        <VoiceCallProvider>
          <CartProvider>
            {children}
            <VoiceCallOverlay />
            <Toaster />
          </CartProvider>
        </VoiceCallProvider>
      </body>
    </html>
  );
}
