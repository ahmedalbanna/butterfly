# Redis High Availability Setup with Sentinel

This document provides a complete guide for setting up Redis with Sentinel for high availability in the Butterfly Store (LuxeFinds) project.

## Overview

**Redis Sentinel** provides high availability for Redis through:
- **Automatic failover**: Promotes a replica to master if the current master fails
- **Monitoring**: Continuously checks if master and replicas are working correctly
- **Notification**: Alerts admins about failures
- **Configuration provider**: Clients discover the current master through Sentinel

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Redis Sentinel Cluster                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌────────────┐│
│  │  Sentinel 1  │      │  Sentinel 2  │      │ Sentinel 3 ││
│  │  :26379      │      │  :26380      │      │  :26381    ││
│  └──────┬───────┘      └──────┬───────┘      └──────┬─────┘│
│         │                     │                     │       │
│         └─────────────────────┼─────────────────────┘       │
│                               │                             │
│         ┌─────────────────────┴─────────────────────┐       │
│         │                                           │       │
│  ┌──────▼───────┐      ┌──────────────┐      ┌─────▼──────┐│
│  │ Redis Master │◄─────┤Redis Replica │◄─────┤Redis Replica││
│  │   :6379      │      │  1  :6380    │      │  2  :6381   ││
│  └──────────────┘      └──────────────┘      └─────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**
- **1 Master Redis**: Handles all write operations
- **2 Replica Redis**: Read-only copies that sync from master
- **3 Sentinel Nodes**: Monitor cluster health and perform failover

**Quorum**: 2 sentinels must agree before declaring master as down

## Quick Start

### 1. Start Sentinel Cluster (Local Development)

```bash
# Start the entire Sentinel cluster
docker compose -f docker-compose.redis-sentinel.yml up -d

# Check all containers are running
docker compose -f docker-compose.redis-sentinel.yml ps

# View logs
docker compose -f docker-compose.redis-sentinel.yml logs -f
```

### 2. Configure Application for Sentinel

Update your `.env` file:

```bash
# Enable Sentinel mode
REDIS_MODE=sentinel

# Sentinel configuration
REDIS_SENTINEL_HOSTS=localhost:26379,localhost:26380,localhost:26381
REDIS_SENTINEL_MASTER=mymaster
```

### 3. Start Application

```bash
npm run dev
```

The application will automatically connect to the Sentinel cluster and discover the current master.

### 4. Verify Health

```bash
# Check Redis health
curl http://localhost:9002/api/health/redis

# Expected output:
{
  "status": "healthy",
  "mode": "sentinel",
  "role": "master",
  "connectedSlaves": 2,
  "sentinels": 3,
  "latency": "2ms",
  ...
}
```

## Configuration Details

### Sentinel Configuration

Each Sentinel monitors the master with these settings:

```conf
# Monitor master
sentinel monitor mymaster redis-master 6379 2

# Consider master down after 5 seconds
sentinel down-after-milliseconds mymaster 5000

# Failover timeout (60 seconds)
sentinel failover-timeout mymaster 60000

# Only 1 replica syncs at a time during failover
sentinel parallel-syncs mymaster 1
```

**Quorum = 2**: At least 2 sentinels must agree that master is down before initiating failover.

### Redis Master Configuration

```bash
redis-server \
  --appendonly yes \
  --maxmemory 256mb \
  --maxmemory-policy allkeys-lru \
  --replica-announce-ip redis-master
```

### Redis Replica Configuration

```bash
redis-server \
  --appendonly yes \
  --maxmemory 256mb \
  --maxmemory-policy allkeys-lru \
  --replicaof redis-master 6379 \
  --replica-announce-ip redis-replica-1
```

## Failover Testing

### Test Automatic Failover

1. **Check current master**:
```bash
docker compose -f docker-compose.redis-sentinel.yml exec redis-master redis-cli INFO replication | grep role
# role:master
```

2. **Kill the master**:
```bash
docker compose -f docker-compose.redis-sentinel.yml stop redis-master
```

3. **Watch Sentinel logs** (failover happens in 5-10 seconds):
```bash
docker compose -f docker-compose.redis-sentinel.yml logs -f redis-sentinel-1
```

Expected output:
```
+sdown master mymaster 172.20.0.2 6379
+odown master mymaster 172.20.0.2 6379 #quorum 2/2
+switch-master mymaster 172.20.0.2 6379 172.20.0.3 6379
```

4. **Verify new master** (one of the replicas is now master):
```bash
docker compose -f docker-compose.redis-sentinel.yml exec redis-replica-1 redis-cli INFO replication | grep role
# role:master (if this replica was promoted)
```

