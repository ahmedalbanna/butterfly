# 🐳 Docker Setup for LuxeFinds

Complete Docker configuration for LuxeFinds with organized services and flexible profiles for selective startup.

## 📋 Quick Start

### Option 1: Using the Helper Script (Recommended)

```bash
# Start core services only (PostgreSQL + Redis)
./docker/scripts/start.sh

# Start with AI services
./docker/scripts/start.sh --profile ai

# Start with monitoring
./docker/scripts/start.sh --profile monitoring

# Start everything
./docker/scripts/start.sh --all
```

### Option 2: Using Docker Compose Directly

```bash
# Start core services
docker compose -f docker/docker-compose.yml up -d

# Start with AI
docker compose -f docker/docker-compose.yml --profile ai up -d

# Start with monitoring
docker compose -f docker/docker-compose.yml --profile monitoring up -d

# Start with HA
docker compose -f docker/docker-compose.yml --profile ha up -d
```

## 🎯 Service Profiles

### Core Services (Always Enabled)

Services that run by default:

| Service | Port | Purpose |
|---------|------|---------|
| **PostgreSQL** | 5432 | Main database |
| **Redis** | 6379 | Cache & signaling |

### Optional Profiles

#### `ai` Profile
Enable AI/ML features:

| Service | Port | Purpose |
|---------|------|---------|
| **Ollama** | 11434 | Vision AI models (llava) |

Usage:
```bash
./docker/scripts/start.sh --profile ai
```

#### `monitoring` Profile
Enable observability stack:

| Service | Port | Purpose |
|---------|------|---------|
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3000 | Dashboards & visualization |
| **AlertManager** | 9093 | Alert management |

Usage:
```bash
./docker/scripts/start.sh --profile monitoring
```

#### `ha` Profile
Enable high availability setup:

| Service | Port | Purpose |
|---------|------|---------|
| **Redis Master** | 6379 | Primary cache |
| **Redis Replica 1** | 6380 | Replica 1 |
| **Redis Replica 2** | 6381 | Replica 2 |
| **Redis Sentinel 1** | 26379 | Failover manager 1 |
| **Redis Sentinel 2** | 26380 | Failover manager 2 |
| **Redis Sentinel 3** | 26381 | Failover manager 3 |

Usage:
```bash
./docker/scripts/start.sh --profile ha
```

#### `development` Profile
Development-specific configurations (for future use)

## 📁 Directory Structure

```
docker/
├── docker-compose.yml          # Main compose file with all profiles
├── .env.docker                 # Environment configuration
├── configs/                    # Configuration files
│   ├── prometheus.yml         # Prometheus config
│   ├── alertmanager.yml       # AlertManager config
│   ├── prometheus-alerts.yml  # Alert rules
│   └── postgres-init.sh       # PostgreSQL initialization
├── scripts/                    # Helper scripts
│   ├── start.sh               # Smart startup script
│   ├── health-check.sh        # Health verification
│   └── README.md              # Scripts documentation
└── README.md                   # This file
```

## 🚀 Common Commands

### Viewing Logs

```bash
# View all logs
docker compose -f docker/docker-compose.yml logs -f

# View specific service
docker compose -f docker/docker-compose.yml logs -f postgres
docker compose -f docker/docker-compose.yml logs -f redis
docker compose -f docker/docker-compose.yml logs -f ollama

# View last 100 lines
docker compose -f docker/docker-compose.yml logs --tail 100
```

### Service Management

```bash
# View status
docker compose -f docker/docker-compose.yml ps

# Stop services
docker compose -f docker/docker-compose.yml stop

# Restart services
docker compose -f docker/docker-compose.yml restart

# Remove containers (keep volumes)
docker compose -f docker/docker-compose.yml down

# Remove everything (including volumes)
docker compose -f docker/docker-compose.yml down -v
```

### Health Checks

```bash
# Check health of running services
./docker/scripts/health-check.sh

# Watch health status (updates every 5 seconds)
./docker/scripts/health-check.sh --watch
```

### Database Operations

```bash
# Access PostgreSQL shell
docker compose -f docker/docker-compose.yml exec postgres psql -U luxefinds_admin -d luxefinds

# Useful psql commands:
# \dt                 - List all tables
# \d table_name       - Describe table
# SELECT * FROM ...   - Query data
# \q                  - Quit
```

### Cache Operations

```bash
# Access Redis CLI
docker compose -f docker/docker-compose.yml exec redis redis-cli

# Useful redis-cli commands:
# PING               - Test connection
# KEYS *             - List all keys
# GET key_name       - Get value
# DBSIZE             - Database size
# FLUSHDB            - Clear database
```

## 🔧 Configuration

### Environment Variables

Edit `docker/.env.docker` to customize:

