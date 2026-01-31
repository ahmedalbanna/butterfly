import { NextRequest } from 'next/server';

/**
 * WebRTC Signaling endpoint (using polling fallback)
 * Stores and retrieves signaling messages for WebRTC negotiation
 */

// In-memory storage for signaling messages (consider Redis for production)
const signalingMessages = new Map<string, Array<{
  type: string;
  sender: string;
  data: any;
  timestamp: number;
}>>();

/**
 * Send signaling message (offer, answer, ice-candidate)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callId, type, sender, data } = body;

    if (!callId || !type || !sender) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store signaling message
    if (!signalingMessages.has(callId)) {
      signalingMessages.set(callId, []);
    }

    const messages = signalingMessages.get(callId)!;
    messages.push({
      type,
      sender,
      data,
      timestamp: Date.now(),
    });

    // Keep only last 50 messages and messages from last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const filtered = messages.filter(m => m.timestamp > fiveMinutesAgo).slice(-50);
    signalingMessages.set(callId, filtered);

    console.log(`[Signaling] ${type} from ${sender} for call ${callId.slice(0, 8)}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Signaling] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Poll for signaling messages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    const recipient = searchParams.get('recipient'); // 'customer' or 'admin'
    const since = searchParams.get('since'); // timestamp

    if (!callId || !recipient) {
      return new Response(
        JSON.stringify({ error: 'Missing callId or recipient' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const messages = signalingMessages.get(callId) || [];
    
    // Filter messages for this recipient (sent by the other party)
    const otherSender = recipient === 'customer' ? 'admin' : 'customer';
    let filtered = messages.filter(m => m.sender === otherSender);

    // Filter by timestamp if provided
    if (since) {
      const sinceTimestamp = parseInt(since);
      filtered = filtered.filter(m => m.timestamp > sinceTimestamp);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messages: filtered,
        timestamp: Date.now(),
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        } 
      }
    );
  } catch (error) {
    console.error('[Signaling] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Clear signaling messages for a call (cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return new Response(
        JSON.stringify({ error: 'Missing callId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    signalingMessages.delete(callId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Signaling] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Cleanup old signaling messages every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    for (const [callId, messages] of signalingMessages.entries()) {
      const filtered = messages.filter(m => m.timestamp > fiveMinutesAgo);
      if (filtered.length === 0) {
        signalingMessages.delete(callId);
      } else {
        signalingMessages.set(callId, filtered);
      }
    }
  }, 5 * 60 * 1000);
}
