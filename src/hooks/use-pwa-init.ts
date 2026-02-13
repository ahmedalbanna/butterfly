'use client';

import { useEffect } from 'react';
import { initializePWA } from '@/lib/pwa-config';

/**
 * Hook to initialize PWA features on app load
 * Handles app shortcuts, badges, notifications, etc.
 */
export function usePWAInit() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Initialize PWA features
    initializePWA();

    // Log PWA status
    console.log('[PWA] Features initialized');
  }, []);
}
