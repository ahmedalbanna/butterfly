'use server';

/**
 * @fileOverview AI flow for the luxury personal stylist chat.
 * 
 * - aiStylistChat - Handles the conversation logic with a sophisticated persona.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getProducts } from '@/app/actions/products';

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

  // Fetch available products to make AI product-aware
  const products = await getProducts();
  const productContext = products.map(p => 
    `${p.name} (${p.category}) - $${p.price}: ${p.description.substring(0, 100)}...`
  ).join('\n');

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    system: `You are "The Luxe Stylist", an elite personal shopper and fashion consultant for LuxeFinds, a high-end luxury accessory boutique. 
    Your tone is sophisticated, elegant, and highly professional. Use words like "exquisite", "meticulous", "timeless", and "curated". 
    Provide expert advice on jewelry, watches, bags, and accessories. Keep responses concise but impactful.
    
    When recommending products, you may reference items from our current collection:
    
    ${productContext}
    
    When mentioning specific products, use their exact names from the collection above. You can suggest products that match the customer's style preferences and budget.`,
    messages: history,
    prompt: input.message,
  });

  return text || "Forgive me, I was momentary lost in the beauty of our collection. How may I assist you further?";
}
