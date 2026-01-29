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

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const prompt = ai.definePrompt({
  name: 'generateAccessorySuggestionsPrompt',
  input: {schema: GenerateAccessorySuggestionsInputSchema},
  output: {schema: GenerateAccessorySuggestionsOutputSchema},
  prompt: `You are a personal stylist for an online accessories shop. A user has provided either an image of their outfit or a description of their style. Suggest 3-5 accessories from the shop that would complement their look.

  {% if imageUri %}
  Outfit Image: {{media url=imageUri}}
  {% else %}
  Style Description: {{{styleDescription}}}
  {% endif %}
  
  Please only respond with a list of suggested accessories. For example:
  ["necklace", "earrings", "bracelet"]
  `,
});

const generateAccessorySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateAccessorySuggestionsFlow',
    inputSchema: GenerateAccessorySuggestionsInputSchema,
    outputSchema: GenerateAccessorySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