5. **Check application logs** - should see automatic reconnection:
```
[Redis Sentinel] Master switched from 172.20.0.2:6379 to 172.20.0.3:6379
[Redis] Connected successfully
```

6. **Restart old master** (becomes a replica):
```bash
docker compose -f docker-compose.redis-sentinel.yml start redis-master

# Check its role
docker compose -f docker-compose.redis-sentinel.yml exec redis-master redis-cli INFO replication | grep role
# role:slave (now a replica!)
```

### Verify Zero Data Loss

```bash
# Before failover - write test data
docker compose -f docker-compose.redis-sentinel.yml exec redis-master redis-cli SET test:failover "before_failover"

# Kill master
docker compose -f docker-compose.redis-sentinel.yml stop redis-master

# Wait for failover (5-10 seconds)

# After failover - read test data from new master
docker compose -f docker-compose.redis-sentinel.yml exec redis-replica-1 redis-cli GET test:failover
# "before_failover" - data preserved!
```

## Zero-Downtime Migration

### Phase 1: Preparation (No Downtime)

1. **Current state**: Application using single Redis

2. **Start Sentinel cluster** (runs alongside single Redis):
```bash
docker compose -f docker-compose.redis-sentinel.yml up -d
```

3. **Deploy code with Sentinel support** (still using single Redis):
```bash
# .env remains unchanged (REDIS_MODE=single)
npm run build
```

Application continues using single Redis - no impact.

### Phase 2: Switch to Sentinel (Brief Connection Blip)

1. **Update environment**:
```bash
# .env
REDIS_MODE=sentinel
REDIS_SENTINEL_HOSTS=localhost:26379,localhost:26380,localhost:26381
```

2. **Restart application**:
```bash
# Production (PM2/Docker)
pm2 restart app

# Development
npm run dev
```

3. **Verify connection**:
```bash
curl http://localhost:9002/api/health/redis
```

### Phase 3: Validation (Monitor for 24 hours)

1. **Monitor application logs** for connection errors
2. **Check Sentinel logs** for any issues
3. **Test failover** in staging environment
4. **Monitor latency** and performance

### Rollback Plan

If issues occur, rollback is instant:

```bash
# .env
REDIS_MODE=single
REDIS_URL=redis://localhost:6379

# Restart application
pm2 restart app
```

## Production Deployment

### AWS ElastiCache with Sentinel

1. **Create ElastiCache Replication Group**:
```bash
aws elasticache create-replication-group \
  --replication-group-id luxefinds-redis \
  --replication-group-description "LuxeFinds Redis Sentinel" \
  --engine redis \
  --cache-node-type cache.t3.small \
  --num-cache-clusters 3 \
  --automatic-failover-enabled \
  --multi-az-enabled
```

2. **Get endpoint**:
```bash
aws elasticache describe-replication-groups \
  --replication-group-id luxefinds-redis \
  --query 'ReplicationGroups[0].ConfigurationEndpoint'
```

3. **Configure application**:
```bash
# Production .env
REDIS_MODE=sentinel
REDIS_SENTINEL_HOSTS=your-redis.amazonaws.com:26379
REDIS_SENTINEL_MASTER=mymaster
REDIS_SENTINEL_PASSWORD=your_secure_password
```

### Redis Cloud with Sentinel

1. **Create Redis Cloud subscription** with High Availability

2. **Get Sentinel endpoints** from Redis Cloud dashboard

3. **Configure**:
```bash
REDIS_MODE=sentinel
REDIS_SENTINEL_HOSTS=redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:26379,...
REDIS_SENTINEL_MASTER=mymaster
REDIS_SENTINEL_PASSWORD=your_password
```

### Docker Swarm / Kubernetes

For containerized production:

**Docker Swarm:**
```yaml
services:
  app:
    environment:
      - REDIS_MODE=sentinel
      - REDIS_SENTINEL_HOSTS=sentinel-1:26379,sentinel-2:26379,sentinel-3:26379
    deploy:
      replicas: 3
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
data:
  REDIS_MODE: "sentinel"
  REDIS_SENTINEL_HOSTS: "sentinel-svc:26379"
```

## Monitoring

### Check Cluster Status

```bash
# Sentinel status
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 redis-cli -p 26379 SENTINEL masters

# Master info
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 redis-cli -p 26379 SENTINEL master mymaster

# Replica info
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 redis-cli -p 26379 SENTINEL slaves mymaster

# Sentinel info
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 redis-cli -p 26379 SENTINEL sentinels mymaster
```

### Health Check Endpoint

