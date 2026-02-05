import { useEffect, useRef, useState, useCallback } from 'react';

export type AdminPresenceStatus = 'online' | 'away' | 'offline';

export interface AdminPresence {
  adminId: string;
  status: AdminPresenceStatus;
  name: string;
  lastSeen: number;
  activeCall: string | null;
}

interface UseAdminPresenceOptions {
  adminId: string;
  adminName: string;
  initialStatus?: AdminPresenceStatus;
  activeCall?: string | null;
}

export function useAdminPresence({
  adminId,
  adminName,
  initialStatus = 'online',
  activeCall,
}: UseAdminPresenceOptions) {
  const [status, setStatus] = useState<AdminPresenceStatus>(initialStatus);
  const [isOnline, setIsOnline] = useState(true);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update presence status
  const updatePresence = useCallback(async (newStatus: AdminPresenceStatus) => {
    try {
      await fetch('/api/admin/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          adminName,
          status: newStatus,
          activeCall: activeCall || null,
        }),
      });
      
      setStatus(newStatus);
      console.log(`[Admin Presence] Status updated to: ${newStatus}`);
    } catch (error) {
      console.error('[Admin Presence] Failed to update status:', error);
    }
  }, [adminId, adminName, activeCall]);

  // Send heartbeat to refresh presence
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch('/api/admin/presence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });
    } catch (error) {
      console.error('[Admin Presence] Failed to send heartbeat:', error);
    }
  }, [adminId]);

  // Start heartbeat (every 30 seconds)
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      return; // Already running
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (isOnline) {
        sendHeartbeat();
      }
    }, 30000); // 30 seconds

    console.log('[Admin Presence] Heartbeat started');
  }, [sendHeartbeat, isOnline]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log('[Admin Presence] Heartbeat stopped');
    }
  }, []);

  // Set initial presence and start heartbeat
  useEffect(() => {
    updatePresence(initialStatus);
    startHeartbeat();

    return () => {
      stopHeartbeat();
      // Set offline on unmount
      updatePresence('offline');
    };
  }, []);

  // Handle online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Admin Presence] Network online');
      setIsOnline(true);
      updatePresence('online');
      startHeartbeat();
    };

    const handleOffline = () => {
      console.log('[Admin Presence] Network offline');
      setIsOnline(false);
      stopHeartbeat();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePresence, startHeartbeat, stopHeartbeat]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Admin Presence] Tab hidden, setting away');
        updatePresence('away');
      } else {
        console.log('[Admin Presence] Tab visible, setting online');
        updatePresence('online');
        sendHeartbeat(); // Immediate heartbeat on return
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updatePresence, sendHeartbeat]);

  // Update active call when it changes
  useEffect(() => {
    if (status !== 'offline') {
      updatePresence(status);
    }
  }, [activeCall]);

  return {
    status,
    isOnline,
    updatePresence,
    sendHeartbeat,
  };
}

/**
 * Hook to get all online admins
 */
export function useOnlineAdmins() {
  const [admins, setAdmins] = useState<AdminPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnlineAdmins = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/presence?action=online');
      const data = await response.json();
      
      if (data.success) {
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error('[Admin Presence] Failed to fetch online admins:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineAdmins();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchOnlineAdmins, 30000);
    
    return () => clearInterval(interval);
  }, [fetchOnlineAdmins]);

  return {
    admins,
    isLoading,
    refresh: fetchOnlineAdmins,
  };
}
