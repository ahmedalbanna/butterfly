'use server';

/**
 * @fileOverview AI flow for suggesting accessories based on user input.
 *
 * - generateAccessorySuggestions - A function that takes either an image of an outfit or a style description
 *   and suggests relevant accessories from the shop to complement the user's look.
 * - GenerateAccessorySuggestionsInput - The input type for the generateAccessorySuggestions function, allowing
 *   either a data URI image or a text description of the user's style.
 * - GenerateAccessorySuggestionsOutput - The return type for the generateAccessorySuggestions function,
 *   providing a list of suggested accessories.
 */

import {ai, assertGenkitConfigured} from '@/ai/genkit';
import {z} from 'genkit';
import { PRODUCTS } from '@/lib/products';

const GenerateAccessorySuggestionsInputSchema = z.object({
  imageUri: z
    .string()
    .optional()
    .describe(
      "A photo of an outfit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  styleDescription: z
    .string()
    .optional()
    .describe('A text description of the user\'s style.'),
}).refine(data => !!data.imageUri !== !!data.styleDescription, {
  message: 'Either imageUri or styleDescription must be provided, but not both.',
});

export type GenerateAccessorySuggestionsInput = z.infer<typeof GenerateAccessorySuggestionsInputSchema>;

const GenerateAccessorySuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of suggested accessories.'),
});

export type GenerateAccessorySuggestionsOutput = z.infer<typeof GenerateAccessorySuggestionsOutputSchema>;

export async function generateAccessorySuggestions(
  input: GenerateAccessorySuggestionsInput
): Promise<GenerateAccessorySuggestionsOutput> {
  return generateAccessorySuggestionsFlow(input);
}

const CATALOG_NAMES = PRODUCTS.map(p => `${p.name} (${p.category})`).join(', ');

const prompt = ai.definePrompt({
  name: 'generateAccessorySuggestionsPrompt',
  input: {schema: GenerateAccessorySuggestionsInputSchema},
  output: {schema: GenerateAccessorySuggestionsOutputSchema},
  prompt: `You are The Luxe Stylist for LuxeFinds. Suggest 3-5 exquisite accessories ONLY from this catalog: ${CATALOG_NAMES}.

We have these exact pieces. Respond with exact product names from the catalog that complement the look.

  {% if imageUri %}
  Outfit Image: {{media url=imageUri}}
  {% else %}
  Style Description: {{{styleDescription}}}
  {% endif %}
  
  Return ONLY product names that exist in the catalog. Example: ["Rose Gold Diamond Necklace", "Minimalist Gold Hoop Earrings"]
  `,
});

const generateAccessorySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateAccessorySuggestionsFlow',
    inputSchema: GenerateAccessorySuggestionsInputSchema,
    outputSchema: GenerateAccessorySuggestionsOutputSchema,
  },
  async input => {
    assertGenkitConfigured();
    const {output} = await prompt(input);
    if (!output) throw new Error('No suggestions generated');
    // Filter to valid catalog names only
    const valid = new Set(PRODUCTS.map(p => p.name));
    const filtered = output.suggestions.filter(s => valid.has(s));
    return { suggestions: filtered.length ? filtered : output.suggestions.slice(0, 3) };
  }
);
