import Redis, { Cluster } from 'ioredis';

/**
 * Redis Cluster Manager
 * Provides horizontal scaling with automatic sharding
 * Handles failover and data distribution across cluster nodes
 */

let redisCluster: Cluster | null = null;

/**
 * Initialize Redis Cluster connection
 */
export function createRedisCluster(): Cluster {
  if (redisCluster) {
    return redisCluster;
  }

  const clusterNodes = [
    { host: 'localhost', port: 7001 },
    { host: 'localhost', port: 7002 },
    { host: 'localhost', port: 7003 },
    { host: 'localhost', port: 7004 },
    { host: 'localhost', port: 7005 },
    { host: 'localhost', port: 7006 },
  ];

  redisCluster = new Redis.Cluster(clusterNodes, {
    redisOptions: {
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
    },
    clusterRetryStrategy(times) {
      const delay = Math.min(100 * Math.pow(2, times), 2000);
      console.log(`[Redis Cluster] Retry attempt ${times}, waiting ${delay}ms...`);
      return delay;
    },
    enableReadyCheck: true,
    enableOfflineQueue: true,
    scaleReads: 'all', // Distribute reads across all nodes including replicas
    maxRedirections: 16,
  });

  // Event handlers
  redisCluster.on('connect', () => {
    console.log('[Redis Cluster] Connected to cluster');
  });

  redisCluster.on('ready', () => {
    console.log('[Redis Cluster] Cluster is ready');
  });

  redisCluster.on('error', (err) => {
    console.error('[Redis Cluster] Error:', err);
  });

  redisCluster.on('close', () => {
    console.log('[Redis Cluster] Connection closed');
  });

  redisCluster.on('reconnecting', () => {
    console.log('[Redis Cluster] Reconnecting...');
  });

  redisCluster.on('node error', (err, node) => {
    console.error(`[Redis Cluster] Node error on ${node}:`, err);
  });

  return redisCluster;
}

/**
 * Get Redis Cluster instance
 */
export function getRedisCluster(): Cluster {
  if (!redisCluster) {
    return createRedisCluster();
  }
  return redisCluster;
}

/**
 * Get cluster information
 */
export async function getClusterInfo(): Promise<{
  status: string;
  nodes: number;
  slots: string;
  knownNodes: string;
  size: string;
}> {
  const cluster = getRedisCluster();
  
  try {
    const info = await cluster.cluster('INFO');
    const lines = info.split('\r\n');
    const infoObj: any = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        infoObj[key] = value;
      }
    });

    return {
      status: infoObj.cluster_state || 'unknown',
      nodes: parseInt(infoObj.cluster_size || '0'),
      slots: infoObj.cluster_slots_assigned || '0',
      knownNodes: infoObj.cluster_known_nodes || '0',
      size: infoObj.cluster_size || '0',
    };
  } catch (error) {
    console.error('[Redis Cluster] Failed to get cluster info:', error);
    return {
      status: 'error',
      nodes: 0,
      slots: '0',
      knownNodes: '0',
      size: '0',
    };
  }
}

/**
 * Get cluster nodes information
 */
export async function getClusterNodes(): Promise<any[]> {
  const cluster = getRedisCluster();
  
  try {
    const nodes = await cluster.cluster('NODES');
    const nodeLines = nodes.split('\n').filter(line => line.trim());
    
    return nodeLines.map(line => {
      const parts = line.split(' ');
      return {
        id: parts[0],
        address: parts[1],
        flags: parts[2],
        master: parts[3],
        pingSent: parts[4],
        pongRecv: parts[5],
        configEpoch: parts[6],
        linkState: parts[7],
        slots: parts.slice(8).join(' '),
      };
    });
  } catch (error) {
    console.error('[Redis Cluster] Failed to get cluster nodes:', error);
    return [];
  }
}

/**
 * Check cluster health
 */
export async function checkClusterHealth(): Promise<{
  healthy: boolean;
  nodesOnline: number;
  nodesTotal: number;
  slotsAssigned: number;
  slotsMissing: number;
}> {
  const cluster = getRedisCluster();
  
  try {
    const info = await getClusterInfo();
    const nodes = await getClusterNodes();
    
    const nodesOnline = nodes.filter(n => n.linkState === 'connected').length;
    const slotsAssigned = parseInt(info.slots);
    const slotsMissing = 16384 - slotsAssigned;
    
    const healthy = info.status === 'ok' && slotsMissing === 0 && nodesOnline >= 3;
    
    return {
      healthy,
      nodesOnline,
      nodesTotal: nodes.length,
      slotsAssigned,
      slotsMissing,
    };
  } catch (error) {
    console.error('[Redis Cluster] Health check failed:', error);
    return {
      healthy: false,
      nodesOnline: 0,
      nodesTotal: 0,
      slotsAssigned: 0,
      slotsMissing: 16384,
    };
  }
}

