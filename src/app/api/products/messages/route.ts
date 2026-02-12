import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/products/messages
 * Create a new product Q&A message
 * 
 * Body:
 * {
 *   productId: string (required)
 *   customerId: string (required)
 *   customerName: string (required)
 *   customerEmail: string (required)
 *   subject: string (required)
 *   message: string (required)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { productId, customerId, customerName, customerEmail, subject, message } = await request.json();

    // Validate required fields
    if (!productId || !customerId || !customerName || !customerEmail || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create the message
    const customerMessage = await prisma.customerMessage.create({
      data: {
        productId,
        customerId,
        customerName,
        customerEmail,
        subject,
        message,
        type: 'chat',
        status: 'unread',
      },
    });

    return NextResponse.json({
      success: true,
      data: customerMessage,
    });
  } catch (error) {
    console.error('[Products Messages POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
