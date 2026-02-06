import { NextRequest } from 'next/server';
import { warmCacheOnDemand, getCacheWarmer } from '@/lib/cache-warming';

/**
 * On-demand cache warming endpoint
 * Allows manual triggering of cache warming strategies
 * 
 * Query params:
 * - strategy: Optional specific strategy name
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy') || undefined;

    const result = await warmCacheOnDemand(strategy);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Cache Warming API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error: ${error}`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get warming statistics
 */
export async function GET(request: NextRequest) {
  try {
    const warmer = getCacheWarmer();
    const stats = warmer.getStats();

    return new Response(
      JSON.stringify({
        success: true,
        stats,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Cache Warming API] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error: ${error}`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
