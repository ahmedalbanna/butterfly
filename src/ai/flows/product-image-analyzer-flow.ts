import { ai } from '../genkit';
import { z } from 'zod';

// Input schema for the flow
const ProductImageInputSchema = z.object({
  imageUrl: z.string().describe('URL or path to the product image'),
});

// Output schema for the flow
const ProductAnalysisOutputSchema = z.object({
  name: z.string().describe('Elegant product name'),
  description: z.string().describe('Luxury-focused product description'),
  category: z.enum(['Jewelry', 'Watches', 'Bags', 'Accessories']).describe('Product category'),
  suggestedPrice: z.number().optional().describe('Suggested price range'),
});

export const productImageAnalyzerFlow = ai.defineFlow(
  {
    name: 'productImageAnalyzer',
    inputSchema: ProductImageInputSchema,
    outputSchema: ProductAnalysisOutputSchema,
  },
  async (input) => {
    // Use Ollama's llava model for image analysis
    const { text } = await ai.generate({
      model: 'ollama/llava',
      prompt: [
        {
          text: `You are a luxury product expert for LuxeFinds, an exquisite boutique specializing in high-end jewelry, watches, bags, and accessories.

Analyze this product image and provide:
1. An elegant, sophisticated product name (2-5 words)
2. A luxury-focused description (2-3 sentences) using words like "exquisite", "meticulous", "timeless", "refined"
3. The category (Jewelry, Watches, Bags, or Accessories)
4. A suggested price in USD (be realistic for luxury items)

Respond ONLY with valid JSON in this exact format:
{
  "name": "Product Name Here",
  "description": "Luxury description here...",
  "category": "Category",
  "suggestedPrice": 000
}`
        },
        {
          media: {
            url: input.imageUrl,
          }
        }
      ],
    });

    // Parse the response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and return
      return ProductAnalysisOutputSchema.parse(parsed);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', text);
      
      // Fallback response
      return {
        name: 'Luxury Item',
        description: 'An exquisite piece crafted with meticulous attention to detail. This timeless addition embodies refined elegance.',
        category: 'Accessories' as const,
        suggestedPrice: 250,
      };
    }
  }
);
