'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PWA Install Prompt Component
 * Shows install prompt when available on mobile/desktop
 * Allows users to add app to home screen
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    // Listen for app install success
    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed');
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response: ${outcome}`);

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setIsVisible(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Install error:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-primary/95 backdrop-blur-sm border border-primary/50 rounded-lg p-4 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <Download className="w-5 h-5 text-white shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">Install App</h3>
              <p className="text-xs text-white/70">Add to your home screen for quick access</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-colors shrink-0"
            aria-label="Close install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            className="flex-1 bg-white text-primary hover:bg-white/90 h-9 text-xs font-bold uppercase tracking-wider rounded-none"
          >
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10 h-9 text-xs font-bold uppercase tracking-wider rounded-none"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
