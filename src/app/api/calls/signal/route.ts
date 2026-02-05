import { NextRequest } from 'next/server';
import { getRedisClient } from '@/lib/redis';

/**
 * WebRTC Signaling endpoint using Redis
 * Stores and retrieves signaling messages for WebRTC negotiation
 */

const MESSAGE_TTL = 600; // 10 minutes
const MAX_MESSAGES = 50;

interface SignalingMessage {
  type: string;
  sender: string;
  data: any;
  timestamp: number;
}

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

    const redis = getRedisClient();
    const messageKey = `signal:${callId}:messages`;
    const channelKey = `signal:${callId}:channel`;

    // Create message object
    const message: SignalingMessage = {
      type,
      sender,
      data,
      timestamp: Date.now(),
    };

    // Store message in Redis list
    await redis.rpush(messageKey, JSON.stringify(message));

    // Set TTL on the message list
    await redis.expire(messageKey, MESSAGE_TTL);

    // Trim list to keep only last MAX_MESSAGES
    await redis.ltrim(messageKey, -MAX_MESSAGES, -1);

    // Publish notification to channel for real-time delivery
    await redis.publish(channelKey, JSON.stringify(message));

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
 * Poll for signaling messages (fallback for clients without SSE support)
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

    const redis = getRedisClient();
    const messageKey = `signal:${callId}:messages`;

    // Get all messages from Redis
    const rawMessages = await redis.lrange(messageKey, 0, -1);
    const messages: SignalingMessage[] = rawMessages.map(msg => JSON.parse(msg));
    
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

    const redis = getRedisClient();
    const messageKey = `signal:${callId}:messages`;

    // Delete the messages list from Redis
    await redis.del(messageKey);

    console.log(`[Signaling] Cleaned up messages for call ${callId.slice(0, 8)}`);

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