```bash
# Application health check
curl http://localhost:9002/api/health/redis

# Response includes:
{
  "status": "healthy",
  "mode": "sentinel",
  "role": "master",
  "connectedSlaves": 2,
  "sentinels": 3,
  "latency": "2ms",
  "readWriteTest": "passed",
  "keys": 42
}
```

### Monitor Failovers

```bash
# Watch for failover events
docker compose -f docker-compose.redis-sentinel.yml logs -f | grep "switch-master"
```

### Application Logs

Application automatically logs Sentinel events:
```
[Redis] Connecting to Sentinel cluster: mymaster via 3 sentinels
[Redis] Connected successfully
[Redis Sentinel] Master switched from 172.20.0.2:6379 to 172.20.0.3:6379
```

## Troubleshooting

### Issue: Failover Not Happening

**Check quorum**:
```bash
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 redis-cli -p 26379 SENTINEL master mymaster | grep quorum
```

Expected: `quorum 2`

**Check sentinels are monitoring**:
```bash
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 redis-cli -p 26379 SENTINEL sentinels mymaster
```

Expected: Should show all 3 sentinels

### Issue: Application Not Connecting

**Check Redis mode**:
```bash
echo $REDIS_MODE
# Should be: sentinel
```

**Check Sentinel hosts**:
```bash
echo $REDIS_SENTINEL_HOSTS
# Should be: localhost:26379,localhost:26380,localhost:26381
```

**Test Sentinel connection**:
```bash
redis-cli -h localhost -p 26379 ping
# PONG
```

### Issue: Split Brain (Multiple Masters)

This should not happen with quorum=2, but if it does:

1. **Stop all Redis nodes**
2. **Clear Sentinel state**
3. **Restart in order**: master → replicas → sentinels

### Issue: Replica Not Syncing

**Check replication status**:
```bash
docker compose -f docker-compose.redis-sentinel.yml exec redis-replica-1 redis-cli INFO replication
```

Look for:
- `master_link_status:up`
- `master_sync_in_progress:0`

## Performance Considerations

### Read Distribution

Sentinel setup allows read scaling:

```typescript
// Read from replicas (add to redis.ts if needed)
const replica = new Redis({
  sentinels: [...],
  name: 'mymaster',
  role: 'slave', // Connect to replica for reads
});
```

### Connection Pooling

Current setup uses singleton pattern - suitable for most cases. For high-concurrency:

```typescript
// Create connection pool (future enhancement)
const pool = new Redis.Cluster([...sentinels]);
```

### Latency

- **Normal operations**: 1-5ms
- **Failover time**: 5-10 seconds
- **Sync lag**: < 1 second (replicas are slightly behind)

## Security

### Enable Authentication

1. **Add password to Redis nodes**:
```bash
# In docker-compose.redis-sentinel.yml
command: redis-server --requirepass your_password --appendonly yes ...
```

2. **Update Sentinel config**:
```conf
sentinel auth-pass mymaster your_password
```

3. **Update application**:
```bash
REDIS_SENTINEL_PASSWORD=your_password
```

### Network Security

For production:
- Use private networks (VPC)
- Enable TLS/SSL
- Restrict ports (only allow app servers)
- Use firewall rules

## Backup and Recovery

### Automated Backups

Redis AOF (Append-Only File) is enabled. Data is persisted to volumes:

```bash
# Backup volumes
docker run --rm -v luxefinds_redis_master_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz /data

# Restore
docker run --rm -v luxefinds_redis_master_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/redis-backup.tar.gz --strip 1"
```

## Cost Estimation

### Local Development
- **Free** - Uses Docker containers

### Production (AWS ElastiCache)
- **cache.t3.small** (3 nodes): ~$75/month
- **cache.t3.medium** (3 nodes): ~$150/month
- **cache.m5.large** (3 nodes): ~$300/month

### Production (Redis Cloud)
- **1GB High Availability**: ~$30/month
- **5GB High Availability**: ~$150/month

## FAQ

**Q: How long does failover take?**
A: 5-10 seconds. Applications reconnect automatically.

**Q: Will I lose data during failover?**
A: No, replicas are synced. Only writes in the last few milliseconds might be lost.

**Q: Can I use this with the current single Redis?**
A: Yes! Set `REDIS_MODE=single` (default) to use single Redis.

**Q: How do I upgrade to Redis Cluster later?**
A: Redis Sentinel can be upgraded to Redis Cluster with data migration scripts.

**Q: What if all sentinels fail?**
A: Applications continue using last known master. No new failovers occur until sentinels are back.

**Q: Do I need Sentinel for development?**
A: No, single Redis is fine for dev. Use Sentinel to test HA features.

---

**Last Updated**: February 2026  
**Status**: ✅ Production Ready  
**Author**: LuxeFinds DevOps Team
