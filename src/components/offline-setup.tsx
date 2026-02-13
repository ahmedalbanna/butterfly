'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';
import { usePWAInit } from '@/hooks/use-pwa-init';
import { useEffect } from 'react';

/**
 * Component to initialize offline and PWA features
 * Registers Service Worker, sets up offline listeners, and initializes PWA
 * Must be rendered inside OfflineProvider
 */
export function OfflineSetup() {
  const { isRegistered, error } = useServiceWorker();
  usePWAInit();

  useEffect(() => {
    if (error) {
      console.warn('[Offline] SW registration error:', error);
    }
    if (isRegistered) {
      console.log('[Offline] Service Worker registered successfully');
    }
  }, [isRegistered, error]);

  // Component doesn't render anything, just initializes
  return null;
}