/**
 * Get slot distribution across nodes
 */
export async function getSlotDistribution(): Promise<Map<string, number[]>> {
  const nodes = await getClusterNodes();
  const distribution = new Map<string, number[]>();
  
  nodes.forEach(node => {
    if (node.slots && !node.slots.includes('slave')) {
      const slots: number[] = [];
      const slotRanges = node.slots.split(' ');
      
      slotRanges.forEach(range => {
        if (range.includes('-')) {
          const [start, end] = range.split('-').map(Number);
          for (let i = start; i <= end; i++) {
            slots.push(i);
          }
        } else if (range) {
          slots.push(parseInt(range));
        }
      });
      
      distribution.set(node.id, slots);
    }
  });
  
  return distribution;
}

/**
 * Rebalance cluster slots (admin operation)
 */
export async function rebalanceCluster(): Promise<{
  success: boolean;
  message: string;
}> {
  const cluster = getRedisCluster();
  
  try {
    await cluster.cluster('REBALANCE');
    return {
      success: true,
      message: 'Cluster rebalancing initiated',
    };
  } catch (error) {
    console.error('[Redis Cluster] Rebalance failed:', error);
    return {
      success: false,
      message: `Rebalance failed: ${error}`,
    };
  }
}

/**
 * Close cluster connection
 */
export async function closeRedisCluster(): Promise<void> {
  if (redisCluster) {
    await redisCluster.quit();
    redisCluster = null;
    console.log('[Redis Cluster] Connection closed');
  }
}

/**
 * Cache operations with cluster awareness
 */

export async function clusterGet(key: string): Promise<string | null> {
  const cluster = getRedisCluster();
  return await cluster.get(key);
}

export async function clusterSet(key: string, value: string, ttl?: number): Promise<string | null> {
  const cluster = getRedisCluster();
  
  if (ttl) {
    return await cluster.setex(key, ttl, value);
  } else {
    return await cluster.set(key, value);
  }
}

export async function clusterDel(key: string): Promise<number> {
  const cluster = getRedisCluster();
  return await cluster.del(key);
}

export async function clusterMGet(keys: string[]): Promise<(string | null)[]> {
  const cluster = getRedisCluster();
  return await cluster.mget(...keys);
}

export async function clusterPublish(channel: string, message: string): Promise<number> {
  const cluster = getRedisCluster();
  return await cluster.publish(channel, message);
}

export async function clusterSubscribe(channel: string, callback: (message: string) => void): Promise<void> {
  const cluster = getRedisCluster();
  await cluster.subscribe(channel);
  
  cluster.on('message', (receivedChannel, message) => {
    if (receivedChannel === channel) {
      callback(message);
    }
  });
}

/**
 * Get cluster statistics
 */
export async function getClusterStats(): Promise<{
  totalKeys: number;
  totalMemory: string;
  opsPerSecond: number;
  hitRate: number;
}> {
  const cluster = getRedisCluster();
  const nodes = await getClusterNodes();
  
  let totalKeys = 0;
  let totalMemory = 0;
  let totalOps = 0;
  let totalHits = 0;
  let totalMisses = 0;
  
  try {
    for (const node of nodes.filter(n => n.flags.includes('master'))) {
      const [host, port] = node.address.split(':');
      const nodeClient = new Redis({ host, port: parseInt(port) });
      
      const info = await nodeClient.info('stats');
      const memInfo = await nodeClient.info('memory');
      
      // Parse info
      const parseInfo = (infoStr: string) => {
        const lines = infoStr.split('\r\n');
        const data: any = {};
        lines.forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) data[key] = value;
        });
        return data;
      };
      
      const statsData = parseInfo(info);
      const memData = parseInfo(memInfo);
      
      totalKeys += parseInt(await nodeClient.dbsize() as any);
      totalMemory += parseInt(memData.used_memory || '0');
      totalOps += parseInt(statsData.instantaneous_ops_per_sec || '0');
      totalHits += parseInt(statsData.keyspace_hits || '0');
      totalMisses += parseInt(statsData.keyspace_misses || '0');
      
      await nodeClient.quit();
    }
    
    const hitRate = totalHits + totalMisses > 0 
      ? (totalHits / (totalHits + totalMisses)) * 100 
      : 0;
    
    return {
      totalKeys,
      totalMemory: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`,
      opsPerSecond: totalOps,
      hitRate: parseFloat(hitRate.toFixed(2)),
    };
  } catch (error) {
    console.error('[Redis Cluster] Failed to get stats:', error);
    return {
      totalKeys: 0,
      totalMemory: '0 MB',
      opsPerSecond: 0,
      hitRate: 0,
    };
  }
}

export default {
  create: createRedisCluster,
  get: getRedisCluster,
  getInfo: getClusterInfo,
  getNodes: getClusterNodes,
  checkHealth: checkClusterHealth,
  getStats: getClusterStats,
  close: closeRedisCluster,
};
