import { NextRequest } from 'next/server';
import { getRedisClient } from '@/lib/redis';

/**
 * Redis Health Check Endpoint
 * Returns Redis connection status and Sentinel info if applicable
 */
export async function GET(request: NextRequest) {
  try {
    const redis = getRedisClient();
    const mode = process.env.REDIS_MODE || 'single';
    
    // Basic ping test
    const pingStart = Date.now();
    const pong = await redis.ping();
    const pingLatency = Date.now() - pingStart;
    
    if (pong !== 'PONG') {
      return new Response(
        JSON.stringify({
          status: 'unhealthy',
          mode,
          error: 'Redis ping failed',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Redis info
    const info = await redis.info('server');
    const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';
    
    const health: any = {
      status: 'healthy',
      mode,
      version: redisVersion,
      latency: `${pingLatency}ms`,
      timestamp: new Date().toISOString(),
    };

    // If Sentinel mode, get cluster info
    if (mode === 'sentinel') {
      try {
        // Get current master info
        const role = await redis.role();
        health.role = role[0]; // 'master' or 'slave'
        
        if (role[0] === 'master') {
          health.connectedSlaves = role[2] ? role[2].length : 0;
        } else if (role[0] === 'slave') {
          health.masterHost = role[1];
          health.masterPort = role[2];
          health.replicationStatus = role[3];
        }

        // Get Sentinel info (requires connecting to sentinel directly)
        const sentinelHosts = process.env.REDIS_SENTINEL_HOSTS || 'localhost:26379';
        health.sentinels = sentinelHosts.split(',').length;
        health.masterName = process.env.REDIS_SENTINEL_MASTER || 'mymaster';
        
      } catch (sentinelError) {
        console.error('[Health Check] Sentinel info error:', sentinelError);
        health.sentinelError = 'Could not retrieve Sentinel info';
      }
    }

    // Test a simple set/get operation
    const testKey = 'health:check:test';
    const testValue = Date.now().toString();
    
    await redis.setex(testKey, 10, testValue);
    const retrievedValue = await redis.get(testKey);
    
    if (retrievedValue !== testValue) {
      health.readWriteTest = 'failed';
      health.status = 'degraded';
    } else {
      health.readWriteTest = 'passed';
    }

    // Get some stats
    const dbSize = await redis.dbsize();
    health.keys = dbSize;

    return new Response(
      JSON.stringify(health),
      { 
        status: health.status === 'healthy' ? 200 : 503,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[Health Check] Redis error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        mode: process.env.REDIS_MODE || 'single',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
