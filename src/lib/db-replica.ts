import { PrismaClient } from '@prisma/client';

/**
 * PostgreSQL Read Replica Manager
 * Distributes read queries across read replicas for load balancing
 * Write queries always go to primary
 */

// Primary database (writes)
const primaryUrl = process.env.DATABASE_URL;

// Read replicas (reads only)
const replicaUrls = [
  process.env.DATABASE_REPLICA_1_URL || 'postgresql://postgres:postgres@localhost:5433/postgres',
  process.env.DATABASE_REPLICA_2_URL || 'postgresql://postgres:postgres@localhost:5434/postgres',
];

// Primary Prisma client (for writes)
export const prismaWrite = new PrismaClient({
  datasources: {
    db: {
      url: primaryUrl,
    },
  },
  log: ['error', 'warn'],
});

// Read replica clients (for reads)
const prismaReadClients = replicaUrls.map(
  (url) =>
    new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
      log: ['error', 'warn'],
    })
);

// Current replica index (round-robin)
let currentReplicaIndex = 0;

/**
 * Get read-only Prisma client (load balanced across replicas)
 */
export function getPrismaRead(): PrismaClient {
  // Round-robin selection
  const client = prismaReadClients[currentReplicaIndex];
  currentReplicaIndex = (currentReplicaIndex + 1) % prismaReadClients.length;
  
  return client;
}

/**
 * Get write Prisma client (always primary)
 */
export function getPrismaWrite(): PrismaClient {
  return prismaWrite;
}

/**
 * Smart routing: Automatically choose primary or replica
 */
export function getPrisma(operation: 'read' | 'write'): PrismaClient {
  return operation === 'write' ? getPrismaWrite() : getPrismaRead();
}

/**
 * Execute query with automatic retry on replica failure
 */
export async function executeWithRetry<T>(
  operation: 'read' | 'write',
  queryFn: (prisma: PrismaClient) => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const prisma = getPrisma(operation);
      return await queryFn(prisma);
    } catch (error) {
      lastError = error;
      console.error(`[DB] Query attempt ${attempt + 1} failed:`, error);
      
      // If read operation failed, try another replica
      if (operation === 'read' && attempt < maxRetries) {
        console.log('[DB] Retrying with different replica...');
        continue;
      }
      
      // If write operation failed or max retries reached, throw
      break;
    }
  }
  
  throw lastError;
}

/**
 * Health check for replicas
 */
export async function checkReplicaHealth(): Promise<{
  primary: boolean;
  replicas: boolean[];
  lag: number[];
}> {
  const health = {
    primary: false,
    replicas: [] as boolean[],
    lag: [] as number[],
  };

  // Check primary
  try {
    await prismaWrite.$queryRaw`SELECT 1`;
    health.primary = true;
  } catch (error) {
    console.error('[DB] Primary health check failed:', error);
  }

  // Check each replica
  for (let i = 0; i < prismaReadClients.length; i++) {
    try {
      await prismaReadClients[i].$queryRaw`SELECT 1`;
      health.replicas[i] = true;

      // Check replication lag
      try {
        const result = await prismaReadClients[i].$queryRaw<any[]>`
          SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag_seconds
        `;
        health.lag[i] = result[0]?.lag_seconds || 0;
      } catch (lagError) {
        health.lag[i] = -1; // Unknown lag
      }
    } catch (error) {
      console.error(`[DB] Replica ${i + 1} health check failed:`, error);
      health.replicas[i] = false;
      health.lag[i] = -1;
    }
  }

  return health;
}

/**
 * Get replication statistics
 */
export async function getReplicationStats(): Promise<{
  slots: any[];
  connections: any[];
  lag: any[];
}> {
  try {
    const [slots, connections, lag] = await Promise.all([
      // Replication slots
      prismaWrite.$queryRaw`
        SELECT slot_name, active, restart_lsn, confirmed_flush_lsn
        FROM pg_replication_slots
      `,
      
      // Active replication connections
      prismaWrite.$queryRaw`
        SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn
        FROM pg_stat_replication
      `,
      
      // Replication lag
      prismaWrite.$queryRaw`
        SELECT client_addr,
               pg_wal_lsn_diff(sent_lsn, replay_lsn) as lag_bytes,
               EXTRACT(EPOCH FROM (now() - reply_time)) as lag_seconds
        FROM pg_stat_replication
      `,
    ]);

    return { slots, connections, lag };
  } catch (error) {
    console.error('[DB] Failed to get replication stats:', error);
    return { slots: [], connections: [], lag: [] };
  }
}

/**
 * Close all database connections
 */
export async function disconnectAll(): Promise<void> {
  await prismaWrite.$disconnect();
  await Promise.all(prismaReadClients.map((client) => client.$disconnect()));
  console.log('[DB] All connections closed');
}

export default {
  read: getPrismaRead,
  write: getPrismaWrite,
  executeWithRetry,
  checkHealth: checkReplicaHealth,
  getStats: getReplicationStats,
  disconnect: disconnectAll,
};
