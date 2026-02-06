import { NextRequest } from 'next/server';
import { createRedisSubscriber } from '@/lib/redis';
import { prisma } from '@/lib/db';

/**
 * Server-Sent Events endpoint for real-time chat updates
 * Replaces polling with true real-time messaging via Redis Pub/Sub
 * 
 * Query parameters:
 * - messageId: The chat session/message ID
 * - type: 'customer' or 'admin'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');
  const type = searchParams.get('type') as 'customer' | 'admin';

  if (!messageId || !type) {
    return new Response(
      JSON.stringify({ error: 'Missing messageId or type' }),
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
      const channelKey = `chat:${messageId}`;

      console.log(`[Chat Realtime] ${type} connected to chat ${messageId}`);

      // Send initial connection confirmation with current state
      try {
        // Fetch current chat state
        const [message, activeSession, replies] = await Promise.all([
          prisma.customerMessage.findUnique({
            where: { id: messageId },
            select: { status: true, isActive: true },
          }),
          prisma.activeChatSession.findUnique({
            where: { messageId },
          }),
          prisma.messageReply.findMany({
            where: { messageId },
            orderBy: { createdAt: 'asc' },
            take: 50,
          }),
        ]);

        const otherPartyConnected = type === 'customer'
          ? activeSession?.adminConnected
          : activeSession?.customerConnected;

        const initMessage = `data: ${JSON.stringify({
          type: 'connected',
          timestamp: Date.now(),
          replies: replies.map(r => ({
            id: r.id,
            sender: r.sender,
            content: r.content,
            createdAt: r.createdAt,
          })),
          status: message?.status,
          isActive: message?.isActive,
          otherPartyConnected: otherPartyConnected || false,
        })}\n\n`;

        controller.enqueue(encoder.encode(initMessage));
      } catch (error) {
        console.error('[Chat Realtime] Failed to send init message:', error);
        return;
      }

      // Subscribe to Redis channel for this chat
      await subscriber.subscribe(channelKey, (err) => {
        if (err) {
          console.error('[Chat Realtime] Subscription error:', err);
          try {
            controller.close();
          } catch (e) {
            // Controller already closed, ignore
          }
        }
      });

      console.log(`[Chat Realtime] ${type} subscribed to ${channelKey}`);

      // Handle incoming chat updates
      subscriber.on('message', async (channel, message) => {
        if (subscriberClosed) return;

        try {
          const update = JSON.parse(message);

          // Filter messages - only send to the other party
          if (update.type === 'new_reply' && update.sender !== type) {
            const sseMessage = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(sseMessage));
            console.log(`[Chat Realtime] Sent reply to ${type}`);
          } else if (update.type === 'status_change' || update.type === 'connection_change') {
            const sseMessage = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(sseMessage));
          }
        } catch (error) {
          console.error('[Chat Realtime] Error processing message:', error);
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

      // Update connection status in database
      const updateConnection = async (connected: boolean) => {
        try {
          const activeSession = await prisma.activeChatSession.findUnique({
            where: { messageId },
          });

          if (activeSession) {
            const updateData: any = {
              lastActivity: new Date(),
            };

            if (type === 'customer') {
              updateData.customerConnected = connected;
            } else {
              updateData.adminConnected = connected;
            }

            await prisma.activeChatSession.update({
              where: { messageId },
              data: updateData,
            });

            // Notify other party of connection status change
            const redis = (await import('@/lib/redis')).getRedisClient();
            await redis.publish(channelKey, JSON.stringify({
              type: 'connection_change',
              timestamp: Date.now(),
              otherPartyConnected: connected,
            }));
          } else if (connected) {
            // Create session if doesn't exist
            await prisma.activeChatSession.create({
              data: {
                messageId,
                customerConnected: type === 'customer',
                adminConnected: type === 'admin',
                lastActivity: new Date(),
              },
            });
          }
        } catch (error) {
          console.error('[Chat Realtime] Error updating connection:', error);
        }
      };

      // Mark as connected
      await updateConnection(true);

      // Heartbeat to keep connection status updated
      const heartbeatInterval = setInterval(() => {
        if (subscriberClosed) {
          clearInterval(heartbeatInterval);
          return;
        }
        updateConnection(true);
      }, 10000);

      // Cleanup on close
      const cleanup = async () => {
        if (subscriberClosed) return; // Already cleaned up

        subscriberClosed = true;
        clearInterval(keepaliveInterval);
        clearInterval(heartbeatInterval);

        // Mark as disconnected
        await updateConnection(false);

        await subscriber.unsubscribe(channelKey);
        await subscriber.quit();

        try {
          controller.close();
        } catch (e) {
          // Controller already closed, ignore
        }

        console.log(`[Chat Realtime] ${type} disconnected from chat ${messageId}`);
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
