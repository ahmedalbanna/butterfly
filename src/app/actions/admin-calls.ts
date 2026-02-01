'use server';

import { prisma } from '@/lib/db';
import { VoiceCallSession } from '@prisma/client';

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
 * Get call statistics
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

    return {
      total,
      ringing,
      active,
      ended,
      missed,
      declined,
      totalDuration: durationResult._sum.duration || 0,
      averageDuration: Math.round(durationResult._avg.duration || 0)
    };
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
 * Update call status
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
 * Get recent calls (last 24 hours)
 */
export async function getRecentCalls(): Promise<VoiceCallSession[]> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const calls = await prisma.voiceCallSession.findMany({
      where: {
        startedAt: {
          gte: yesterday
        }
      },
      orderBy: { startedAt: 'desc' }
    });
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
 * Answer an incoming call
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

    console.log(`[Admin Call] Call ${callId.slice(0, 8)} answered by ${adminName}`);
    return call;
  } catch (error) {
    console.error('Error answering call:', error);
    return null;
  }
}
