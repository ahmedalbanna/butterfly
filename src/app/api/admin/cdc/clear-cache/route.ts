import { NextRequest } from 'next/server';
import { clearCache } from '@/lib/cdc-manager';

/**
 * Clear all cache endpoint
 * Use with caution - clears entire Redis cache
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Clear Cache] Clearing all cache...');
    
    await clearCache();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Clear Cache] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Failed to clear cache: ${error}`,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
