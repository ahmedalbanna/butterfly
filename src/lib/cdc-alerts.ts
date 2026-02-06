import { getRedisClient, publishAdminNotification } from './redis';

/**
 * CDC Alert System
 * Monitors CDC health and sends alerts when failures are detected
 */

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface CDCAlert {
  level: AlertLevel;
  component: 'listener' | 'redis' | 'cache' | 'system';
  message: string;
  timestamp: Date;
  details?: any;
}

class CDCAlertManager {
  private alertHistory: CDCAlert[] = [];
  private maxHistorySize = 100;
  private alertCallbacks: Array<(alert: CDCAlert) => void> = [];

  /**
   * Send an alert
   */
  async sendAlert(alert: CDCAlert): Promise<void> {
    // Store in history
    this.alertHistory.unshift(alert);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }

    // Log to console
    const logLevel = alert.level === 'critical' || alert.level === 'error' ? 'error' : 'warn';
    console[logLevel](`[CDC Alert] [${alert.level.toUpperCase()}] ${alert.component}: ${alert.message}`, alert.details || '');

    // Send to Redis for persistence
    try {
      const redis = getRedisClient();
      await redis.lpush('cdc:alerts', JSON.stringify(alert));
      await redis.ltrim('cdc:alerts', 0, 99); // Keep last 100 alerts
      await redis.expire('cdc:alerts', 86400 * 7); // Keep for 7 days
    } catch (error) {
      console.error('[CDC Alert] Failed to persist alert to Redis:', error);
    }

    // Send admin notification for critical/error alerts
    if (alert.level === 'critical' || alert.level === 'error') {
      try {
        await publishAdminNotification('cdc-alert', {
          level: alert.level,
          component: alert.component,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
        });
      } catch (error) {
        console.error('[CDC Alert] Failed to send admin notification:', error);
      }
    }

    // Trigger callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('[CDC Alert] Callback error:', error);
      }
    });
  }

  /**
   * Register callback for alerts
   */
  onAlert(callback: (alert: CDCAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 20): CDCAlert[] {
    return this.alertHistory.slice(0, limit);
  }

  /**
   * Get alerts from Redis
   */
  async getPersistedAlerts(limit: number = 50): Promise<CDCAlert[]> {
    try {
      const redis = getRedisClient();
      const alerts = await redis.lrange('cdc:alerts', 0, limit - 1);
      return alerts.map(a => JSON.parse(a));
    } catch (error) {
      console.error('[CDC Alert] Failed to fetch persisted alerts:', error);
      return [];
    }
  }

  /**
   * Clear alert history
   */
  clearHistory(): void {
    this.alertHistory = [];
  }
}

// Singleton instance
let alertManager: CDCAlertManager | null = null;

export function getCDCAlertManager(): CDCAlertManager {
  if (!alertManager) {
    alertManager = new CDCAlertManager();
  }
  return alertManager;
}

/**
 * Helper functions for sending alerts
 */

export async function alertCDCListenerFailed(error: any): Promise<void> {
  const manager = getCDCAlertManager();
  await manager.sendAlert({
    level: 'critical',
    component: 'listener',
    message: 'CDC listener failed to start or disconnected',
    timestamp: new Date(),
    details: { error: error?.message || String(error) },
  });
}

export async function alertRedisDisconnected(error: any): Promise<void> {
  const manager = getCDCAlertManager();
  await manager.sendAlert({
    level: 'error',
    component: 'redis',
    message: 'Redis connection lost',
    timestamp: new Date(),
    details: { error: error?.message || String(error) },
  });
}

export async function alertCacheHighMemory(usedMemory: string, threshold: string): Promise<void> {
  const manager = getCDCAlertManager();
  await manager.sendAlert({
    level: 'warning',
    component: 'cache',
    message: 'Redis memory usage is high',
    timestamp: new Date(),
    details: { usedMemory, threshold },
  });
}

export async function alertCacheLowHitRate(hitRate: number, threshold: number): Promise<void> {
  const manager = getCDCAlertManager();
  await manager.sendAlert({
    level: 'warning',
    component: 'cache',
    message: 'Cache hit rate is below threshold',
    timestamp: new Date(),
    details: { hitRate: `${hitRate}%`, threshold: `${threshold}%` },
  });
}

export async function alertCDCReconnecting(attempt: number, maxAttempts: number): Promise<void> {
  const manager = getCDCAlertManager();
  await manager.sendAlert({
    level: 'warning',
    component: 'listener',
    message: `CDC listener reconnecting (attempt ${attempt}/${maxAttempts})`,
    timestamp: new Date(),
    details: { attempt, maxAttempts },
  });
}

export async function alertSystemHealthy(): Promise<void> {
  const manager = getCDCAlertManager();
  await manager.sendAlert({
    level: 'info',
    component: 'system',
    message: 'CDC system is healthy and operational',
    timestamp: new Date(),
  });
}

export default getCDCAlertManager;
