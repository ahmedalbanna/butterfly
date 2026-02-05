import { useEffect, useRef, useState, useCallback } from 'react';

export type AdminNotificationEvent = 
  | 'new-call' 
  | 'call-answered' 
  | 'call-ended' 
  | 'call-missed'
  | 'call-cancelled';

export interface AdminNotification {
  event: AdminNotificationEvent;
  data: any;
  timestamp: number;
}

interface UseAdminNotificationsOptions {
  adminId: string;
  onNotification?: (notification: AdminNotification) => void;
  onError?: (error: string) => void;
}

export function useAdminNotifications({
  adminId,
  onNotification,
  onError,
}: UseAdminNotificationsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<AdminNotification | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    try {
      const url = new URL('/api/admin/notifications', window.location.origin);
      url.searchParams.set('adminId', adminId);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[Admin Notifications] Connected');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as AdminNotification;
          
          // Skip connection confirmation messages
          if (notification.event === 'connected' as any) {
            return;
          }

          console.log('[Admin Notifications] Received:', notification.event);
          setLastNotification(notification);
          onNotification?.(notification);
        } catch (error) {
          console.error('[Admin Notifications] Error parsing message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Admin Notifications] Connection error:', error);
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
      console.error('[Admin Notifications] Failed to connect:', error);
      onError?.('Failed to establish notification connection');
    }
  }, [adminId, onNotification, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log('[Admin Notifications] Disconnected');
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !eventSourceRef.current) {
        console.log('[Admin Notifications] Tab visible, reconnecting...');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect]);

  return {
    isConnected,
    lastNotification,
    disconnect,
    reconnect: connect,
  };
}
