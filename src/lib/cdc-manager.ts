import { getCDCListener } from './cdc-listener';
import { warmCache, clearAllCache } from './redis-cache';
import { closeRedis } from './redis';

/**
 * CDC Manager - Coordinates startup and shutdown of the CDC system
 * Initializes PostgreSQL listener, Redis cache, and handles graceful shutdown
 */

let isInitialized = false;
let shutdownInProgress = false;

/**
 * Initialize the CDC system
 * Should be called once during application startup
 */
export async function initializeCDC(): Promise<void> {
  if (isInitialized) {
    console.log('[CDC Manager] Already initialized');
    return;
  }

  try {
    console.log('[CDC Manager] Starting CDC system...');

    // 1. Start CDC listener for PostgreSQL NOTIFY events
    const cdcListener = getCDCListener();
    await cdcListener.start();

    // 2. Warm cache with frequently accessed data
    await warmCache();

    // 3. Register shutdown handlers
    registerShutdownHandlers();

    isInitialized = true;
    console.log('[CDC Manager] ✅ CDC system initialized successfully');
  } catch (error) {
    console.error('[CDC Manager] ❌ Failed to initialize CDC system:', error);
    throw error;
  }
}

/**
 * Shutdown the CDC system gracefully
 */
export async function shutdownCDC(): Promise<void> {
  if (shutdownInProgress) {
    console.log('[CDC Manager] Shutdown already in progress');
    return;
  }

  if (!isInitialized) {
    console.log('[CDC Manager] Not initialized, nothing to shutdown');
    return;
  }

  try {
    shutdownInProgress = true;
    console.log('[CDC Manager] Shutting down CDC system...');

    // 1. Stop CDC listener
    const cdcListener = getCDCListener();
    await cdcListener.stop();

    // 2. Close Redis connections
    await closeRedis();

    isInitialized = false;
    shutdownInProgress = false;
    console.log('[CDC Manager] ✅ CDC system shutdown complete');
  } catch (error) {
    console.error('[CDC Manager] ❌ Error during shutdown:', error);
    shutdownInProgress = false;
  }
}

/**
 * Register handlers for graceful shutdown
 */
function registerShutdownHandlers(): void {
  // Handle process termination signals
  process.on('SIGTERM', async () => {
    console.log('[CDC Manager] Received SIGTERM signal');
    await shutdownCDC();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[CDC Manager] Received SIGINT signal');
    await shutdownCDC();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    console.error('[CDC Manager] Uncaught exception:', error);
    await shutdownCDC();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('[CDC Manager] Unhandled rejection:', reason);
    await shutdownCDC();
    process.exit(1);
  });

  console.log('[CDC Manager] Shutdown handlers registered');
}

/**
 * Check if CDC system is active
 */
export function isCDCActive(): boolean {
  return isInitialized;
}

/**
 * Health check for CDC system
 */
export async function checkCDCHealth(): Promise<{
  healthy: boolean;
  listener: boolean;
  redis: boolean;
  message: string;
}> {
  try {
    const cdcListener = getCDCListener();
    const listenerActive = cdcListener.isActive();

    // Try a simple Redis operation to check connectivity
    let redisHealthy = false;
    try {
      const { getRedisClient } = await import('./redis');
      const redis = getRedisClient();
      await redis.ping();
      redisHealthy = true;
    } catch (error) {
      console.error('[CDC Manager] Redis health check failed:', error);
    }

    const healthy = listenerActive && redisHealthy;

    return {
      healthy,
      listener: listenerActive,
      redis: redisHealthy,
      message: healthy
        ? 'CDC system is healthy'
        : `CDC system unhealthy: Listener=${listenerActive}, Redis=${redisHealthy}`,
    };
  } catch (error) {
    console.error('[CDC Manager] Health check failed:', error);
    return {
      healthy: false,
      listener: false,
      redis: false,
      message: `Health check failed: ${error}`,
    };
  }
}

/**
 * Restart CDC system (for recovery scenarios)
 */
export async function restartCDC(): Promise<void> {
  console.log('[CDC Manager] Restarting CDC system...');
  await shutdownCDC();
  
  // Wait a bit before restarting
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await initializeCDC();
  console.log('[CDC Manager] ✅ CDC system restarted');
}

/**
 * Clear all cached data (use with caution)
 */
export async function clearCache(): Promise<void> {
  console.log('[CDC Manager] Clearing all cache...');
  await clearAllCache();
  console.log('[CDC Manager] ✅ Cache cleared');
}

export default {
  initializeCDC,
  shutdownCDC,
  isCDCActive,
  checkCDCHealth,
  restartCDC,
  clearCache,
};
