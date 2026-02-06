import { NextRequest } from 'next/server';
import { checkCDCHealth, isCDCActive } from '@/lib/cdc-manager';
import { getRedisClient } from '@/lib/redis';

/**
 * Comprehensive CDC system status endpoint for monitoring
 * Returns detailed status of CDC listener, Redis, and cache statistics
 */
export async function GET(request: NextRequest) {
  try {
    const health = await checkCDCHealth();
    
    // Get cache statistics
    let cacheStats = null;
    try {
      const redis = getRedisClient();
      const info = await redis.info('stats');
      const dbsize = await redis.dbsize();
      const memory = await redis.info('memory');
      
      // Parse info strings
      const parseInfo = (infoStr: string) => {
        const lines = infoStr.split('\r\n');
        const stats: any = {};
        lines.forEach(line => {
          if (line && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            if (key && value) stats[key] = value;
          }
        });
        return stats;
      };
      
      const statsData = parseInfo(info);
      const memoryData = parseInfo(memory);
      
      cacheStats = {
        totalKeys: dbsize,
        keyspaceHits: parseInt(statsData.keyspace_hits || '0'),
        keyspaceMisses: parseInt(statsData.keyspace_misses || '0'),
        hitRate: statsData.keyspace_hits && statsData.keyspace_misses
          ? ((parseInt(statsData.keyspace_hits) / (parseInt(statsData.keyspace_hits) + parseInt(statsData.keyspace_misses))) * 100).toFixed(2) + '%'
          : 'N/A',
        memoryUsed: memoryData.used_memory_human || 'Unknown',
        memoryPeak: memoryData.used_memory_peak_human || 'Unknown',
      };
    } catch (error) {
      console.error('[CDC Status] Cache stats error:', error);
    }
    
    // Get CDC listener statistics
    const cdcActive = isCDCActive();
    
    const response = {
      timestamp: new Date().toISOString(),
      status: health.healthy ? 'healthy' : 'unhealthy',
      components: {
        cdcListener: {
          active: health.listener,
          status: health.listener ? 'running' : 'stopped',
        },
        redis: {
          connected: health.redis,
          status: health.redis ? 'connected' : 'disconnected',
        },
      },
      cache: cacheStats,
      message: health.message,
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: health.healthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[CDC Status] Error:', error);
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'error',
        message: `Status check error: ${error}`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
