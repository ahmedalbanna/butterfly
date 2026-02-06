import { config } from 'dotenv';
config();

// import '@/ai/flows/generate-accessory-suggestions.ts';
import '@/ai/flows/product-image-analyzer-flow';

// Initialize CDC system for real-time data synchronization
import { initializeCDC } from '@/lib/cdc-manager';

if (process.env.NODE_ENV !== 'test') {
  console.log('[Startup] Initializing CDC system...');
  initializeCDC().catch((error) => {
    console.error('[Startup] Failed to initialize CDC:', error);
    // Continue app startup even if CDC fails
  });
}
