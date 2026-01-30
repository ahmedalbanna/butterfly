'use server';

import { prisma } from '@/lib/db';
import { ChatSession } from '@prisma/client';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

/**
 * Save or update a chat session
 */
export async function saveChatSession(
  sessionId: string,
  messages: ChatMessage[],
  userId?: string
): Promise<ChatSession | null> {
  try {
    const chatSession = await prisma.chatSession.upsert({
      where: { sessionId },
      update: {
        messages: messages as any,
        updatedAt: new Date()
      },
      create: {
        sessionId,
        userId,
        messages: messages as any
      }
    });

    return chatSession;
  } catch (error) {
    console.error('Error saving chat session:', error);
    return null;
  }
}

/**
 * Get chat session by session ID
 */
export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { sessionId }
    });

    return session;
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return null;
  }
}

/**
 * Get all chat sessions for a user
 */
export async function getUserChatSessions(userId: string): Promise<ChatSession[]> {
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    return sessions;
  } catch (error) {
    console.error('Error fetching user chat sessions:', error);
    return [];
  }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  try {
    await prisma.chatSession.delete({
      where: { sessionId }
    });

    return true;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
}
