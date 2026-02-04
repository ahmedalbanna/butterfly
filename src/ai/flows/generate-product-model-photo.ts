import { ai } from '../genkit';
import { z } from 'zod';

// Input schema for the flow
const ModelPhotoInputSchema = z.object({
  productName: z.string().describe('Name of the product'),
  productCategory: z.string().describe('Category of the product (e.g., rings, bracelets, necklaces)'),
  productDescription: z.string().optional().describe('Product description for context'),
  style: z.enum(['elegant', 'casual', 'editorial', 'luxury']).default('luxury').describe('Photography style'),
});

// Output schema for the flow
const ModelPhotoOutputSchema = z.object({
  imageBase64: z.string().describe('Base64 encoded generated image'),
  prompt: z.string().describe('The prompt used for generation'),
});

// Helper function to determine accessory placement based on category
function getAccessoryPlacement(category: string): string {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes('ring')) {
    return 'elegant hand wearing the ring, professional hand modeling pose';
  } else if (lowerCategory.includes('bracelet') || lowerCategory.includes('bangle')) {
    return 'elegant wrist wearing the bracelet, graceful arm position';
  } else if (lowerCategory.includes('necklace') || lowerCategory.includes('pendant')) {
    return 'elegant neck and décolletage wearing the necklace, sophisticated portrait';
  } else if (lowerCategory.includes('earring')) {
    return 'elegant ear and side profile wearing the earring, beauty shot';
  } else if (lowerCategory.includes('anklet')) {
    return 'elegant ankle wearing the anklet, refined leg pose';
  } else if (lowerCategory.includes('belt')) {
    return 'elegant waist wearing the belt, fashion editorial pose';
  } else if (lowerCategory.includes('watch')) {
    return 'elegant wrist wearing the watch, luxury timepiece display';
  } else {
    return 'luxury model showcasing the accessory, high-end fashion photography';
  }
}

// Helper function to build style-specific prompt additions
function getStylePrompt(style: string): string {
  switch (style) {
    case 'elegant':
      return 'soft lighting, neutral background, refined and sophisticated atmosphere';
    case 'casual':
      return 'natural lighting, lifestyle setting, relaxed and approachable feel';
    case 'editorial':
      return 'dramatic lighting, artistic composition, high fashion magazine quality';
    case 'luxury':
    default:
      return 'professional studio lighting, clean elegant background, ultra high-end boutique photography, exquisite detail';
  }
}

export const generateProductModelPhotoFlow = ai.defineFlow(
  {
    name: 'generateProductModelPhoto',
    inputSchema: ModelPhotoInputSchema,
    outputSchema: ModelPhotoOutputSchema,
  },
  async (input) => {
    // Build the generation prompt
    const placement = getAccessoryPlacement(input.productCategory);
    const stylePrompt = getStylePrompt(input.style);

    const prompt = `Professional fashion photography, ${placement}, ${stylePrompt}, ${input.productName}, luxurious and timeless aesthetic, ultra detailed, 8k quality, photorealistic`;

    const negativePrompt = 'low quality, blurry, distorted, ugly, deformed, amateur, oversaturated, watermark, text';

    try {
      // Generate image using Stable Diffusion via Ollama
      const { text } = await ai.generate({
        model: 'ollama/brxce/stable-diffusion-prompt-generator:latest',
        prompt: [
          {
            text: `Generate a high-quality fashion photography image with the following specifications:

PROMPT: ${prompt}

NEGATIVE PROMPT: ${negativePrompt}

Style: Luxury boutique photography
Subject: ${input.productName}
Category: ${input.productCategory}
Context: ${input.productDescription || 'High-end accessory'}

Create a professional, elegant image showing a model wearing this accessory in a luxury setting.`
          }
        ],
        config: {
          temperature: 0.7,
        }
      });

      // The response from Stable Diffusion should be base64 encoded image
      // If the model returns the image directly, we'll handle it
      // Otherwise, we'll return the text response

      return {
        imageBase64: text, // Assuming the model returns base64 or image data
        prompt: prompt,
      };
    } catch (error) {
      console.error('Error generating model photo:', error);
      throw new Error(`Failed to generate model photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
