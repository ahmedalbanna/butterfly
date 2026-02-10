# 🐳 Docker Setup Guide

Complete guide for setting up PostgreSQL, Redis, Ollama, and other services with Docker.

## Quick Start

```bash
# Start all services
docker compose up -d

# View status
docker compose ps

# View logs
docker compose logs -f
```

## PostgreSQL Database

### Starting PostgreSQL

```bash
docker compose up -d postgres
```

### Connection Details

- **Database:** luxefinds
- **Username:** luxefinds_admin
- **Password:** luxefinds_secure_pass_2026
- **Port:** 5432
- **Connection String:** `postgresql://luxefinds_admin:luxefinds_secure_pass_2026@localhost:5432/luxefinds`

### Common Commands

```bash
# View logs
docker compose logs postgres
docker compose logs -f postgres  # Follow logs

# Access PostgreSQL shell
docker compose exec postgres psql -U luxefinds_admin -d luxefinds

# Check status
docker compose ps postgres
```

### PostgreSQL Shell Commands

```sql
\dt              -- List all tables
\d product       -- Describe product table
SELECT * FROM "Product" LIMIT 5;
\q               -- Quit
```

### Backup & Restore

```bash
# Backup database
docker compose exec postgres pg_dump -U luxefinds_admin luxefinds > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U luxefinds_admin luxefinds
```

### Reset Database

```bash
# Stop and remove everything (keeps data in volume)
docker compose down

# Stop and remove data completely
docker compose down -v

# Recreate schema
npm run db:push
npm run db:seed
```

### Data Persistence

Data is stored in Docker volume `butterfly_postgres_data`:
- ✅ Data persists across container restarts
- ✅ Data survives `docker compose down`
- ❌ Data is lost with `docker compose down -v`

### Troubleshooting PostgreSQL

**Port Already in Use:**
```yaml
# Edit docker-compose.yml
ports:
  - "5433:5432"  # Use port 5433 instead
```

Then update `.env`:
```
DATABASE_URL=postgresql://luxefinds_admin:luxefinds_secure_pass_2026@localhost:5433/luxefinds
```

**Container Won't Start:**
```bash
# Check logs
docker compose logs postgres

# Remove and recreate
docker compose down
docker compose up -d postgres
```

**Connection Refused:**
```bash
# Wait for container to be healthy
docker compose ps postgres
# Status should be "healthy" before connecting

# If not healthy, check logs
docker compose logs postgres
```

## Redis Cache

### Starting Redis

```bash
docker compose up -d redis
```

### Common Commands

```bash
# View logs
docker compose logs redis
docker compose logs -f redis

# Access Redis CLI
docker compose exec redis redis-cli

# Check status
docker compose ps redis
```

### Redis CLI Commands

```bash
PING                    -- Test connection (returns PONG)
INFO                    -- Server information
DBSIZE                  -- Number of keys
FLUSHDB                 -- Clear current database
FLUSHALL                -- Clear all databases
KEYS *                  -- List all keys
GET key_name            -- Get value
SET key_name value      -- Set value
TTL key_name            -- Time to live
QUIT                    -- Exit
```

### Redis Use Cases

Redis in LuxeFinds is used for:
- **WebRTC Signaling:** Voice call peer discovery and connection
- **Pub/Sub Messaging:** Real-time message delivery
- **Server-Sent Events:** Instant notifications
- **Session Caching:** Temporary data storage with auto-expiration

### Troubleshooting Redis

**Connection Issues:**
```bash
# Test connection
docker compose exec redis redis-cli ping
# Should return: PONG

# Restart if needed
docker compose restart redis
```

**Memory Issues:**
```bash
# Check memory usage
docker compose exec redis redis-cli INFO memory

# Clear cache (careful!)
docker compose exec redis redis-cli FLUSHDB
```

## Ollama (AI Models)

### Starting Ollama

```bash
docker compose up -d ollama
```

### Pull Models

```bash
# Pull llava model for vision AI
docker compose exec ollama ollama pull llava

# List available models
docker compose exec ollama ollama list
```

### Testing Ollama

```bash
# Direct API test
curl http://localhost:11434/api/generate -d '{
  "model": "llava",
  "prompt": "What is in this image?",
  "stream": false
}'

# Check service health
curl http://localhost:11434/
```

### Common Commands

```bash
# View logs
docker compose logs ollama
docker compose logs -f ollama

# Check status
docker compose ps ollama
```

### Troubleshooting Ollama

**Model Not Loading:**
```bash
# Verify model exists
docker compose exec ollama ollama list

# Restart Ollama
docker compose restart ollama

# Check logs for errors
docker compose logs ollama
```

**Out of Memory:**
```bash
# Check resource usage
docker stats ollama

# Reduce model size or allocate more resources
# See "Resource Management" section
```

## All Services Together

### Start Everything

```bash
docker compose up -d
```

### View All Services

```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS
luxefinds-postgres      Up (healthy)
luxefinds-redis         Up
luxefinds-ollama        Up
```

### View Combined Logs

```bash
# All logs
docker compose logs

# Follow logs
docker compose logs -f

# Specific service
docker compose logs -f postgres
```

### Stop Everything

```bash
docker compose stop
```

### Remove Everything (Keep Data)

```bash
docker compose down
```

### Remove Everything (Delete Data)

```bash
docker compose down -v
```

## Advanced: Resource Management

### View Resource Usage

```bash
docker stats
```

### Limit Resources (in docker-compose.yml)

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Check Container Info

```bash
docker inspect luxefinds-postgres
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Production Deployment Considerations

⚠️ **For development only**, the docker-compose file uses hardcoded credentials.

**For production:**
1. Change all passwords in docker-compose.yml
2. Use environment variables for secrets
3. Enable SSL/TLS for database connections
4. Set resource limits
5. Configure backup and monitoring
6. Use persistent storage outside containers
7. Implement proper access control

See `docs/deployment/` for production deployment guides.

## Integration with Next.js

The application automatically connects to services using environment variables:

```bash
DATABASE_URL=postgresql://...       # PostgreSQL
REDIS_URL=redis://localhost:6379    # Redis
OLLAMA_URL=http://localhost:11434   # Ollama
```

To use different ports, update these variables and the docker-compose.yml mappings.

## Database Initialization

After starting PostgreSQL for the first time:

```bash
# 1. Generate Prisma client
npm run db:generate

# 2. Create schema
npm run db:push

# 3. Seed sample data
npm run db:seed

# 4. Verify in Prisma Studio
npm run db:studio
```

## Health Checks

```bash
# PostgreSQL
docker compose exec postgres psql -U luxefinds_admin -d luxefinds -c "SELECT 1"

# Redis
docker compose exec redis redis-cli ping

# Ollama
curl -s http://localhost:11434/ && echo "Ollama is running"
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port already in use | Change port mapping in docker-compose.yml |
| Container fails to start | Check logs: `docker compose logs SERVICE_NAME` |
| Database connection refused | Ensure postgres container is healthy: `docker compose ps` |
| Redis timeout | Restart redis: `docker compose restart redis` |
| Ollama out of memory | Check available memory: `docker stats` |
| Data lost after restart | Use `docker compose down` not `docker compose down -v` |

## Next Steps

- **Setup environment variables:** See root `ENVIRONMENT_SETUP_GUIDE.md`
- **Initialize database:** Run `npm run db:push && npm run db:seed`
- **Start development:** Run `npm run dev`
- **Learn more about Redis:** See `docs/setup/redis-setup.md`
- **Learn about AI setup:** See `docs/setup/ai-setup.md`

---

For more help, check the troubleshooting section or the relevant setup guide.