```bash
# PostgreSQL
POSTGRES_USER=luxefinds_admin
POSTGRES_PASSWORD=luxefinds_secure_pass_2026
POSTGRES_DB=luxefinds
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379
REDIS_MEMORY=256mb

# Ollama (AI)
OLLAMA_PORT=11434

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_PASSWORD=admin
ALERTMANAGER_PORT=9093
```

### Resource Limits

Edit `docker/docker-compose.yml` to set resource limits:

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

## 📊 Monitoring

### Prometheus

Access at `http://localhost:9090`

- Metrics for all services
- Query examples in Prometheus docs
- Configure scrape intervals in `docker/configs/prometheus.yml`

### Grafana

Access at `http://localhost:3000`

- Default credentials: `admin` / `admin` (change password on first login)
- Add Prometheus as data source
- Create dashboards for metrics

### AlertManager

Access at `http://localhost:9093`

- Configure alerts in `docker/configs/alertmanager.yml`
- Set up notification channels (email, Slack, etc.)

## 🔐 Security Notes

### Development vs Production

**Development (Current Setup):**
- Default credentials used
- All services accessible on localhost
- No SSL/TLS

**Production Recommendations:**
1. Change all default passwords
2. Use strong credentials
3. Enable SSL/TLS for all services
4. Restrict network access
5. Use environment variables for secrets
6. Enable authentication for Redis
7. Set resource limits
8. Regular backups

### Credential Management

1. Create `.env.local` for local overrides:
   ```bash
   POSTGRES_PASSWORD=your_secure_password
   GRAFANA_PASSWORD=your_secure_password
   ```

2. Never commit `.env.local` to git

3. Use environment variables in production:
   ```bash
   export POSTGRES_PASSWORD=secret
   docker compose ... up -d
   ```

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :11434 # Ollama

# View detailed logs
docker compose -f docker/docker-compose.yml logs

# Check Docker daemon
docker ps
docker logs container_name
```

### Connection Issues

```bash
# Test PostgreSQL connection
PGPASSWORD=luxefinds_secure_pass_2026 psql -h localhost -U luxefinds_admin -d luxefinds

# Test Redis connection
redis-cli -h localhost ping

# Test Ollama
curl http://localhost:11434/
```

### Memory Issues

```bash
# Check Docker resource usage
docker stats

# Check system memory
free -h

# Reduce Redis memory limit in .env.docker
REDIS_MEMORY=128mb  # From default 256mb
```

### Permissions Issues

```bash
# Fix script permissions
chmod +x docker/scripts/*.sh

# Fix config file permissions
chmod 644 docker/configs/*.yml
chmod 755 docker/configs/*.sh
```

## 📚 Advanced Usage

### Multiple Profiles

```bash
# Start with both AI and monitoring
./docker/scripts/start.sh --profile ai --profile monitoring

# Equivalent Docker Compose command
docker compose -f docker/docker-compose.yml --profile ai --profile monitoring up -d
```

### Custom Compose File Paths

If working from project root:
```bash
docker compose -f docker/docker-compose.yml up -d
```

If working from docker directory:
```bash
cd docker && docker compose up -d
```

### Docker Network

All services communicate via the `luxefinds` network:

```bash
# Inspect network
docker network inspect luxefinds

# Services can reach each other by name:
# - postgres:5432
# - redis:6379
# - ollama:11434
# etc.
```

### Volumes

Data persists in Docker volumes:

```bash
# List volumes
docker volume ls | grep luxefinds

# Inspect volume
docker volume inspect luxefinds_postgres_data

# Backup volume
docker run --rm -v luxefinds_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm -v luxefinds_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## 🔄 Backup & Recovery

### PostgreSQL Backup

```bash
# Backup
docker compose -f docker/docker-compose.yml exec postgres pg_dump -U luxefinds_admin luxefinds > backup.sql

# Restore
cat backup.sql | docker compose -f docker/docker-compose.yml exec -T postgres psql -U luxefinds_admin luxefinds
```

### Redis Backup

```bash
# Backup (via volume)
docker run --rm -v luxefinds_redis_data:/data -v $(pwd):/backup alpine cp /data/dump.rdb /backup/

# Redis has automatic persistence (AOF) in compose file
```

## 📞 Support

### Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Ollama Documentation](https://ollama.ai/)

### Getting Help

1. Check logs: `docker compose ... logs`
2. Run health checks: `./docker/scripts/health-check.sh`
3. Review this README
4. Check service-specific documentation

## 📝 Version Information

- Docker Compose: 3.8+
- PostgreSQL: 16-alpine
- Redis: 7-alpine
- Ollama: latest
- Prometheus: latest
- Grafana: latest

---

**Last Updated:** February 10, 2026

For more information, see the main [README.md](../README.md) or [docs/setup/docker-setup.md](../docs/setup/docker-setup.md).
