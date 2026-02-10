# 🔴 Redis Setup Guide

Complete guide for Redis configuration, WebRTC signaling, high availability, and troubleshooting.

## Quick Start

```bash
# Start Redis (basic)
docker compose up -d redis

# Verify it's running
docker compose ps redis
docker compose exec redis redis-cli ping
# Response: PONG
```

## Redis Overview

Redis in LuxeFinds is used for:

- **WebRTC Signaling:** Peer discovery and SDP/ICE candidate exchange for voice calls
- **Pub/Sub Messaging:** Real-time message delivery to connected clients
- **Server-Sent Events (SSE):** Real-time notifications and updates
- **Session Caching:** Temporary data with auto-expiration (10-minute TTL)
- **Horizontal Scaling:** Shared state across multiple Next.js instances

## Basic Redis Setup

### Starting Redis

```bash
# Using docker-compose (recommended)
docker compose up -d redis

# Or manual Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Connection Details

- **Host:** localhost
- **Port:** 6379
- **Password:** None (development)
- **Connection String:** `redis://localhost:6379`

### Common Commands

```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# Test connection
docker compose exec redis redis-cli ping
# Response: PONG

# View all keys
docker compose exec redis redis-cli KEYS "*"

# Get a specific key
docker compose exec redis redis-cli GET key_name

# Clear all data
docker compose exec redis redis-cli FLUSHDB

# View memory usage
docker compose exec redis redis-cli INFO memory
```

### Monitoring Redis

```bash
# Real-time command monitoring
docker compose exec redis redis-cli MONITOR

# Statistics
docker compose exec redis redis-cli INFO

# Check memory
docker compose exec redis redis-cli INFO memory

# Check connected clients
docker compose exec redis redis-cli CLIENT LIST
```

### Troubleshooting Basic Setup

**Redis won't start:**
```bash
# Check logs
docker compose logs redis

# Restart
docker compose restart redis
```

**Port already in use:**
```yaml
# Edit docker-compose.yml
ports:
  - "6380:6379"  # Use port 6380
```

Then update `.env`:
```bash
REDIS_URL=redis://localhost:6380
```

**Connection refused:**
```bash
# Ensure Redis is running
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping
```

## WebRTC Signaling with Redis

### Architecture

Redis signaling enables scalable WebRTC connections:

```
Customer ↔ [Redis] ↔ Admin
  ↓
[SSE Stream]
  ↓
[Signal Messages]
 (Offer/Answer/ICE)
```

### How It Works

1. **Initiate Call:** Customer creates WebRTC offer
2. **Store & Publish:** Offer sent to `/api/calls/signal`, stored in Redis, published to channel
3. **Real-time Delivery:** Admin receives via SSE (Server-Sent Events)
4. **Exchange SDP:** Both sides exchange Session Description Protocol
5. **ICE Candidates:** Network address candidates exchanged
6. **Connection:** P2P audio connection established
7. **Cleanup:** Call ends, Redis keys deleted

### Data Storage

Redis stores signaling data as:

```bash
# Message queue (Redis List)
signal:{callId}:messages

# Pub/Sub channel (Redis Channel)
signal:{callId}:channel

# Expiration
TTL: 10 minutes (auto-cleanup)
```

### Message Format

```json
{
  "type": "offer|answer|ice-candidate|call-ended",
  "sender": "customer|admin",
  "data": {
    "sdp": "...",
    "iceCandidate": {...}
  },
  "timestamp": 1676000000000
}
```

### API Endpoints

- **POST `/api/calls/signal`** - Send signaling message
- **GET `/api/calls/signal`** - Retrieve messages (polling fallback)
- **DELETE `/api/calls/signal`** - Cleanup after call
- **GET `/api/calls/signal/subscribe`** - SSE stream

### Real-time Updates with SSE

The application uses Server-Sent Events for real-time signaling:

```bash
# Browser automatically opens SSE connection
# GET /api/calls/signal/subscribe?callId=xyz

# Receives messages in real-time:
# data: {"type":"offer",...}
# data: {"type":"ice-candidate",...}
# data: {"type":"answer",...}
```

### Fallback to Polling

If SSE fails, the system automatically falls back to polling:

```bash
# Polls every 1-2 seconds
# GET /api/calls/signal?callId=xyz

# Less efficient but ensures connectivity
```

### Testing Signaling

```bash
# 1. Monitor Redis in real-time
docker compose exec redis redis-cli MONITOR

# 2. In another terminal, start development
npm run dev

# 3. Open app in two browsers
# Customer initiates call
# Check Redis for signal:* keys

# 4. View stored messages
docker compose exec redis redis-cli LRANGE signal:call-id:messages 0 -1
```

