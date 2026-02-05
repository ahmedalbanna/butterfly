'use server';

import { prisma } from '@/lib/db';
import { VoiceCallSession } from '@prisma/client';
import { getRedisClient } from '@/lib/redis';

/**
 * Get all call sessions
 */
export async function getAllCallSessions(): Promise<VoiceCallSession[]> {
  try {
    const calls = await prisma.voiceCallSession.findMany({
      orderBy: { startedAt: 'desc' }
    });
    return calls;
  } catch (error) {
    console.error('Error fetching call sessions:', error);
    return [];
  }
}

/**
 * Get calls by status
 */
export async function getCallsByStatus(status: string): Promise<VoiceCallSession[]> {
  try {
    const calls = await prisma.voiceCallSession.findMany({
      where: { status },
      orderBy: { startedAt: 'desc' }
    });
    return calls;
  } catch (error) {
    console.error('Error fetching calls by status:', error);
    return [];
  }
}

/**
 * Get call statistics (with Redis caching)
 */
export async function getCallStats(): Promise<{
  total: number;
  ringing: number;
  active: number;
  ended: number;
  missed: number;
  declined: number;
  totalDuration: number;
  averageDuration: number;
}> {
  try {
    const redis = getRedisClient();
    const cacheKey = 'cache:call-stats';
    
    // Try to get from cache first
    const cached = await redis.hgetall(cacheKey);
    
    if (cached && cached.total) {
      console.log('[Admin Calls] Returning cached stats');
      return {
        total: parseInt(cached.total),
        ringing: parseInt(cached.ringing),
        active: parseInt(cached.active),
        ended: parseInt(cached.ended),
        missed: parseInt(cached.missed),
        declined: parseInt(cached.declined),
        totalDuration: parseInt(cached.totalDuration),
        averageDuration: parseInt(cached.averageDuration),
      };
    }

    // Cache miss - query database
    const [total, ringing, active, ended, missed, declined, durationResult] = await Promise.all([
      prisma.voiceCallSession.count(),
      prisma.voiceCallSession.count({ where: { status: 'ringing' } }),
      prisma.voiceCallSession.count({ where: { status: 'active' } }),
      prisma.voiceCallSession.count({ where: { status: 'ended' } }),
      prisma.voiceCallSession.count({ where: { status: 'missed' } }),
      prisma.voiceCallSession.count({ where: { status: 'declined' } }),
      prisma.voiceCallSession.aggregate({
        _sum: {
          duration: true
        },
        _avg: {
          duration: true
        },
        where: {
          duration: {
            not: null
          }
        }
      })
    ]);

    const stats = {
      total,
      ringing,
      active,
      ended,
      missed,
      declined,
      totalDuration: durationResult._sum.duration || 0,
      averageDuration: Math.round(durationResult._avg.duration || 0)
    };

    // Store in cache with 5-minute TTL
    await redis.hset(cacheKey, stats as any);
    await redis.expire(cacheKey, 300); // 5 minutes
    
    console.log('[Admin Calls] Stats cached for 5 minutes');

    return stats;
  } catch (error) {
    console.error('Error fetching call stats:', error);
    return {
      total: 0,
      ringing: 0,
      active: 0,
      ended: 0,
      missed: 0,
      declined: 0,
      totalDuration: 0,
      averageDuration: 0
    };
  }
}

/**
 * Update call status (invalidates cache)
 */
export async function updateCallStatus(
  callId: string,
  status: string,
  adminId?: string,
  adminName?: string
): Promise<VoiceCallSession | null> {
  try {
    const data: any = { status };
    
    if (adminId) data.adminId = adminId;
    if (adminName) data.adminName = adminName;
    if (status === 'ended' || status === 'declined') {
      data.endedAt = new Date();
    }

    const call = await prisma.voiceCallSession.update({
      where: { id: callId },
      data
    });

    // Invalidate cache
    const redis = getRedisClient();
    await redis.del('cache:call-stats');
    await redis.del('cache:recent-calls');
    console.log('[Admin Calls] Cache invalidated after status update');

    return call;
  } catch (error) {
    console.error('Error updating call status:', error);
    return null;
  }
}

/**
 * Delete a call session
 */
export async function deleteCallSession(callId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.voiceCallSession.delete({
      where: { id: callId }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting call session:', error);
    return {
      success: false,
      error: 'Failed to delete call session'
    };
  }
}

/**
 * Get recent calls (last 24 hours) with Redis caching
 */
export async function getRecentCalls(): Promise<VoiceCallSession[]> {
  try {
    const redis = getRedisClient();
    const cacheKey = 'cache:recent-calls';
    
    // Try to get from cache first
    const cachedIds = await redis.lrange(cacheKey, 0, 9); // Get 10 recent calls
    
    if (cachedIds.length > 0) {
      console.log('[Admin Calls] Returning cached recent calls');
      
      // Fetch full call data from database
      const calls = await prisma.voiceCallSession.findMany({
        where: {
          id: {
            in: cachedIds
          }
        },
        orderBy: { startedAt: 'desc' }
      });
      
      return calls;
    }

    // Cache miss - query database
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const calls = await prisma.voiceCallSession.findMany({
      where: {
        startedAt: {
          gte: yesterday
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    // Store call IDs in cache
    if (calls.length > 0) {
      const callIds = calls.map(call => call.id);
      await redis.del(cacheKey); // Clear old cache
      await redis.rpush(cacheKey, ...callIds);
      await redis.expire(cacheKey, 300); // 5 minutes
      
      console.log('[Admin Calls] Recent calls cached for 5 minutes');
    }

    return calls;
  } catch (error) {
    console.error('Error fetching recent calls:', error);
    return [];
  }
}

/**
 * Get calls by customer ID
 */
export async function getCallsByCustomer(customerId: string): Promise<VoiceCallSession[]> {
  try {
    const calls = await prisma.voiceCallSession.findMany({
      where: { customerId },
      orderBy: { startedAt: 'desc' }
    });
    return calls;
  } catch (error) {
    console.error('Error fetching customer calls:', error);
    return [];
  }
}

/**
 * Answer an incoming call (removes from queue)
 */
export async function answerCall(
  callId: string,
  adminId: string,
  adminName: string
): Promise<VoiceCallSession | null> {
  try {
    const call = await prisma.voiceCallSession.update({
      where: { id: callId },
      data: {
        status: 'active',
        adminId,
        adminName
      }
    });

    // Remove from queue and invalidate cache
    const redis = getRedisClient();
    await redis.lrem('calls:queue', 1, callId);
    await redis.del(`calls:queue:${callId}`);
    await redis.del('cache:call-stats');
    await redis.del('cache:recent-calls');

    console.log(`[Admin Call] Call ${callId.slice(0, 8)} answered by ${adminName}`);
    return call;
  } catch (error) {
    console.error('Error answering call:', error);
    return null;
  }
}
