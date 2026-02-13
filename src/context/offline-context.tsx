'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { isOnline, onConnectivityChange } from '@/lib/connectivity';
import { syncOfflineQueue } from '@/lib/offline-queue';

interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  queueSize: number;
  failedCount: number;
  lastSyncTime: number | null;
  syncNow: () => Promise<void>;
  retryFailed: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const offlineState = useOfflineMode();

  return (
    <OfflineContext.Provider value={offlineState}>
      {children}
    </OfflineContext.Provider>
  );
}

/**
 * Hook to access offline context
 */
export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
}

/**
 * Check if currently online (without requiring context)
 */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());

    const unsubscribe = onConnectivityChange(setOnline);
    return () => unsubscribe();
  }, []);

  return online;
}

/**
 * Check if currently offline (without requiring context)
 */
export function useIsOffline(): boolean {
  return !useIsOnline();
}
