import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Create a new chat session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, type } = body;

    if (!customerName || !customerEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create customer message with type "chat"
    const message = await prisma.customerMessage.create({
      data: {
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        subject: 'Live Chat Session',
        message: 'Customer initiated live chat',
        type: type || 'chat',
        isActive: true,
        status: 'unread',
        priority: 'normal',
      },
    });

    // Create active chat session
    await prisma.activeChatSession.create({
      data: {
        messageId: message.id,
        customerConnected: true,
        adminConnected: false,
      },
    });

    console.log(`[Chat] New session created: ${message.id.slice(0, 8)}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: message.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Chat Session] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get chat session info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return new Response(
        JSON.stringify({ error: 'Missing messageId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const message = await prisma.customerMessage.findUnique({
      where: { id: messageId },
      include: {
        activeChatSession: true,
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          id: message.id,
          customerName: message.customerName,
          customerEmail: message.customerEmail,
          isActive: message.isActive,
          status: message.status,
          customerConnected: message.activeChatSession?.customerConnected,
          adminConnected: message.activeChatSession?.adminConnected,
          createdAt: message.createdAt,
          replies: message.replies.map(r => ({
            id: r.id,
            sender: r.sender,
            content: r.content,
            createdAt: r.createdAt,
          })),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Chat Session] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
