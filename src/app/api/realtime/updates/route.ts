import { NextRequest } from 'next/server';
import { createRedisSubscriber } from '@/lib/redis';

/**
 * Server-Sent Events endpoint for real-time data updates
 * Subscribes to Redis Pub/Sub channels and broadcasts CDC events to clients
 * 
 * Query parameters:
 * - tables: Comma-separated list of tables to subscribe to (e.g., "product,order,message")
 * - clientId: Unique client identifier for logging
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tables = searchParams.get('tables')?.split(',') || [];
  const clientId = searchParams.get('clientId') || 'unknown';

  // Create SSE stream
  const encoder = new TextEncoder();
  let subscriberClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Create dedicated Redis subscriber
      const subscriber = createRedisSubscriber();
      
      console.log(`[Realtime] Client ${clientId} connected, subscribing to tables: ${tables.join(', ') || 'all'}`);

      // Send initial connection confirmation
      const initMessage = `data: ${JSON.stringify({ 
        type: 'connected',
        timestamp: Date.now(),
        tables: tables.length > 0 ? tables : ['all'],
      })}\n\n`;
      
      try {
        controller.enqueue(encoder.encode(initMessage));
      } catch (error) {
        console.error('[Realtime] Failed to send init message:', error);
        return;
      }

      // Determine which channels to subscribe to
      const channels: string[] = [];
      
      if (tables.length === 0) {
        // Subscribe to all updates
        channels.push('realtime:updates');
      } else {
        // Subscribe to specific table channels
        for (const table of tables) {
          channels.push(`realtime:${table.toLowerCase()}`);
        }
      }

      // Subscribe to Redis channels
      for (const channel of channels) {
        await subscriber.subscribe(channel, (err) => {
          if (err) {
            console.error(`[Realtime] Subscription error for ${channel}:`, err);
            try {
              controller.close();
            } catch (e) {
              // Controller already closed, ignore
            }
          }
        });
      }

      console.log(`[Realtime] Client ${clientId} subscribed to channels: ${channels.join(', ')}`);

      // Handle incoming updates
      subscriber.on('message', (channel, message) => {
        if (subscriberClosed) return;

        try {
          const update = JSON.parse(message);
          
          // Send update to client via SSE
          const sseMessage = `data: ${JSON.stringify(update)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
          
          console.log(`[Realtime] Sent ${update.operation} on ${update.table} to client ${clientId}`);
        } catch (error) {
          console.error('[Realtime] Error processing message:', error);
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
        
        // Unsubscribe from all channels
        for (const channel of channels) {
          await subscriber.unsubscribe(channel);
        }
        
        await subscriber.quit();
        
        try {
          controller.close();
        } catch (e) {
          // Controller already closed, ignore
        }
        
        console.log(`[Realtime] Client ${clientId} disconnected`);
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
