/**
 * Prometheus-style Metrics Collection for CDC System
 * Provides comprehensive performance and operational metrics
 */

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  value: number;
  labels?: Record<string, string>;
  buckets?: number[];
  observations?: number[];
}

class MetricsCollector {
  private metrics = new Map<string, Metric>();
  private histograms = new Map<string, number[]>();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: Record<string, string>, amount: number = 1): void {
    const key = this.getMetricKey(name, labels);
    const metric = this.metrics.get(key) || {
      name,
      type: 'counter' as const,
      help: `Counter for ${name}`,
      value: 0,
      labels,
    };

    metric.value += amount;
    this.metrics.set(key, metric);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const metric: Metric = {
      name,
      type: 'gauge',
      help: `Gauge for ${name}`,
      value,
      labels,
    };

    this.metrics.set(key, metric);
  }

  /**
   * Record histogram observation
   */
  observeHistogram(name: string, value: number, buckets: number[] = [0.001, 0.01, 0.1, 0.5, 1, 5, 10], labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    
    this.histograms.get(key)!.push(value);
    
    // Keep last 1000 observations
    const observations = this.histograms.get(key)!;
    if (observations.length > 1000) {
      observations.shift();
    }

    // Calculate histogram metrics
    const sorted = [...observations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const count = sorted.length;

    this.metrics.set(key, {
      name,
      type: 'histogram',
      help: `Histogram for ${name}`,
      value: sum,
      labels: { ...labels, le: '+Inf' },
      buckets,
      observations: sorted,
    });
  }

  /**
   * Get metric key with labels
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];
    const metricGroups = new Map<string, Metric[]>();

    // Group metrics by name
    for (const metric of this.metrics.values()) {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, []);
      }
      metricGroups.get(metric.name)!.push(metric);
    }

    // Format each metric group
    for (const [name, metrics] of metricGroups.entries()) {
      const firstMetric = metrics[0];
      
      // Add HELP and TYPE
      lines.push(`# HELP ${name} ${firstMetric.help}`);
      lines.push(`# TYPE ${name} ${firstMetric.type}`);

      for (const metric of metrics) {
        const labelsStr = metric.labels 
          ? `{${Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` 
          : '';

        if (metric.type === 'histogram') {
          // Export histogram buckets
          const observations = metric.observations || [];
          const buckets = metric.buckets || [];
          
          for (const bucket of buckets) {
            const count = observations.filter(v => v <= bucket).length;
            lines.push(`${name}_bucket${labelsStr.replace('}', `,le="${bucket}"}`)} ${count}`);
          }
          
          lines.push(`${name}_bucket${labelsStr.replace('}', ',le="+Inf"}')} ${observations.length}`);
          lines.push(`${name}_sum${labelsStr} ${metric.value}`);
          lines.push(`${name}_count${labelsStr} ${observations.length}`);
        } else {
          lines.push(`${name}${labelsStr} ${metric.value}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Export metrics as JSON
   */
  exportJSON(): any {
    const result: any = {};
    
    for (const [key, metric] of this.metrics.entries()) {
      if (!result[metric.name]) {
        result[metric.name] = [];
      }
      
      result[metric.name].push({
        value: metric.value,
        labels: metric.labels,
        type: metric.type,
      });
    }

    return result;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.histograms.clear();
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, Metric> {
    return new Map(this.metrics);
  }
}

// Singleton instance
let metricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
  }
  return metricsCollector;
}

/**
 * CDC-specific metrics helpers
 */

export function recordCDCEvent(operation: 'INSERT' | 'UPDATE' | 'DELETE', table: string): void {
  const metrics = getMetricsCollector();
  metrics.incrementCounter('cdc_events_total', { operation, table });
}

export function recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'invalidate', type: string): void {
  const metrics = getMetricsCollector();
  metrics.incrementCounter('cache_operations_total', { operation, type });
}

export function recordCacheLatency(operation: 'get' | 'set', latencyMs: number): void {
  const metrics = getMetricsCollector();
  metrics.observeHistogram('cache_operation_duration_seconds', latencyMs / 1000, [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1], { operation });
}

export function recordDatabaseQueryLatency(query: string, latencyMs: number): void {
  const metrics = getMetricsCollector();
  metrics.observeHistogram('database_query_duration_seconds', latencyMs / 1000, [0.01, 0.05, 0.1, 0.5, 1, 5, 10], { query });
}

export function setCDCListenerStatus(active: boolean): void {
  const metrics = getMetricsCollector();
  metrics.setGauge('cdc_listener_active', active ? 1 : 0);
}

export function setRedisConnectionStatus(connected: boolean): void {
  const metrics = getMetricsCollector();
  metrics.setGauge('redis_connected', connected ? 1 : 0);
}

export function setCacheSize(keys: number, memoryBytes: number): void {
  const metrics = getMetricsCollector();
  metrics.setGauge('cache_keys_total', keys);
  metrics.setGauge('cache_memory_bytes', memoryBytes);
}

export function recordRealtimeConnection(action: 'connect' | 'disconnect'): void {
  const metrics = getMetricsCollector();
  metrics.incrementCounter('realtime_connections_total', { action });
}

export function setActiveRealtimeConnections(count: number): void {
  const metrics = getMetricsCollector();
  metrics.setGauge('realtime_connections_active', count);
}

export function recordAlertSent(level: string, component: string): void {
  const metrics = getMetricsCollector();
  metrics.incrementCounter('cdc_alerts_total', { level, component });
}

export function recordCacheWarmingDuration(strategyName: string, durationMs: number): void {
  const metrics = getMetricsCollector();
  metrics.observeHistogram('cache_warming_duration_seconds', durationMs / 1000, [1, 5, 10, 30, 60], { strategy: strategyName });
}

export function recordCacheWarmingItems(strategyName: string, itemCount: number): void {
  const metrics = getMetricsCollector();
  metrics.incrementCounter('cache_warming_items_total', { strategy: strategyName }, itemCount);
}

/**
 * Performance tracking wrapper
 */
export async function trackPerformance<T>(
  metricName: string,
  labels: Record<string, string>,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    const metrics = getMetricsCollector();
    metrics.observeHistogram(metricName, duration / 1000, [0.01, 0.05, 0.1, 0.5, 1, 5, 10], labels);
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    const metrics = getMetricsCollector();
    metrics.observeHistogram(metricName, duration / 1000, [0.01, 0.05, 0.1, 0.5, 1, 5, 10], { ...labels, error: 'true' });
    metrics.incrementCounter(`${metricName}_errors_total`, labels);
    
    throw error;
  }
}

export default getMetricsCollector;
