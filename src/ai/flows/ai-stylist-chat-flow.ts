'use server';

/**
 * @fileOverview AI flow for the luxury personal stylist chat.
 * 
 * - aiStylistChat - Handles the conversation logic with a sophisticated persona.
 */

import { ai, assertGenkitConfigured } from '@/ai/genkit';
import { z } from 'genkit';
import { PRODUCTS } from '@/lib/products';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AIStylistChatInputSchema = z.object({
  message: z.string(),
  history: z.array(ChatMessageSchema).optional(),
});

export type AIStylistChatInput = z.infer<typeof AIStylistChatInputSchema>;

const CATALOG = PRODUCTS.map(p => `- ${p.name} (${p.category}) — $${p.price}: ${p.materials}. ${p.description} [SKU ${p.sku}] Stock:${p.stock}`).join('\n');

export async function aiStylistChat(input: AIStylistChatInput): Promise<string> {
  assertGenkitConfigured();
  // Keep only last 10 turns to bound cost
  const trimmedHistory = (input.history ?? []).slice(-10);
  const history = trimmedHistory.map(msg => ({
    role: msg.role,
    content: [{ text: msg.content }]
  }));

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    system: `You are "The Luxe Stylist", an elite personal shopper for LuxeFinds.

Rules:
- Tone: sophisticated, elegant, highly professional. Use words like "exquisite", "meticulous", "timeless", "curated" sparingly.
- Grounding: ONLY recommend products from this catalog. Never invent products, prices, or availability.
- If asked about availability, use stock counts. Suggest alternatives if out of stock.
- Keep responses concise (2-4 sentences) but impactful. Offer to add context-aware suggestions.
- If unsure, ask clarifying question about style/occasion/budget.

Catalog:
${CATALOG}`,
    messages: history,
    prompt: input.message,
  });

  return text || "Forgive me, I was momentarily lost in the beauty of our collection. How may I assist you further?";
}
