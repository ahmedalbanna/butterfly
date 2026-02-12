import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/products/messages/last-exchange
 * Get the last customer message and admin reply for a product
 * 
 * Query:
 * {
 *   productId: string (required)
 *   customerId: string (required)
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const customerId = searchParams.get('customerId');

    if (!productId || !customerId) {
      return NextResponse.json(
        { success: false, error: 'productId and customerId are required' },
        { status: 400 }
      );
    }

    // Get the last message from this customer for this product
    const lastMessage = await prisma.customerMessage.findFirst({
      where: {
        productId,
        customerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        replies: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!lastMessage) {
      return NextResponse.json({
        success: true,
        data: {
          lastMessage: null,
          lastReply: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        lastMessage: {
          id: lastMessage.id,
          customerName: lastMessage.customerName,
          message: lastMessage.message,
          createdAt: lastMessage.createdAt,
        },
        lastReply: lastMessage.replies.length > 0 
          ? {
              id: lastMessage.replies[0].id,
              content: lastMessage.replies[0].content,
              createdAt: lastMessage.replies[0].createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[Products Messages GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
