import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Create a new voice call session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, customerName } = body;

    if (!customerId || !customerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create call session
    const session = await prisma.voiceCallSession.create({
      data: {
        customerId,
        customerName,
        status: 'ringing',
      },
    });

    console.log(`[Voice Call] New call initiated: ${session.id.slice(0, 8)} from ${customerName}`);

    return new Response(
      JSON.stringify({
        success: true,
        callId: session.id,
        session,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Voice Call Session] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get call session info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return new Response(
        JSON.stringify({ error: 'Missing callId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await prisma.voiceCallSession.findUnique({
      where: { id: callId },
    });

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Call session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Voice Call Session] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Update call session (accept, decline, end)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { callId, status, adminId, adminName, duration } = body;

    if (!callId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updateData: any = { status };

    if (status === 'active' && adminId) {
      updateData.adminId = adminId;
      updateData.adminName = adminName;
    }

    if (status === 'ended' || status === 'missed' || status === 'declined') {
      updateData.endedAt = new Date();
      if (duration !== undefined) {
        updateData.duration = duration;
      }
    }

    const session = await prisma.voiceCallSession.update({
      where: { id: callId },
      data: updateData,
    });

    console.log(`[Voice Call] Call ${callId.slice(0, 8)} updated to: ${status}`);

    return new Response(
      JSON.stringify({
        success: true,
        session,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Voice Call Session] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
