# 🔴 Redis Signaling Implementation

This document describes the Redis-based signaling implementation for WebRTC voice calls in the Butterfly Store (LuxeFinds).

## Overview

The system replaces the previous in-memory signaling solution with **Redis + Server-Sent Events (SSE)** for production-ready, scalable WebRTC signaling.

## Architecture

### Components

1. **Redis Store** (`src/lib/redis.ts`)
   - Singleton client for general operations
   - Dedicated subscriber clients for Pub/Sub
   - Automatic reconnection and error handling

2. **Signaling API** (`src/app/api/calls/signal/route.ts`)
   - **POST**: Store signaling messages and publish to Redis channel
   - **GET**: Retrieve messages (fallback for clients without SSE)
   - **DELETE**: Cleanup messages after call ends

3. **SSE Endpoint** (`src/app/api/calls/signal/subscribe/route.ts`)
   - Real-time message delivery via Server-Sent Events
   - Redis Pub/Sub subscription per call
   - Automatic cleanup on client disconnect

4. **WebRTC Hook** (`src/hooks/use-webrtc-call.ts`)
   - Connects to SSE endpoint for real-time signaling
   - Falls back to polling if SSE fails
   - Manages EventSource lifecycle

## Data Model

### Redis Keys

```typescript
// Message storage (Redis List)
signal:{callId}:messages

// Pub/Sub channel (Redis Channel)
signal:{callId}:channel
```

### Message Format

```typescript
interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-ended';
  sender: 'customer' | 'admin';
  data: any; // SDP or ICE candidate data
  timestamp: number;
}
```

## Message Flow

### Call Initiation (Customer → Admin)

1. Customer calls `startCall()`
2. WebRTC creates offer (SDP)
3. POST to `/api/calls/signal` with offer
4. API stores in Redis List and publishes to channel
5. Admin's SSE connection receives real-time notification
6. Admin's hook processes offer and creates answer
7. Answer flows back through same process

### ICE Candidate Exchange

1. WebRTC generates ICE candidates (STUN/TURN)
2. POST each candidate to `/api/calls/signal`
3. Real-time delivery via SSE to peer
4. Peer adds ICE candidate to connection

### Call Termination

1. Either party calls `endCall()`
2. Sends 'call-ended' message
3. Both parties close connections
4. DELETE request to `/api/calls/signal` cleans up Redis keys

## Configuration

### Environment Variables

```bash
# Optional - defaults to localhost
REDIS_URL=redis://localhost:6379

# For production with TLS
REDIS_URL=rediss://username:password@redis-host:6379
```

### Docker Compose

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Message Retention

- **TTL**: 10 minutes (600 seconds)
- **Max Messages**: 50 per call
- **Eviction**: LRU (Least Recently Used) when memory limit reached

## Benefits

### Scalability
- Multiple Next.js instances can share signaling state
- No single point of failure
- Horizontal scaling ready

### Reliability
- Messages persist across server restarts
- Automatic TTL cleanup prevents memory leaks
- Fallback to polling if SSE fails

### Performance
- Real-time delivery via Pub/Sub (no polling delay)
- Efficient Redis operations (O(1) for most operations)
- Minimal bandwidth usage with SSE

### Monitoring
```bash
# Redis CLI commands for debugging
docker compose exec redis redis-cli

# Check active signaling keys
KEYS signal:*

# View messages for a call
LRANGE signal:call-123:messages 0 -1

# Monitor Pub/Sub activity
PUBSUB CHANNELS signal:*
PUBSUB NUMSUB signal:call-123:channel

# Check memory usage
INFO memory
```

## Testing

### Manual Test

1. Start Redis:
```bash
docker compose up -d redis
```

2. Run test script:
```bash
npx tsx tmp_rovodev_test_redis_signaling.ts
```

Expected output:
- ✅ Connection test passes
- ✅ Message storage works
- ✅ Pub/Sub delivers messages
- ✅ Cleanup removes keys

### Integration Test

1. Start development server:
```bash
npm run dev
```

2. Open two browser windows
3. Customer initiates call
4. Check browser console for SSE logs:
   - `[WebRTC] SSE connection opened`
   - `[WebRTC] Received offer/answer`
   - `[Signaling] offer from customer`

5. Monitor Redis:
```bash
# In another terminal
docker compose exec redis redis-cli MONITOR
```

## Troubleshooting

### SSE Connection Issues

**Symptom**: Falls back to polling immediately

**Check:**
```javascript
// Browser console
// Should see: [WebRTC] SSE connection opened
// If not, check:
```

1. Network tab shows `/api/calls/signal/subscribe` request
2. Request stays open (not closing immediately)
3. Response headers include `Content-Type: text/event-stream`

**Fix**: Ensure proxy/CDN doesn't buffer SSE responses

### Redis Connection Issues

**Symptom**: `[Redis] Connection error` in logs

**Check:**
```bash
docker compose ps redis
docker compose logs redis
```

**Fix:**
```bash
# Restart Redis
docker compose restart redis

# Check Redis logs
docker compose logs -f redis
```

### Message Not Delivered

**Symptom**: Call doesn't connect, no signaling messages received

**Debug:**
```bash
# Check if messages are being stored
docker compose exec redis redis-cli KEYS "signal:*"

# View messages
docker compose exec redis redis-cli LRANGE signal:call-id:messages 0 -1

# Check Pub/Sub
docker compose exec redis redis-cli PUBSUB CHANNELS
```

## Production Deployment

### Redis Cloud / Managed Service

1. Create Redis instance (AWS ElastiCache, Redis Cloud, etc.)
2. Get connection URL with TLS
3. Set environment variable:
```bash
REDIS_URL=rediss://username:password@your-host:6379
```

### High Availability

For production, use Redis Cluster or Sentinel:

```bash
# Redis Sentinel (automatic failover)
REDIS_URL=redis-sentinel://host1:26379,host2:26379,host3:26379/mymaster

# Redis Cluster (sharding + HA)
REDIS_URL=redis-cluster://host1:6379,host2:6379,host3:6379
```

### Monitoring

Set up alerts for:
- Redis memory usage > 80%
- Connection errors
- Message TTL expiration rates
- Pub/Sub channel count

### Scaling

The system scales horizontally:
1. Add more Next.js instances
2. All instances share Redis signaling state
3. SSE connections distribute across instances
4. Redis handles coordination

## Migration from In-Memory

The migration from in-memory to Redis was completed with:
1. ✅ Redis service added to docker-compose.yml
2. ✅ `ioredis` package installed
3. ✅ Redis client singleton created
4. ✅ Signaling API updated to use Redis
5. ✅ SSE endpoint created for Pub/Sub
6. ✅ WebRTC hook updated with SSE support
7. ✅ Tests passing
8. ✅ Documentation updated

**Breaking Changes**: None - API endpoints remain the same

**Backward Compatibility**: Polling fallback ensures compatibility

## Future Enhancements

- [ ] Redis Pub/Sub for call queue notifications
- [ ] Redis Streams for call history/analytics
- [ ] Rate limiting with Redis
- [ ] Distributed locks for admin assignment
- [ ] Call recording metadata in Redis

---

**Last Updated**: February 2026
**Status**: ✅ Production Ready
