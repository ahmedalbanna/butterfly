import { NextRequest } from 'next/server';
import { restartCDC } from '@/lib/cdc-manager';

/**
 * Restart CDC system endpoint
 * Useful for recovery from failures
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CDC Restart] Initiating CDC system restart...');
    
    await restartCDC();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'CDC system restarted successfully',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[CDC Restart] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Failed to restart CDC: ${error}`,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
