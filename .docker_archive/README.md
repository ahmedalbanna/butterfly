# 📦 Old Docker Compose Files Archive

This folder contains the original docker-compose files that have been consolidated into the new organized `docker/` folder structure.

## Migration Status

✅ **All services have been reorganized into `docker/docker-compose.yml` with profiles**

## Files in This Archive

- `docker-compose.yml` - Main compose file (now in docker/docker-compose.yml)
- `docker-compose.postgres.yml` - PostgreSQL only (merged into core profile)
- `docker-compose.redis-sentinel.yml` - Redis Sentinel (now in ha profile)
- `docker-compose.redis-cluster.yml` - Redis Cluster (available via ha profile)
- `docker-compose.monitoring.yml` - Monitoring stack (now in monitoring profile)
- `docker-compose.ollama.yml` - Ollama AI (now in ai profile)
- `docker-compose.postgres-replicas.yml` - Postgres replication (available via ha profile)

## Using New Structure

See: `docker/README.md` for complete documentation

Quick start:
```bash
./docker/scripts/start.sh              # Core services
./docker/scripts/start.sh --profile ai # With AI
./docker/scripts/start.sh --all        # All services
```

## Reference

If you need to reference these old files for any reason, they are preserved here. However, all functionality has been preserved and improved in the new structure.

---

**Archived:** February 10, 2026  
**Migration Complete:** Yes ✅
