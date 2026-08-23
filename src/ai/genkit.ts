import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

function getGoogleAIKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
}

const apiKey = getGoogleAIKey();

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.warn('[Genkit] GEMINI_API_KEY / GOOGLE_API_KEY is not set. AI calls will fail at runtime. Set GEMINI_API_KEY in apphosting.yaml or .env.');
}

export const ai = genkit({
  plugins: [googleAI(apiKey ? { apiKey } : undefined)],
  model: 'googleai/gemini-2.5-flash',
});

export function assertGenkitConfigured() {
  if (!getGoogleAIKey()) {
    throw new Error('AI is not configured: missing GEMINI_API_KEY. Please set GEMINI_API_KEY.');
  }
}
