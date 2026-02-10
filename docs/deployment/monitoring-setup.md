# 📊 Docker Monitoring Stack Setup Guide

Complete guide for setting up and managing the Butterfly Store monitoring stack with Prometheus, Grafana, and exporters.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
./scripts/docker-cleanup-monitoring.sh
```

### Option 2: Manual Setup
```bash
# Start all monitoring services
docker compose -f docker-compose.monitoring.yml up -d

# Check status
docker compose -f docker-compose.monitoring.yml ps
```

## 📋 Services Overview

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Prometheus** | 9092 | http://localhost:9092 | Metrics collection & storage |
| **Grafana** | 3001 | http://localhost:3001 | Visualization dashboard |
| **AlertManager** | 9093 | http://localhost:9093 | Alert management & routing |
| **Redis Exporter** | 9121 | http://localhost:9121 | Redis metrics export |
| **PostgreSQL Exporter** | 9187 | http://localhost:9187 | PostgreSQL metrics export |

## 🔧 Configuration Files

- **`prometheus.yml`** - Prometheus configuration
  - Defines scrape jobs for metrics collection
  - Alert rules loading from `prometheus-alerts.yml`
  
- **`prometheus-alerts.yml`** - Alert rules
  - CDC listener health checks
  - Redis connection monitoring
  - Cache performance alerts
  - Database latency detection
  
- **`alertmanager.yml`** - AlertManager configuration
  - Alert routing rules
  - Notification settings
  
- **`docker-compose.monitoring.yml`** - Docker Compose configuration
  - Service definitions
  - Port mappings
  - Health checks
  - Volume management

## 📊 Accessing the Services

### Prometheus
- **URL**: http://localhost:9092
- **Purpose**: Query metrics, view targets, and manage alerts
- **Key Features**:
  - Metrics explorer
  - Target health dashboard
  - Alert rules viewer
  - Data download

### Grafana
- **URL**: http://localhost:3001
- **Credentials**: 
  - Username: `admin`
  - Password: `admin123`
- **Purpose**: Visualize metrics with custom dashboards
- **Setup**:
  1. Login with credentials above
  2. Add Prometheus data source (http://butterfly-prometheus:9090)
  3. Import CDC monitoring dashboard

### AlertManager
- **URL**: http://localhost:9093
- **Purpose**: Manage and route alerts
- **Features**:
  - Alert grouping
  - Notification routing
  - Silence management

### Redis Exporter
- **URL**: http://localhost:9121
- **Purpose**: Expose Redis metrics
- **Metrics Include**:
  - Connected clients
  - Memory usage
  - Operations/sec
  - Key space stats

### PostgreSQL Exporter
- **URL**: http://localhost:9187
- **Purpose**: Expose PostgreSQL metrics
- **Metrics Include**:
  - Connection count
  - Query performance
  - Table/index stats
  - Replication lag

## 🔍 Monitoring Metrics

### CDC System
- `cdc_listener_active` - CDC listener health status
- `cdc_events_total` - Total CDC events processed
- `cdc_alerts_total` - System alerts count

### Cache (Redis)
- `cache_operations_total` - Cache hit/miss counts
- `cache_memory_bytes` - Memory usage
- `cache_operation_duration_seconds` - Operation latency
- `cache_warming_duration_seconds` - Cache warming time

### Database (PostgreSQL)
- `database_query_duration_seconds` - Query execution time
- `pg_stat_activity_count` - Active connections
- `pg_database_size_bytes` - Database size

### Real-time
- `realtime_connections_active` - Active WebRTC connections
- `redis_connected` - Redis connection status

## 🚨 Alert Rules

The monitoring system tracks the following alerts:

| Alert | Condition | Severity |
|-------|-----------|----------|
| CDCListenerDown | Inactive for 1m | Critical |
| RedisDisconnected | Connection lost | Critical |
| LowCacheHitRate | <60% for 10m | Warning |
| HighCacheMemory | >500MB for 5m | Warning |
| HighCacheLatency | p95 > 100ms for 5m | Warning |
| HighDatabaseLatency | p95 > 1s for 5m | Warning |
| ExcessiveCDCEvents | >100 events/sec for 10m | Warning |
| HighRealtimeConnections | >100 connections for 5m | Warning |

## 🛠️ Common Tasks

### View Service Logs
```bash
# All services
docker compose -f docker-compose.monitoring.yml logs -f

# Specific service
docker compose -f docker-compose.monitoring.yml logs -f butterfly-prometheus
docker compose -f docker-compose.monitoring.yml logs -f butterfly-grafana
```

### Restart a Service
```bash
docker compose -f docker-compose.monitoring.yml restart butterfly-prometheus
```

### Stop All Services
```bash
docker compose -f docker-compose.monitoring.yml down
```

### Stop and Remove Volumes (Clean Reset)
```bash
docker compose -f docker-compose.monitoring.yml down -v
```

### Update Service
```bash
docker compose -f docker-compose.monitoring.yml up -d --pull always
```

## 🔄 Data Flow

```
PostgreSQL ──→ PG Exporter ──┐
                              │
Redis ──→ Redis Exporter ─────┤
                              ├→ Prometheus ──→ Grafana (Visualize)
                              │                      ↓
Application ──→ Custom Metrics ┘            AlertManager (Alert)
```

## 🐛 Troubleshooting

### Prometheus Not Starting
```bash
# Check logs
docker compose -f docker-compose.monitoring.yml logs butterfly-prometheus

# Common issue: Invalid alert rules
# Check prometheus-alerts.yml for template function errors
```

### Redis Exporter Unhealthy
```bash
# Verify Redis is accessible
docker compose exec butterfly-redis-exporter redis-cli -h luxefinds-redis-master ping

# Check exporter logs
docker compose -f docker-compose.monitoring.yml logs butterfly-redis-exporter
```

### Grafana Won't Connect to Prometheus
```bash
# Verify Prometheus is running
curl http://localhost:9092

# Add data source with URL: http://butterfly-prometheus:9090
# (Use container name, not localhost, within Docker network)
```

### Port Already in Use
```bash
# Find what's using the port
lsof -i :9092

# Or use the cleanup script
./scripts/docker-cleanup-monitoring.sh
```

## 📈 Performance Tips

1. **Retention Settings**: Adjust Prometheus retention in `prometheus.yml`
   ```yaml
   --storage.tsdb.retention.time=30d
   ```

2. **Scrape Interval**: Balance between data freshness and storage
   ```yaml
   global:
     scrape_interval: 15s  # Default 15 seconds
   ```

3. **Alert Evaluation**: Control alert responsiveness
   ```yaml
   global:
     evaluation_interval: 30s
   ```

## 🔐 Security Considerations

1. **Change Grafana Password**: 
   - Login → Administration → Users → Change password
   
2. **Network Access**: 
   - Restrict ports in firewall rules
   - Use reverse proxy for external access
   
3. **AlertManager Integration**:
   - Configure SMTP for email alerts
   - Set up webhook receivers for custom integrations

## 📚 Related Documentation

- `DATABASE_SETUP.md` - Database configuration
- `DOCKER_DATABASE.md` - Docker commands reference
- `COMMUNICATION_SYSTEMS_SUMMARY.md` - System architecture
- `REDIS_SIGNALING.md` - Real-time signaling setup

## 🎯 Next Steps

1. ✅ Start monitoring stack
2. 📊 Configure Grafana dashboards
3. 🔔 Set up alert notifications
4. 📈 Monitor key metrics
5. 🚨 Respond to alerts

---

**Last Updated**: 2026-02-06  
**Prometheus Version**: Latest  
**Grafana Version**: Latest  
**Status**: ✅ Operational
