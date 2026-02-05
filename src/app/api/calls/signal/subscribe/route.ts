import { NextRequest } from 'next/server';
import { createRedisSubscriber } from '@/lib/redis';

/**
 * Server-Sent Events endpoint for real-time signaling notifications
 * Uses Redis Pub/Sub to eliminate polling
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('callId');
  const recipient = searchParams.get('recipient'); // 'customer' or 'admin'

  if (!callId || !recipient) {
    return new Response(
      JSON.stringify({ error: 'Missing callId or recipient' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let subscriberClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Create dedicated Redis subscriber
      const subscriber = createRedisSubscriber();
      const channelKey = `signal:${callId}:channel`;

      console.log(`[SSE] Client subscribed to call ${callId.slice(0, 8)} as ${recipient}`);

      // Send initial connection confirmation
      const initMessage = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(initMessage));

      // Filter messages for this recipient (sent by the other party)
      const otherSender = recipient === 'customer' ? 'admin' : 'customer';

      // Subscribe to Redis channel
      await subscriber.subscribe(channelKey, (err) => {
        if (err) {
          console.error('[SSE] Subscription error:', err);
          controller.close();
        }
      });

      // Handle incoming messages
      subscriber.on('message', (channel, message) => {
        if (subscriberClosed) return;

        try {
          const parsed = JSON.parse(message);
          
          // Only send messages meant for this recipient
          if (parsed.sender === otherSender) {
            const sseMessage = `data: ${JSON.stringify(parsed)}\n\n`;
            controller.enqueue(encoder.encode(sseMessage));
          }
        } catch (error) {
          console.error('[SSE] Error processing message:', error);
        }
      });

      // Send keepalive every 30 seconds
      const keepaliveInterval = setInterval(() => {
        if (subscriberClosed) {
          clearInterval(keepaliveInterval);
          return;
        }
        
        try {
          const keepalive = `: keepalive ${Date.now()}\n\n`;
          controller.enqueue(encoder.encode(keepalive));
        } catch (error) {
          clearInterval(keepaliveInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', async () => {
        subscriberClosed = true;
        clearInterval(keepaliveInterval);
        await subscriber.unsubscribe(channelKey);
        await subscriber.quit();
        controller.close();
        console.log(`[SSE] Client disconnected from call ${callId.slice(0, 8)}`);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}
