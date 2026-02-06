import { NextRequest } from 'next/server';
import { getCDCAlertManager } from '@/lib/cdc-alerts';

/**
 * Get CDC alert history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const manager = getCDCAlertManager();
    const alerts = await manager.getPersistedAlerts(limit);

    return new Response(
      JSON.stringify({
        success: true,
        alerts,
        count: alerts.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[CDC Alerts] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Failed to fetch alerts: ${error}`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
