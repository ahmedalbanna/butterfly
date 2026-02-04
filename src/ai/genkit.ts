import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {ollama} from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    googleAI(),
    ollama({
      models: [
        {
          name: 'llava',
          type: 'generate',
        },
        {
          name: 'stable-diffusion',
          type: 'generate',
        }
      ],
      serverAddress: 'http://localhost:11434', // default Ollama address
    })
  ],
  // model: 'googleai/gemini-2.5-flash',
});
