/**
 * Service Worker Registration
 * Registers the service worker and handles sync messages
 */

import { syncOfflineQueue } from './offline-queue';

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('[SW] Registered successfully:', registration);

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Check for updates periodically
    setInterval(() => {
      registration.update().catch((error) => {
        console.error('[SW] Update check error:', error);
      });
    }, 60 * 60 * 1000); // Check every hour
  } catch (error) {
    console.error('[SW] Registration failed:', error);
  }
}

/**
 * Handle messages from service worker
 */
function handleServiceWorkerMessage(event: ExtendableMessageEvent) {
  const { data } = event;

  if (data.type === 'SYNC_OFFLINE_QUEUE') {
    console.log('[SW] Received sync request from service worker');
    syncOfflineQueue().catch((error) => {
      console.error('[SW] Sync error:', error);
    });
  }
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('[SW] Background sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.sync) {
      await registration.sync.register('sync-offline-queue');
      console.log('[SW] Background sync requested');
    }
  } catch (error) {
    console.error('[SW] Background sync request failed:', error);
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Unregistered successfully');
    }
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
  }
}
