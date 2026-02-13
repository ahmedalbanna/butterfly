/**
 * Offline Queue System
 * Manages pending requests when offline and syncs when online
 */

import { setIndexedDB, getIndexedDB, getAllIndexedDB, queryIndexedDB, deleteIndexedDB, STORES } from './offline-storage';

export interface QueuedRequest {
  id?: number;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  payload?: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  lastError?: string;
  priority: 'low' | 'normal' | 'high';
}

export type SyncCallback = (request: QueuedRequest, response: Response) => Promise<void>;

class OfflineQueue {
  private syncCallbacks: Map<string, SyncCallback> = new Map();
  private isSyncing = false;

  /**
   * Add a request to the offline queue
   */
  async addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
    const queuedRequest: Omit<QueuedRequest, 'id'> = {
      ...request,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    await setIndexedDB(STORES.QUEUE, queuedRequest);
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<QueuedRequest[]> {
    const allRequests = await getAllIndexedDB<QueuedRequest>(STORES.QUEUE);
    return allRequests
      .filter(r => r.status === 'pending' || r.status === 'failed')
      .sort((a, b) => {
        // Sort by priority, then by timestamp (FIFO)
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    failed: number;
    syncing: number;
  }> {
    const allRequests = await getAllIndexedDB<QueuedRequest>(STORES.QUEUE);
    return {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === 'pending').length,
      failed: allRequests.filter(r => r.status === 'failed').length,
      syncing: allRequests.filter(r => r.status === 'syncing').length,
    };
  }

  /**
   * Register a callback for a specific URL pattern
   * Callback is called after successful sync to process server response
   */
  registerSyncCallback(urlPattern: string, callback: SyncCallback): void {
    this.syncCallbacks.set(urlPattern, callback);
  }

  /**
   * Sync all pending requests
   */
  async syncQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      console.warn('[OfflineQueue] Sync already in progress');
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pendingRequests = await this.getPendingRequests();

      for (const request of pendingRequests) {
        try {
          await this.syncRequest(request);
          synced++;
        } catch (error) {
          failed++;
          console.error('[OfflineQueue] Sync failed for:', request.url, error);
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed };
  }

  /**
   * Sync a single request
   */
  private async syncRequest(request: QueuedRequest): Promise<void> {
    if (!request.id) throw new Error('Request must have an ID');

    // Update status to syncing
    await setIndexedDB(STORES.QUEUE, {
      ...request,
      status: 'syncing',
    });

    try {
      // Make the actual API request
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: request.payload ? JSON.stringify(request.payload) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Call registered callback if exists
      const callback = this.findCallback(request.url);
      if (callback) {
        await callback(request, response);
      }

      // Mark as synced
      await setIndexedDB(STORES.QUEUE, {
        ...request,
        status: 'synced',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const retryCount = request.retryCount + 1;
      const maxRetries = 5;

      if (retryCount < maxRetries) {
        // Mark as failed but retryable
        await setIndexedDB(STORES.QUEUE, {
          ...request,
          status: 'failed',
          retryCount,
          lastError: errorMessage,
        });
      } else {
        // Max retries exceeded, keep as failed
        await setIndexedDB(STORES.QUEUE, {
          ...request,
          status: 'failed',
          retryCount,
          lastError: `Max retries (${maxRetries}) exceeded: ${errorMessage}`,
        });
      }

      throw error;
    }
  }

  /**
   * Find callback for a URL
   */
  private findCallback(url: string): SyncCallback | undefined {
    for (const [pattern, callback] of this.syncCallbacks) {
      if (url.includes(pattern)) {
        return callback;
      }
    }
    return undefined;
  }

  /**
   * Clear synced requests
   */
  async clearSyncedRequests(): Promise<void> {
    const allRequests = await getAllIndexedDB<QueuedRequest>(STORES.QUEUE);
    const syncedRequests = allRequests.filter(r => r.status === 'synced');

    for (const request of syncedRequests) {
      if (request.id) {
        await deleteIndexedDB(STORES.QUEUE, request.id);
      }
    }
  }

  /**
   * Retry failed requests
   */
  async retryFailedRequests(): Promise<{ synced: number; failed: number }> {
    const failedRequests = await queryIndexedDB<QueuedRequest>(STORES.QUEUE, 'status', 'failed');

    // Reset status to pending for retry
    for (const request of failedRequests) {
      if (request.id) {
        await setIndexedDB(STORES.QUEUE, {
          ...request,
          status: 'pending',
        });
      }
    }

    return this.syncQueue();
  }

  /**
   * Check if queue is syncing
   */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }
}

// Global instance
let instance: OfflineQueue | null = null;

/**
 * Get or create offline queue instance
 */
export function getOfflineQueue(): OfflineQueue {
  if (!instance) {
    instance = new OfflineQueue();
  }
  return instance;
}

/**
 * Add request to offline queue
 */
export async function queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<void> {
  return getOfflineQueue().addToQueue(request);
}

/**
 * Sync offline queue
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  return getOfflineQueue().syncQueue();
}
