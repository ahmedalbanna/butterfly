'use server';

import { prisma } from '@/lib/db';
import { CustomerMessage, MessageReply, ActiveChatSession } from '@prisma/client';

export type MessageWithReplies = CustomerMessage & {
  replies: MessageReply[];
  activeChatSession: ActiveChatSession | null;
};

/**
 * Get all customer messages
 */
export async function getAllMessages(): Promise<MessageWithReplies[]> {
  try {
    const messages = await prisma.customerMessage.findMany({
      include: {
        replies: {
          orderBy: { createdAt: 'asc' }
        },
        activeChatSession: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

/**
 * Get messages by status
 */
export async function getMessagesByStatus(status: string): Promise<MessageWithReplies[]> {
  try {
    const messages = await prisma.customerMessage.findMany({
      where: { status },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' }
        },
        activeChatSession: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return messages;
  } catch (error) {
    console.error('Error fetching messages by status:', error);
    return [];
  }
}

/**
 * Get messages by type (form or chat)
 */
export async function getMessagesByType(type: string): Promise<MessageWithReplies[]> {
  try {
    const messages = await prisma.customerMessage.findMany({
      where: { type },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' }
        },
        activeChatSession: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return messages;
  } catch (error) {
    console.error('Error fetching messages by type:', error);
    return [];
  }
}

/**
 * Get active chat sessions
 */
export async function getActiveChatSessions(): Promise<(ActiveChatSession & { message: CustomerMessage })[]> {
  try {
    const sessions = await prisma.activeChatSession.findMany({
      include: {
        message: true
      },
      orderBy: { lastActivity: 'desc' }
    });
    return sessions;
  } catch (error) {
    console.error('Error fetching active chat sessions:', error);
    return [];
  }
}

/**
 * Get message statistics
 */
export async function getMessageStats(): Promise<{
  total: number;
  unread: number;
  read: number;
  replied: number;
  resolved: number;
  activeChats: number;
  formMessages: number;
  chatMessages: number;
}> {
  try {
    const [total, unread, read, replied, resolved, activeChats, formMessages, chatMessages] = await Promise.all([
      prisma.customerMessage.count(),
      prisma.customerMessage.count({ where: { status: 'unread' } }),
      prisma.customerMessage.count({ where: { status: 'read' } }),
      prisma.customerMessage.count({ where: { status: 'replied' } }),
      prisma.customerMessage.count({ where: { status: 'resolved' } }),
      prisma.activeChatSession.count(),
      prisma.customerMessage.count({ where: { type: 'form' } }),
      prisma.customerMessage.count({ where: { type: 'chat' } })
    ]);

    return {
      total,
      unread,
      read,
      replied,
      resolved,
      activeChats,
      formMessages,
      chatMessages
    };
  } catch (error) {
    console.error('Error fetching message stats:', error);
    return {
      total: 0,
      unread: 0,
      read: 0,
      replied: 0,
      resolved: 0,
      activeChats: 0,
      formMessages: 0,
      chatMessages: 0
    };
  }
}

/**
 * Update message status
 */
export async function updateMessageStatus(messageId: string, status: string): Promise<CustomerMessage | null> {
  try {
    const message = await prisma.customerMessage.update({
      where: { id: messageId },
      data: { status }
    });
    return message;
  } catch (error) {
    console.error('Error updating message status:', error);
    return null;
  }
}

/**
 * Update message priority
 */
export async function updateMessagePriority(messageId: string, priority: string): Promise<CustomerMessage | null> {
  try {
    const message = await prisma.customerMessage.update({
      where: { id: messageId },
      data: { priority }
    });
    return message;
  } catch (error) {
    console.error('Error updating message priority:', error);
    return null;
  }
}

/**
 * Add reply to message
 */
export async function addMessageReply(
  messageId: string,
  content: string,
  sender: 'customer' | 'admin'
): Promise<MessageReply | null> {
  try {
    const reply = await prisma.messageReply.create({
      data: {
        messageId,
        content,
        sender
      }
    });

    // Update message status to 'replied' if admin is replying
    if (sender === 'admin') {
      await prisma.customerMessage.update({
        where: { id: messageId },
        data: { status: 'replied' }
      });
    }

    return reply;
  } catch (error) {
    console.error('Error adding message reply:', error);
    return null;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.customerMessage.delete({
      where: { id: messageId }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return {
      success: false,
      error: 'Failed to delete message'
    };
  }
}
