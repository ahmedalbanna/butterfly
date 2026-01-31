import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Poll for new messages in a chat session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const since = searchParams.get('since'); // ISO timestamp
    const type = searchParams.get('type') as 'customer' | 'admin';

    if (!messageId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing messageId or type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build query for replies after 'since' timestamp
    const whereClause: any = {
      messageId,
    };

    if (since) {
      whereClause.createdAt = {
        gt: new Date(since),
      };
    }

    // Get new replies
    const replies = await prisma.messageReply.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc',
      },
      take: 50, // Limit to last 50 messages
    });

    // Get message status
    const message = await prisma.customerMessage.findUnique({
      where: { id: messageId },
      select: {
        status: true,
        isActive: true,
      },
    });

    // Check if other party is connected
    const activeSession = await prisma.activeChatSession.findUnique({
      where: { messageId },
    });

    const otherPartyConnected = type === 'customer' 
      ? activeSession?.adminConnected 
      : activeSession?.customerConnected;

    return new Response(
      JSON.stringify({
        success: true,
        replies: replies.map(r => ({
          id: r.id,
          sender: r.sender,
          content: r.content,
          createdAt: r.createdAt,
        })),
        status: message?.status,
        isActive: message?.isActive,
        otherPartyConnected: otherPartyConnected || false,
        timestamp: new Date().toISOString(),
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
    console.error('[Chat Poll] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Update connection status (heartbeat)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, type, connected } = body;

    if (!messageId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing messageId or type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update active session
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

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Chat Heartbeat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
