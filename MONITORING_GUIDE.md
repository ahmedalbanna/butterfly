# 📊 CDC System Monitoring Guide

## Overview

This guide explains how to set up comprehensive monitoring for the Butterfly Store CDC system using Prometheus and Grafana.

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Start Prometheus, Grafana, and exporters
docker compose -f docker-compose.monitoring.yml up -d

# Verify services
docker ps | grep butterfly
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3000
  - Username: `admin`
  - Password: `admin123`
  
- **Prometheus**: http://localhost:9090

- **AlertManager**: http://localhost:9093

### 3. Import CDC Dashboard

1. Go to Grafana → Dashboards → Import
2. Upload `grafana-dashboard-cdc.json`
3. Select Prometheus as data source
4. Click Import

---

## 📊 Available Metrics

### CDC Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `cdc_events_total` | Counter | Total CDC events by operation and table |
| `cdc_listener_active` | Gauge | CDC listener status (0=down, 1=up) |
| `cdc_alerts_total` | Counter | CDC alerts by level and component |

### Cache Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `cache_operations_total` | Counter | Cache operations (hit/miss/set/invalidate) |
| `cache_operation_duration_seconds` | Histogram | Cache operation latency |
| `cache_keys_total` | Gauge | Total number of cached keys |
| `cache_memory_bytes` | Gauge | Cache memory usage in bytes |

### Real-Time Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `realtime_connections_active` | Gauge | Active SSE connections |
| `realtime_connections_total` | Counter | Connection events (connect/disconnect) |

### Database Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `database_query_duration_seconds` | Histogram | Database query latency |

### System Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `redis_connected` | Gauge | Redis connection status (0=down, 1=up) |
| `cache_warming_duration_seconds` | Histogram | Cache warming duration |
| `cache_warming_items_total` | Counter | Items warmed by strategy |

---

## 🔍 Using Prometheus

### Query Examples

```promql
# Cache hit rate percentage
(rate(cache_operations_total{operation="hit"}[5m]) / 
(rate(cache_operations_total{operation="hit"}[5m]) + 
rate(cache_operations_total{operation="miss"}[5m]))) * 100

# CDC events per second by table
rate(cdc_events_total[5m])

# 95th percentile cache latency
histogram_quantile(0.95, rate(cache_operation_duration_seconds_bucket[5m]))

# Active real-time connections
realtime_connections_active
```

---

## 🚨 Alerting

### Configured Alerts

1. **CDCListenerDown** - CDC listener inactive for >1 min (Critical)
2. **RedisDisconnected** - Redis connection lost for >30 sec (Critical)
3. **LowCacheHitRate** - Hit rate <60% for >10 min (Warning)
4. **HighCacheMemory** - Cache memory >500MB for >5 min (Warning)
5. **HighCacheLatency** - p95 latency >100ms for >5 min (Warning)
6. **HighDatabaseLatency** - p95 latency >1s for >5 min (Warning)

### Alert Routing

- **Critical**: Immediate notification via webhook
- **Warning**: Batched every 5 minutes

### Configure Slack Alerts (Optional)

Edit `alertmanager.yml`:

```yaml
receivers:
  - name: 'critical-alerts'
    slack_configs:
      - api_url: 'YOUR_WEBHOOK_URL'
        channel: '#alerts-critical'
```

---

## 📈 Grafana Dashboard Panels

### Overview Row
1. CDC System Health (Stat)
2. Redis Connection (Stat)
3. Active Real-Time Connections (Stat)
4. Cache Keys Total (Stat)

### CDC Activity Row
5. CDC Events Rate by Operation (Graph)
6. CDC Events by Table (Graph)

### Cache Performance Row
7. Cache Hit Rate (Gauge)
8. Cache Operations (Graph)
9. Cache Memory Usage (Graph)

### Latency Row
10. Cache Operation Latency (p50, p95, p99)
11. Database Query Latency (p95)

### Connections & Alerts Row
12. Real-Time Connections (Graph)
13. CDC Alerts by Level (Graph)

### Cache Warming Row
14. Cache Warming Duration (Graph)
15. Cache Warming Items (Graph)

---

## 🛠️ Troubleshooting

### No Metrics Appearing

**Check metrics endpoint**:
```bash
curl http://localhost:9002/api/metrics
```

**Verify Prometheus scraping**:
1. Go to http://localhost:9090/targets
2. Check if `butterfly-cdc` target is UP

### High Memory Usage

**Check cache memory**:
```bash
curl http://localhost:9002/api/admin/cdc/status | jq '.cache.memoryUsed'
```

**Clear cache if needed**:
```bash
curl -X POST http://localhost:9002/api/admin/cdc/clear-cache
```

### Missing Dashboard Panels

**Reload dashboard**:
1. Dashboards → Manage → CDC System Monitoring
2. Settings → JSON Model
3. Paste content from `grafana-dashboard-cdc.json`
4. Save

---

## 📊 Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Cache Hit Rate | >80% | <60% |
| Cache Latency (p95) | <50ms | >100ms |
| Database Latency (p95) | <500ms | >1s |
| CDC Event Processing | <100ms | N/A |
| Active Connections | <100 | >100 |
| Cache Memory | <500MB | >500MB |

---

## 🔄 Maintenance

### Daily Tasks
- Check Grafana dashboard for anomalies
- Review AlertManager for active alerts
- Monitor cache hit rates

### Weekly Tasks
- Analyze slow query logs
- Review cache warming effectiveness
- Check disk space for Prometheus data

### Monthly Tasks
- Review and tune alert thresholds
- Archive old metrics data
- Update dashboard based on usage patterns

---

## 📚 Additional Resources

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)

---

**Last Updated**: February 6, 2026  
**Version**: 1.0.0
