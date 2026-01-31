import { NextRequest } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';
import { wsManager } from '@/lib/websocket-manager';
import { prisma } from '@/lib/db';

// Store WebSocket server instance
let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server (called once)
 */
function getWebSocketServer() {
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });
    console.log('[WS] WebSocket server initialized');
  }
  return wss;
}

/**
 * Handle WebSocket upgrade for Next.js
 */
export async function GET(request: NextRequest) {
  // Get upgrade headers
  const upgradeHeader = request.headers.get('upgrade');
  
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');
  const type = searchParams.get('type') as 'customer' | 'admin';
  const userId = searchParams.get('userId') || undefined;

  if (!messageId || !type) {
    return new Response('Missing messageId or type', { status: 400 });
  }

  // Verify message exists
  const message = await prisma.customerMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return new Response('Message not found', { status: 404 });
  }

  // For Next.js, we need to handle WebSocket upgrade differently
  // This is a limitation - Next.js doesn't natively support WebSocket upgrades in route handlers
  // We'll return instructions for using a polling fallback or separate WebSocket server
  
  return new Response(
    JSON.stringify({
      error: 'WebSocket upgrade not supported in this environment',
      message: 'Please use the polling endpoint at /api/chat/poll',
      fallback: true,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Polling fallback endpoint (POST for sending, GET for receiving)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, type, content, userId } = body;

    if (!messageId || !type || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify message exists and is a chat type
    const message = await prisma.customerMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create reply
    const reply = await prisma.messageReply.create({
      data: {
        messageId,
        sender: type,
        content,
      },
    });

    // Update message status and activity
    await prisma.customerMessage.update({
      where: { id: messageId },
      data: {
        status: type === 'admin' ? 'replied' : 'read',
        updatedAt: new Date(),
      },
    });

    // Update active chat session
    const activeSession = await prisma.activeChatSession.findUnique({
      where: { messageId },
    });

    if (activeSession) {
      await prisma.activeChatSession.update({
        where: { messageId },
        data: {
          lastActivity: new Date(),
          customerConnected: type === 'customer' ? true : activeSession.customerConnected,
          adminConnected: type === 'admin' ? true : activeSession.adminConnected,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply: {
          id: reply.id,
          sender: reply.sender,
          content: reply.content,
          createdAt: reply.createdAt,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[WS Poll] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
