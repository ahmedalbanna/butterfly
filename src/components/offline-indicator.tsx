'use client';

import { useOffline } from '@/context/offline-context';
import { WifiOff, Wifi, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function OfflineIndicator({ className, showLabel = true }: OfflineIndicatorProps) {
  const { isOnline, isSyncing, queueSize } = useOffline();

  if (isOnline && !isSyncing && queueSize === 0) {
    return null; // Don't show when fully online and no queue
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest',
        isOnline
          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
        className
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          {showLabel && isSyncing && <span>Syncing...</span>}
          {showLabel && !isSyncing && queueSize > 0 && <span>{queueSize} Pending</span>}
          {showLabel && !isSyncing && queueSize === 0 && <span>Online</span>}
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          {showLabel && <span>Offline Mode</span>}
        </>
      )}
    </div>
  );
}

/**
 * Full offline status bar component
 */
export function OfflineStatusBar() {
  const { isOnline, isSyncing, queueSize, failedCount, lastSyncTime, syncNow, retryFailed } = useOffline();

  if (isOnline && !isSyncing && queueSize === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 backdrop-blur-sm p-4 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <Loader className="w-5 h-5 text-primary animate-spin" />
            ) : isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-orange-400" />
            )}
            <span className="text-sm font-bold">
              {isOnline ? (isSyncing ? 'Syncing...' : 'Online') : 'Offline Mode'}
            </span>
          </div>

          {queueSize > 0 && (
            <div className="text-xs text-white/60">
              {queueSize} pending
              {failedCount > 0 && ` (${failedCount} failed)`}
            </div>
          )}

          {lastSyncTime && isOnline && !isSyncing && (
            <div className="text-xs text-white/40">
              Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {failedCount > 0 && isOnline && (
            <button
              onClick={retryFailed}
              disabled={isSyncing}
              className="px-3 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50 transition-colors"
            >
              Retry Failed
            </button>
          )}

          {queueSize > 0 && isOnline && (
            <button
              onClick={syncNow}
              disabled={isSyncing}
              className="px-3 py-1 text-xs font-bold bg-primary/20 text-primary rounded hover:bg-primary/30 disabled:opacity-50 transition-colors"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
