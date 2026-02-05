import { NextRequest } from 'next/server';
import {
  setAdminPresence,
  refreshAdminHeartbeat,
  getAdminPresence,
  getOnlineAdmins,
} from '@/lib/redis';

/**
 * Get admin presence information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');
    const action = searchParams.get('action'); // 'online' | 'single'

    if (action === 'online') {
      // Get all online admins
      const admins = await getOnlineAdmins();
      
      return new Response(
        JSON.stringify({
          success: true,
          admins,
          count: admins.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (adminId) {
      // Get specific admin presence
      const presence = await getAdminPresence(adminId);
      
      return new Response(
        JSON.stringify({
          success: true,
          presence,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Missing adminId or action parameter' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin Presence] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Set or update admin presence
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, adminName, status, activeCall } = body;

    if (!adminId || !adminName || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['online', 'away', 'offline'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be online, away, or offline' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await setAdminPresence(adminId, status, adminName, activeCall || null);

    console.log(`[Admin Presence] ${adminName} (${adminId}) is now ${status}`);

    return new Response(
      JSON.stringify({
        success: true,
        status,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin Presence] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Refresh admin heartbeat (called every 30 seconds)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return new Response(
        JSON.stringify({ error: 'Missing adminId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await refreshAdminHeartbeat(adminId);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: Date.now(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Admin Presence] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