## High Availability: Redis Sentinel

For production, use Redis Sentinel for automatic failover and monitoring.

### Architecture

```
                Master (6379)
                ↙   ↓   ↖
        Replica1   Sentinel1   Replica2
                ↓       ↓       ↓
             Sentinel2 - Sentinel3
                      (Quorum: 2/3)
```

### Quick Start

```bash
# Start Redis Sentinel cluster
docker compose -f docker-compose.redis-sentinel.yml up -d

# Verify all services
docker compose -f docker-compose.redis-sentinel.yml ps
```

Expected services:
- `redis-master` (6379)
- `redis-replica-1` (6380)
- `redis-replica-2` (6381)
- `redis-sentinel-1` (26379)
- `redis-sentinel-2` (26380)
- `redis-sentinel-3` (26381)

### Configuration

Add to `.env`:

```bash
REDIS_MODE=sentinel
REDIS_SENTINEL_HOSTS=localhost:26379,localhost:26380,localhost:26381
REDIS_SENTINEL_MASTER=mymaster
```

### How Sentinel Works

1. **Monitoring:** Sentinels continuously check Redis health
2. **Detection:** If master is down for > 30 seconds
3. **Voting:** Sentinels vote for failover (quorum: 2/3)
4. **Promotion:** A replica becomes new master
5. **Reconfiguration:** Other replicas follow new master
6. **Notification:** Application reconnects automatically

### Failover Testing

Simulate master failure:

```bash
# Stop the master
docker compose -f docker-compose.redis-sentinel.yml stop redis-master

# Watch automatic failover in Sentinel logs
docker compose -f docker-compose.redis-sentinel.yml logs -f redis-sentinel-1

# After ~5-10 seconds:
# - One replica promoted to master
# - Application automatically reconnects
# - No data loss

# Check which is now master
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 \
  redis-cli -p 26379 SENTINEL masters
```

### Restart Master

```bash
# Bring master back online
docker compose -f docker-compose.redis-sentinel.yml start redis-master

# It will join as replica of new master
# (Optional) Promote it back to master:
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 \
  redis-cli -p 26379 SENTINEL failover mymaster
```

### Monitoring Sentinel

```bash
# Check master status
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 \
  redis-cli -p 26379 SENTINEL masters

# Check replicas
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 \
  redis-cli -p 26379 SENTINEL slaves mymaster

# Check sentinels
docker compose -f docker-compose.redis-sentinel.yml exec redis-sentinel-1 \
  redis-cli -p 26379 SENTINEL sentinels mymaster
```

## Redis Cluster (Advanced)

For horizontal scaling with data sharding:

```bash
docker compose -f docker-compose.redis-cluster.yml up -d
```

### Configuration

```bash
REDIS_MODE=cluster
REDIS_CLUSTER_NODES=localhost:6379,localhost:6380,localhost:6381,localhost:6382,localhost:6383,localhost:6384
```

### Cluster Characteristics

- **Automatic Sharding:** Data distributed across 6+ nodes
- **High Availability:** Each shard has replicas
- **Scalability:** Add nodes without downtime
- **Failover:** Automatic replica promotion

## Production Deployment

### Managed Services

Use managed Redis from cloud providers:

```bash
# AWS ElastiCache
REDIS_URL=rediss://username:password@your-cluster.ng.0001.usw2.cache.amazonaws.com:6379

# Redis Cloud
REDIS_URL=rediss://default:password@redis-host.cloud.redislabs.com:6379

# Azure Cache for Redis
REDIS_URL=rediss://default:password@redis-name.redis.cache.windows.net:6379
```

### TLS/SSL Configuration

```bash
# For managed services with TLS
REDIS_URL=rediss://username:password@redis-host:6379

# Verify certificate (in production)
# Add CA certificate to connection
```

### Security Best Practices

1. **Authentication:**
   ```bash
   # Set Redis password
   REDIS_URL=redis://:password@localhost:6379
   ```

2. **Network:**
   - Restrict Redis to internal network only
   - Use VPC/private subnets
   - Disable public access

3. **Monitoring:**
   - Alert on memory usage > 80%
   - Monitor connection count
   - Track command latency
   - Alert on replication lag

4. **Backup:**
   ```bash
   # Enable RDB persistence
   # Enable AOF (Append-Only File)
   # Regular backups to S3/GCS
   ```

### Resource Allocation

