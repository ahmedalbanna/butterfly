/**
 * Connectivity Detection
 * Detects online/offline status and provides subscription API
 */

type ConnectivityListener = (isOnline: boolean) => void;

class ConnectivityManager {
  private listeners: Set<ConnectivityListener> = new Set();
  private isOnline: boolean = true;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor() {
    this.isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Initialize connectivity monitoring
   */
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;

    this.initialized = true;

    // Listen to online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Periodic connectivity check every 30 seconds
    this.checkIntervalId = setInterval(() => {
      this.checkConnectivity();
    }, 30000);

    // Initial check
    this.checkConnectivity();
  }

  /**
   * Clean up listeners
   */
  destroy(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
    this.initialized = false;
  }

  /**
   * Check actual connectivity by pinging a lightweight endpoint
   */
  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch('/api/health/ping', {
        method: 'HEAD',
        cache: 'no-store',
      });

      const wasOnline = this.isOnline;
      this.isOnline = response.ok;

      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;

      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    this.notifyListeners();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
    this.notifyListeners();
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.isOnline);
      } catch (error) {
        console.error('[Connectivity] Error in listener:', error);
      }
    });
  }

  /**
   * Subscribe to connectivity changes
   */
  subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current online status
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Check if offline
   */
  getIsOffline(): boolean {
    return !this.isOnline;
  }
}

// Global instance
let instance: ConnectivityManager | null = null;

/**
 * Get or create connectivity manager instance
 */
export function getConnectivityManager(): ConnectivityManager {
  if (!instance) {
    instance = new ConnectivityManager();
    instance.initialize();
  }
  return instance;
}

/**
 * Check if currently online
 */
export function isOnline(): boolean {
  return getConnectivityManager().getIsOnline();
}

/**
 * Check if currently offline
 */
export function isOffline(): boolean {
  return getConnectivityManager().getIsOffline();
}

/**
 * Subscribe to connectivity changes
 */
export function onConnectivityChange(listener: ConnectivityListener): () => void {
  return getConnectivityManager().subscribe(listener);
}
