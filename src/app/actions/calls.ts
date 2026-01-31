'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Get all active/ringing calls
export async function getActiveCalls() {
  try {
    const calls = await prisma.voiceCallSession.findMany({
      where: {
        status: {
          in: ['ringing', 'active'],
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return {
      success: true,
      calls,
    };
  } catch (error) {
    console.error('Failed to fetch active calls:', error);
    return {
      success: false,
      error: 'Failed to load active calls',
      calls: [],
    };
  }
}

// Get call history
export async function getCallHistory(limit = 50) {
  try {
    const calls = await prisma.voiceCallSession.findMany({
      where: {
        status: {
          in: ['ended', 'missed', 'declined'],
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      calls,
    };
  } catch (error) {
    console.error('Failed to fetch call history:', error);
    return {
      success: false,
      error: 'Failed to load call history',
      calls: [],
    };
  }
}

// Get incoming call count
export async function getIncomingCallCount() {
  try {
    const count = await prisma.voiceCallSession.count({
      where: {
        status: 'ringing',
      },
    });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('Failed to fetch incoming call count:', error);
    return {
      success: false,
      count: 0,
    };
  }
}

// Get call statistics
export async function getCallStats() {
  try {
    const [total, active, missed, averageDuration] = await Promise.all([
      prisma.voiceCallSession.count(),
      prisma.voiceCallSession.count({ where: { status: 'active' } }),
      prisma.voiceCallSession.count({ where: { status: 'missed' } }),
      prisma.voiceCallSession.aggregate({
        where: { 
          status: 'ended',
          duration: { not: null },
        },
        _avg: { duration: true },
      }),
    ]);

    return {
      success: true,
      stats: {
        total,
        active,
        missed,
        averageDuration: Math.round(averageDuration._avg.duration || 0),
      },
    };
  } catch (error) {
    console.error('Failed to fetch call stats:', error);
    return {
      success: false,
      error: 'Failed to load call stats',
      stats: {
        total: 0,
        active: 0,
        missed: 0,
        averageDuration: 0,
      },
    };
  }
}

// End a call and update duration
export async function endCall(callId: string, duration: number) {
  try {
    const call = await prisma.voiceCallSession.update({
      where: { id: callId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        duration,
      },
    });

    revalidatePath('/admin/calls');

    return {
      success: true,
      call,
    };
  } catch (error) {
    console.error('Failed to end call:', error);
    return {
      success: false,
      error: 'Failed to end call',
    };
  }
}

// Mark call as missed
export async function markCallMissed(callId: string) {
  try {
    const call = await prisma.voiceCallSession.update({
      where: { id: callId },
      data: {
        status: 'missed',
        endedAt: new Date(),
      },
    });

    revalidatePath('/admin/calls');

    return {
      success: true,
      call,
    };
  } catch (error) {
    console.error('Failed to mark call as missed:', error);
    return {
      success: false,
      error: 'Failed to update call status',
    };
  }
}
