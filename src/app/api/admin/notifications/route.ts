import { NextRequest } from 'next/server';
import { createRedisSubscriber } from '@/lib/redis';

/**
 * Server-Sent Events endpoint for real-time admin notifications
 * Subscribes to Redis Pub/Sub channel: admin:notifications
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get('adminId');

  if (!adminId) {
    return new Response(
      JSON.stringify({ error: 'Missing adminId' }),
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
      const channelKey = 'admin:notifications';

      console.log(`[Admin Notifications] Admin ${adminId} subscribed`);

      // Send initial connection confirmation
      const initMessage = `data: ${JSON.stringify({ 
        event: 'connected', 
        timestamp: Date.now() 
      })}\n\n`;
      
      try {
        controller.enqueue(encoder.encode(initMessage));
      } catch (error) {
        console.error('[Admin Notifications] Failed to send init message:', error);
        return;
      }

      // Subscribe to Redis channel
      await subscriber.subscribe(channelKey, (err) => {
        if (err) {
          console.error('[Admin Notifications] Subscription error:', err);
          try {
            controller.close();
          } catch (e) {
            // Controller already closed, ignore
          }
        }
      });

      // Handle incoming notifications
      subscriber.on('message', (channel, message) => {
        if (subscriberClosed) return;

        try {
          const notification = JSON.parse(message);
          
          // Send notification to admin via SSE
          const sseMessage = `data: ${JSON.stringify(notification)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
          
          console.log(`[Admin Notifications] Sent ${notification.event} to admin ${adminId}`);
        } catch (error) {
          console.error('[Admin Notifications] Error processing message:', error);
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
          // Ignore enqueue errors when connection is closed
        }
      }, 30000);

      // Cleanup on close
      const cleanup = async () => {
        if (subscriberClosed) return; // Already cleaned up
        
        subscriberClosed = true;
        clearInterval(keepaliveInterval);
        await subscriber.unsubscribe(channelKey);
        await subscriber.quit();
        
        try {
          controller.close();
        } catch (e) {
          // Controller already closed, ignore
        }
        
        console.log(`[Admin Notifications] Admin ${adminId} disconnected`);
      };

      request.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
