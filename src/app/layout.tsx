import type {Metadata} from 'next';
import './globals.css';
import {CartProvider} from '@/context/cart-context';
import {VoiceCallProvider} from '@/context/voice-call-context';
import {ChatProvider} from '@/context/chat-context';
import {SearchProvider} from '@/context/search-context';
import {Toaster} from '@/components/ui/toaster';
import {VoiceCallOverlay} from '@/components/voice-call-overlay';
import {ChatOverlay} from '@/components/chat-overlay';
import {SearchOverlay} from '@/components/search-overlay';
import {AuthProvider} from '@/context/auth-context';
import {OfflineProvider} from '@/context/offline-context';
import {OfflineIndicator} from '@/components/offline-indicator';
import {OfflineSetup} from '@/components/offline-setup';
import {PWAInstallPrompt} from '@/components/pwa-install-prompt';

export const metadata: Metadata = {
  title: 'Butterfly Store | Elegant Accessories',
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
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background text-foreground">
        <AuthProvider>
          <OfflineProvider>
            <OfflineSetup />
            <SearchProvider>
              <ChatProvider>
                <VoiceCallProvider>
                  <CartProvider>
                    {children}
                    <OfflineIndicator />
                    <PWAInstallPrompt />
                    <VoiceCallOverlay />
                    <ChatOverlay />
                    <SearchOverlay />
                    <Toaster />
                  </CartProvider>
                </VoiceCallProvider>
              </ChatProvider>
            </SearchProvider>
          </OfflineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
