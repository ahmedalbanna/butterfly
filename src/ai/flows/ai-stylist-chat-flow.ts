'use server';

/**
 * @fileOverview AI flow for the luxury personal stylist chat.
 * 
 * - aiStylistChat - Handles the conversation logic with a sophisticated persona.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AIStylistChatInputSchema = z.object({
  message: z.string(),
  history: z.array(ChatMessageSchema).optional(),
});

export type AIStylistChatInput = z.infer<typeof AIStylistChatInputSchema>;

export async function aiStylistChat(input: AIStylistChatInput): Promise<string> {
  const history = input.history?.map(msg => ({
    role: msg.role,
    content: [{ text: msg.content }]
  })) || [];

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    system: `You are "The Luxe Stylist", an elite personal shopper and fashion consultant for LuxeFinds, a high-end luxury accessory boutique. 
    Your tone is sophisticated, elegant, and highly professional. Use words like "exquisite", "meticulous", "timeless", and "curated". 
    Provide expert advice on jewelry, watches, and bags. Keep responses concise but impactful.`,
    messages: history,
    prompt: input.message,
  });

  return text || "Forgive me, I was momentary lost in the beauty of our collection. How may I assist you further?";
}
