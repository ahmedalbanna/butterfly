'use client';

/**
 * PWA Configuration and Utilities
 * Handles app shortcuts, badges, and PWA-specific features
 */

/**
 * Register app shortcuts for PWA
 * Shortcuts appear on app icon long-press (Android) or right-click (desktop)
 */
export function registerAppShortcuts() {
  if (!navigator.serviceWorker) return;

  const shortcuts = [
    {
      name: 'Shop Now',
      short_name: 'Shop',
      description: 'Browse our collection',
      url: '/?source=pwa_shortcut',
      icons: [
        {
          src: '/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
    {
      name: 'View Cart',
      short_name: 'Cart',
      description: 'View your shopping cart',
      url: '/checkout?source=pwa_shortcut',
      icons: [
        {
          src: '/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
    {
      name: 'Admin Panel',
      short_name: 'Admin',
      description: 'Access admin dashboard',
      url: '/admin?source=pwa_shortcut',
      icons: [
        {
          src: '/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
      ],
    },
  ];

  // Update manifest with shortcuts (would need to be done server-side)
  console.log('[PWA] App shortcuts configured:', shortcuts);
}

/**
 * Request notification permission for badges and notifications
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('[PWA] Notification permission error:', error);
      return false;
    }
  }

  return false;
}

/**
 * Set app badge (shows notification count on app icon)
 * Android 4.4+ / Chrome 81+
 */
export async function setAppBadge(count: number) {
  if (!navigator.setAppBadge) {
    console.log('[PWA] Badge API not supported');
    return;
  }

  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
  } catch (error) {
    console.error('[PWA] Badge API error:', error);
  }
}

/**
 * Clear app badge
 */
export async function clearAppBadge() {
  if (!navigator.clearAppBadge) return;

  try {
    await navigator.clearAppBadge();
  } catch (error) {
    console.error('[PWA] Clear badge error:', error);
  }
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

/**
 * Share content using Web Share API
 */
export async function shareContent(
  title: string,
  text: string,
  url: string
) {
  if (!navigator.share) {
    console.log('[PWA] Web Share API not supported');
    return false;
  }

  try {
    await navigator.share({
      title,
      text,
      url,
    });
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('[PWA] Share error:', error);
    }
    return false;
  }
}

/**
 * Check if Web Share API is available
 */
export function isShareAPIAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Initialize all PWA features
 */
export function initializePWA() {
  if (typeof window === 'undefined') return;

  // Register shortcuts
  registerAppShortcuts();

  // Log standalone mode status
  console.log('[PWA] Standalone mode:', isStandaloneMode());

  // Request notification permission (optional)
  requestNotificationPermission().catch(() => {
    console.log('[PWA] Notification permission skipped');
  });
}
