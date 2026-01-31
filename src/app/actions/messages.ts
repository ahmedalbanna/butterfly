'use server';

import { prisma as db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Validation schemas
const createMessageSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  orderId: z.string().optional(),
});

const replySchema = z.object({
  messageId: z.string(),
  sender: z.enum(['customer', 'admin']),
  content: z.string().min(1, 'Reply content is required'),
});

const updateStatusSchema = z.object({
  messageId: z.string(),
  status: z.enum(['unread', 'read', 'replied', 'resolved']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

// Create a new customer message
export async function createCustomerMessage(data: z.infer<typeof createMessageSchema>) {
  try {
    const validated = createMessageSchema.parse(data);

    // Verify order exists if orderId is provided
    if (validated.orderId) {
      const order = await db.order.findUnique({
        where: { id: validated.orderId },
      });
      
      if (!order) {
        return { 
          success: false, 
          error: 'Order not found' 
        };
      }
    }

    const message = await db.customerMessage.create({
      data: {
        customerName: validated.customerName,
        customerEmail: validated.customerEmail,
        customerPhone: validated.customerPhone,
        subject: validated.subject,
        message: validated.message,
        orderId: validated.orderId,
        status: 'unread',
        priority: 'normal',
      },
      include: {
        order: true,
      },
    });

    revalidatePath('/admin/messages');
    revalidatePath('/admin');

    return {
      success: true,
      message: message,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }
    
    console.error('Failed to create customer message:', error);
    return {
      success: false,
      error: 'Failed to send message. Please try again.',
    };
  }
}

// Get all messages (admin)
export async function getAllMessages(filters?: {
  status?: string;
  priority?: string;
  searchEmail?: string;
}) {
  try {
    const where: any = {};

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters?.priority && filters.priority !== 'all') {
      where.priority = filters.priority;
    }

    if (filters?.searchEmail) {
      where.customerEmail = {
        contains: filters.searchEmail,
        mode: 'insensitive',
      };
    }

    const messages = await db.customerMessage.findMany({
      where,
      include: {
        order: true,
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: [
        { status: 'asc' }, // Unread first
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      messages,
    };
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return {
      success: false,
      error: 'Failed to load messages',
      messages: [],
    };
  }
}

// Get a single message by ID with all replies
export async function getMessageById(messageId: string) {
  try {
    const message = await db.customerMessage.findUnique({
      where: { id: messageId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!message) {
      return {
        success: false,
        error: 'Message not found',
      };
    }

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error('Failed to fetch message:', error);
    return {
      success: false,
      error: 'Failed to load message',
    };
  }
}

// Reply to a message
export async function replyToMessage(data: z.infer<typeof replySchema>) {
  try {
    const validated = replySchema.parse(data);

    // Verify message exists
    const message = await db.customerMessage.findUnique({
      where: { id: validated.messageId },
    });

    if (!message) {
      return {
        success: false,
        error: 'Message not found',
      };
    }

    const reply = await db.messageReply.create({
      data: {
        messageId: validated.messageId,
        sender: validated.sender,
        content: validated.content,
      },
    });

    // Update message status to 'replied' if admin is replying
    if (validated.sender === 'admin') {
      await db.customerMessage.update({
        where: { id: validated.messageId },
        data: { 
          status: 'replied',
          updatedAt: new Date(),
        },
      });
    }

    revalidatePath(`/admin/messages/${validated.messageId}`);
    revalidatePath('/admin/messages');

    return {
      success: true,
      reply,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Failed to create reply:', error);
    return {
      success: false,
      error: 'Failed to send reply. Please try again.',
    };
  }
}

// Update message status and/or priority
export async function updateMessageStatus(data: z.infer<typeof updateStatusSchema>) {
  try {
    const validated = updateStatusSchema.parse(data);

    const updateData: any = {
      status: validated.status,
      updatedAt: new Date(),
    };

    if (validated.priority) {
      updateData.priority = validated.priority;
    }

    const message = await db.customerMessage.update({
      where: { id: validated.messageId },
      data: updateData,
    });

    revalidatePath('/admin/messages');
    revalidatePath(`/admin/messages/${validated.messageId}`);

    return {
      success: true,
      message,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Failed to update message:', error);
    return {
      success: false,
      error: 'Failed to update message status',
    };
  }
}

// Get unread message count (for admin badge)
export async function getUnreadMessageCount() {
  try {
    const count = await db.customerMessage.count({
      where: {
        status: 'unread',
      },
    });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return {
      success: false,
      count: 0,
    };
  }
}

// Get messages by order ID
export async function getMessagesByOrder(orderId: string) {
  try {
    const messages = await db.customerMessage.findMany({
      where: { orderId },
      include: {
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      messages,
    };
  } catch (error) {
    console.error('Failed to fetch messages by order:', error);
    return {
      success: false,
      error: 'Failed to load messages',
      messages: [],
    };
  }
}
