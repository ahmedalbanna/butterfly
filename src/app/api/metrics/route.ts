import { NextRequest } from 'next/server';
import { getMetricsCollector } from '@/lib/metrics';

/**
 * Prometheus metrics endpoint
 * Exposes CDC system metrics in Prometheus format
 * 
 * Usage:
 * - Add to Prometheus scrape config:
 *   scrape_configs:
 *     - job_name: 'butterfly-cdc'
 *       static_configs:
 *         - targets: ['localhost:9002']
 *       metrics_path: '/api/metrics'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'prometheus';

  try {
    const collector = getMetricsCollector();

    if (format === 'json') {
      const metrics = collector.exportJSON();
      return new Response(
        JSON.stringify(metrics, null, 2),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Prometheus format
      const metrics = collector.exportPrometheus();
      return new Response(
        metrics,
        {
          status: 200,
          headers: { 'Content-Type': 'text/plain; version=0.0.4' },
        }
      );
    }
  } catch (error) {
    console.error('[Metrics] Error:', error);
    return new Response(
      `# Error exporting metrics: ${error}`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      }
    );
  }
}
