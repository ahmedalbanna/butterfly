import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Real-time update event types
 */
export type RealtimeOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeUpdate {
  type: 'cdc' | 'connected';
  table?: string;
  operation?: RealtimeOperation;
  timestamp: number;
  data?: any;
  tables?: string[];
}

export interface UseRealtimeUpdatesOptions {
  tables?: string[];  // Tables to subscribe to (empty = all tables)
  onUpdate?: (update: RealtimeUpdate) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

/**
 * Hook to subscribe to real-time data updates via Server-Sent Events
 * 
 * @example
 * ```tsx
 * const { isConnected, lastUpdate } = useRealtimeUpdates({
 *   tables: ['Product', 'Order'],
 *   onUpdate: (update) => {
 *     if (update.operation === 'INSERT' && update.table === 'Order') {
 *       console.log('New order created!', update.data);
 *     }
 *   }
 * });
 * ```
 */
export function useRealtimeUpdates({
  tables = [],
  onUpdate,
  onError,
  autoConnect = true,
}: UseRealtimeUpdatesOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const clientIdRef = useRef(`client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    try {
      const url = new URL('/api/realtime/updates', window.location.origin);
      
      if (tables.length > 0) {
        url.searchParams.set('tables', tables.join(','));
      }
      url.searchParams.set('clientId', clientIdRef.current);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[Realtime] Connected to real-time updates');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as RealtimeUpdate;
          
          // Skip connection confirmation messages
          if (update.type === 'connected') {
            console.log('[Realtime] Subscribed to tables:', update.tables);
            return;
          }

          console.log(`[Realtime] Update: ${update.operation} on ${update.table}`);
          setLastUpdate(update);
          onUpdate?.(update);
        } catch (error) {
          console.error('[Realtime] Error parsing update:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Realtime] Connection error:', error);
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;
        
        onError?.('Connection lost. Reconnecting...');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          connect();
        }, 5000);
      };
    } catch (error) {
      console.error('[Realtime] Failed to connect:', error);
      onError?.('Failed to establish real-time connection');
    }
  }, [tables, onUpdate, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log('[Realtime] Disconnected from real-time updates');
    }
  }, []);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !eventSourceRef.current && autoConnect) {
        console.log('[Realtime] Tab visible, reconnecting...');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, autoConnect]);

  return {
    isConnected,
    lastUpdate,
    disconnect,
    reconnect: connect,
  };
}

/**
 * Hook to subscribe to updates for a specific table
 * 
 * @example
 * ```tsx
 * useTableUpdates('Product', (operation, data) => {
 *   if (operation === 'UPDATE') {
 *     refetchProducts();
 *   }
 * });
 * ```
 */
export function useTableUpdates(
  table: string,
  onUpdate: (operation: RealtimeOperation, data: any) => void
) {
  return useRealtimeUpdates({
    tables: [table],
    onUpdate: (update) => {
      if (update.type === 'cdc' && update.table === table && update.operation) {
        onUpdate(update.operation, update.data);
      }
    },
  });
}

/**
 * Hook to subscribe to updates for a specific entity by ID
 * 
 * @example
 * ```tsx
 * const { data, isStale } = useEntityUpdates('Order', orderId, async () => {
 *   return await fetchOrder(orderId);
 * });
 * ```
 */
export function useEntityUpdates<T>(
  table: string,
  entityId: string,
  fetchEntity: () => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchEntity().then(setData);
  }, [entityId]);

  // Subscribe to updates
  useTableUpdates(table, (operation, updateData) => {
    if (updateData?.id === entityId) {
      if (operation === 'DELETE') {
        setData(null);
      } else if (operation === 'UPDATE') {
        // Mark as stale and refetch
        setIsStale(true);
        fetchEntity().then((newData) => {
          setData(newData);
          setIsStale(false);
        });
      }
    }
  });

  return { data, isStale };
}

/**
 * Hook to automatically refetch data when updates occur
 * 
 * @example
 * ```tsx
 * const products = await fetchProducts();
 * useAutoRefresh(['Product'], () => refetchProducts());
 * ```
 */
export function useAutoRefresh(
  tables: string[],
  onRefresh: () => void | Promise<void>
) {
  useRealtimeUpdates({
    tables,
    onUpdate: (update) => {
      if (update.type === 'cdc') {
        console.log(`[AutoRefresh] Refreshing due to ${update.operation} on ${update.table}`);
        onRefresh();
      }
    },
  });
}
