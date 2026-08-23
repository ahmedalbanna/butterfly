'use server';

/**
 * @fileOverview AI flow for generating a voice inquiry response for a product.
 *
 * - productVoiceInquiry - A function that generates a luxurious voice message from a personal stylist.
 * - ProductVoiceInquiryInput - The input type containing product name and details.
 * - ProductVoiceInquiryOutput - The return type containing the audio data URI.
 */

import { ai, assertGenkitConfigured } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const ProductVoiceInquiryInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productMaterials: z.string().describe('The materials used in the product.'),
});

export type ProductVoiceInquiryInput = z.infer<typeof ProductVoiceInquiryInputSchema>;

const ProductVoiceInquiryOutputSchema = z.object({
  audioUri: z.string().describe('The audio data URI of the generated voice response.'),
});

export type ProductVoiceInquiryOutput = z.infer<typeof ProductVoiceInquiryOutputSchema>;

export async function productVoiceInquiry(input: ProductVoiceInquiryInput): Promise<ProductVoiceInquiryOutput> {
  return productVoiceInquiryFlow(input);
}

const productVoiceInquiryFlow = ai.defineFlow(
  {
    name: 'productVoiceInquiryFlow',
    inputSchema: ProductVoiceInquiryInputSchema,
    outputSchema: ProductVoiceInquiryOutputSchema,
  },
  async (input) => {
    assertGenkitConfigured();
    const promptText = `Speaker1: Hello! Thank you for inquiring about our ${input.productName}. This exquisite piece is meticulously crafted from ${input.productMaterials}. It represents the pinnacle of luxury and sophistication in our collection. How may I assist you further with this selection?`;

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: promptText,
    });

    if (!media || !media.url) {
      throw new Error('Failed to generate audio media.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);

    return {
      audioUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
