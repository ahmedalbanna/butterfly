'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker } from '@/lib/service-worker-register';

/**
 * Hook to register and manage Service Worker lifecycle
 * Handles SW registration, updates, and error handling
 */
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const registerSW = async () => {
      try {
        const registration = await registerServiceWorker('/service-worker.js');
        setIsRegistered(!!registration);

        // Listen for updates
        if (registration) {
          registration.addEventListener('updatefound', () => {
            console.log('[SW] New update found');
          });

          // Listen for messages from SW
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'SYNC_COMPLETE') {
              console.log('[SW] Offline queue synced:', event.data.payload);
            }
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to register Service Worker';
        setError(errorMessage);
        console.error('[SW] Registration failed:', errorMessage);
      }
    };

    registerSW();
  }, []);

  return { isRegistered, error };
}
