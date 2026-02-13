'use client';

import { useState, useEffect, useCallback } from 'react';
import { isOnline, onConnectivityChange } from '@/lib/connectivity';
import { syncOfflineQueue, getOfflineQueue } from '@/lib/offline-queue';

export interface OfflineModeState {
  isOnline: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  queueSize: number;
  failedCount: number;
  lastSyncTime: number | null;
}

/**
 * Hook to manage offline mode state and sync
 */
export function useOfflineMode(): OfflineModeState & {
  syncNow: () => Promise<void>;
  retryFailed: () => Promise<void>;
} {
  const [isOnlineState, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Update queue stats
  const updateQueueStats = useCallback(async () => {
    const queue = getOfflineQueue();
    const stats = await queue.getQueueStats();
    setQueueSize(stats.pending);
    setFailedCount(stats.failed);
  }, []);

  // Sync now
  const syncNow = useCallback(async () => {
    if (!isOnlineState) {
      console.warn('[useOfflineMode] Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    try {
      const queue = getOfflineQueue();
      await queue.syncQueue();
      await updateQueueStats();
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('[useOfflineMode] Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnlineState, updateQueueStats]);

  // Retry failed requests
  const retryFailed = useCallback(async () => {
    if (!isOnlineState) {
      console.warn('[useOfflineMode] Cannot retry while offline');
      return;
    }

    setIsSyncing(true);
    try {
      const queue = getOfflineQueue();
      await queue.retryFailedRequests();
      await updateQueueStats();
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('[useOfflineMode] Retry error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnlineState, updateQueueStats]);

  // Initialize
  useEffect(() => {
    // Set initial state
    setIsOnline(isOnline());
    updateQueueStats();

    // Subscribe to connectivity changes
    const unsubscribe = onConnectivityChange((online) => {
      setIsOnline(online);

      // Auto-sync when coming online
      if (online) {
        console.log('[useOfflineMode] Back online, syncing queue...');
        syncNow();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [syncNow, updateQueueStats]);

  return {
    isOnline: isOnlineState,
    isOffline: !isOnlineState,
    isSyncing,
    queueSize,
    failedCount,
    lastSyncTime,
    syncNow,
    retryFailed,
  };
}
