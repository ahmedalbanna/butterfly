import { NextRequest } from 'next/server';
import { checkCDCHealth } from '@/lib/cdc-manager';

/**
 * Health check endpoint for CDC system
 * Returns status of CDC listener and Redis connectivity
 */
export async function GET(request: NextRequest) {
  try {
    const health = await checkCDCHealth();

    return new Response(
      JSON.stringify(health),
      {
        status: health.healthy ? 200 : 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[CDC Health] Error:', error);
    return new Response(
      JSON.stringify({
        healthy: false,
        listener: false,
        redis: false,
        message: `Health check error: ${error}`,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
