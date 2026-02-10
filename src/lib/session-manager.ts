/**
 * Session Management Utilities
 * Handles JWT token validation, refresh, and cleanup
 */

import { prisma } from '@/lib/db';
import { JWTPayload, verifyJWT } from '@/lib/auth';

/**
 * Get a session by JWT token
 */
export async function getSession(token: string): Promise<JWTPayload | null> {
  if (!token) return null;

  // Verify and decode JWT
  const decoded = verifyJWT(token);
  if (!decoded) return null;

  // Verify user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, isAdmin: true },
  });

  if (!user) return null;

  return decoded;
}

/**
 * Validate a session token
 */
export async function validateSession(token: string): Promise<{ valid: boolean; user?: JWTPayload }> {
  const session = await getSession(token);
  if (!session) {
    return { valid: false };
  }

  return { valid: true, user: session };
}

/**
 * Invalidate all sessions for a user (logout everywhere)
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(token: string): Promise<void> {
  try {
    const decoded = verifyJWT(token);
    if (!decoded) return;

    await prisma.session.deleteMany({
      where: { userId: decoded.userId, token },
    });
  } catch (error) {
    // Token already invalid
  }
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  return prisma.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get session statistics
 */
export async function getSessionStats() {
  const totalSessions = await prisma.session.count();
  const activeSessions = await prisma.session.count({
    where: {
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  const expiredSessions = totalSessions - activeSessions;

  return {
    totalSessions,
    activeSessions,
    expiredSessions,
  };
}

/**
 * Session activity tracker (useful for security audits)
 */
export interface SessionActivity {
  userId: string;
  action: 'login' | 'logout' | 'refresh' | 'passwordChange';
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// In-memory store for session activity (replace with database in production)
const sessionActivityLog: SessionActivity[] = [];

/**
 * Log session activity
 */
export function logSessionActivity(activity: SessionActivity): void {
  sessionActivityLog.push(activity);

  // Keep only last 1000 entries in memory
  if (sessionActivityLog.length > 1000) {
    sessionActivityLog.shift();
  }

  // In production, save to database or logging service
  if (process.env.LOG_LEVEL === 'debug') {
    console.log('[Session Activity]', activity);
  }
}

/**
 * Get session activity log for a user
 */
export function getUserActivityLog(userId: string, limit: number = 50): SessionActivity[] {
  return sessionActivityLog
    .filter((activity) => activity.userId === userId)
    .slice(-limit);
}