```yaml
services:
  redis:
    deploy:
      resources:
        limits:
          memory: 2G        # Adjust based on data size
        reservations:
          memory: 1G        # Reserve 1GB minimum
```

### Performance Tuning

```bash
# Redis configuration
maxmemory 2gb                    # Maximum memory
maxmemory-policy allkeys-lru     # Eviction policy
tcp-keepalive 60                 # Connection keep-alive
timeout 0                        # No client timeout
```

## Troubleshooting

### Connection Issues

**Problem:** `Connection refused`

**Solution:**
```bash
# Check if Redis is running
docker compose ps redis

# Check logs
docker compose logs redis

# Restart Redis
docker compose restart redis

# Test connection
docker compose exec redis redis-cli ping
```

### Memory Issues

**Problem:** `Out of memory` errors

**Solution:**
```bash
# Check memory usage
docker compose exec redis redis-cli INFO memory

# Clear unnecessary data
docker compose exec redis redis-cli FLUSHDB

# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

### Slow Performance

**Problem:** High latency on signaling

**Symptoms:**
- Voice call delays
- Message delivery slow
- SSE updates delayed

**Solution:**
```bash
# Check memory
docker compose exec redis redis-cli INFO memory

# Check client count
docker compose exec redis redis-cli CLIENT LIST | wc -l

# Monitor commands
docker compose exec redis redis-cli SLOWLOG GET 10

# Check network latency
docker compose exec redis redis-cli --latency
```

### Sentinel Issues

**Problem:** Failover not working

**Solution:**
```bash
# Check sentinel status
docker compose -f docker-compose.redis-sentinel.yml \
  exec redis-sentinel-1 redis-cli -p 26379 SENTINEL masters

# Check if all sentinels are connected
docker compose -f docker-compose.redis-sentinel.yml \
  exec redis-sentinel-1 redis-cli -p 26379 SENTINEL sentinels mymaster

# View sentinel logs
docker compose -f docker-compose.redis-sentinel.yml logs redis-sentinel-1
```

### SSE Connection Issues

**Problem:** Voice calls fall back to polling

**Debug in browser console:**
```javascript
// Should show:
// [WebRTC] SSE connection opened
// [WebRTC] Received offer
// [WebRTC] Received answer

// If not, check:
// 1. Network tab - /api/calls/signal/subscribe request
// 2. Request should stay open (not close immediately)
// 3. Response headers should include: Content-Type: text/event-stream

// Common issues:
// - Proxy buffering SSE responses
// - Firewall blocking SSE
// - Incorrect REDIS_URL in .env
```

## Health Checks

```bash
# Health check endpoint
curl http://localhost:9002/api/health/redis

# Response should be:
# {"status":"healthy","latency":"1ms"}

# Or check directly
docker compose exec redis redis-cli PING
```

## Integration with Application

### Environment Variables

```bash
# Basic Redis
REDIS_URL=redis://localhost:6379

# Redis with password
REDIS_URL=redis://:password@localhost:6379

# Redis Sentinel
REDIS_MODE=sentinel
REDIS_SENTINEL_HOSTS=localhost:26379,localhost:26380,localhost:26381
REDIS_SENTINEL_MASTER=mymaster

# Redis Cluster
REDIS_MODE=cluster
REDIS_CLUSTER_NODES=localhost:6379,localhost:6380,...
```

### Code Usage

Voice call signaling uses Redis automatically:

```typescript
// src/hooks/use-webrtc-call.ts
// Automatically uses REDIS_URL from .env
// Connects via SSE, falls back to polling
// No code changes needed
```

## Performance Benchmarks

| Scenario | Latency | Notes |
|----------|---------|-------|
| Signal message delivery (SSE) | 5-50ms | Real-time via Pub/Sub |
| Signal message delivery (Polling) | 500-2000ms | Fallback every 1-2s |
| ICE candidate exchange | 10-100ms | Network dependent |
| Full call setup | 1-3 seconds | Including SDP exchange |

## Next Steps

1. **Start with basic Redis:** `docker compose up -d redis`
2. **Test voice calls:** `/admin` → Click phone icon
3. **For production:** Use Sentinel or managed service
4. **Monitor:** Set up alerts for memory and performance
5. **Scale:** Add more Next.js instances, Redis handles coordination

## Learning Resources

- [Redis Documentation](https://redis.io/docs/)
- [Redis Sentinel](https://redis.io/topics/sentinel)
- [Redis Cluster](https://redis.io/topics/cluster-tutorial)
- [WebRTC Signaling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

---

For feature-specific documentation, see `docs/features/voice-calls.md`.
