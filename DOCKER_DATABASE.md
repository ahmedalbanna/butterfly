# 🐳 Docker PostgreSQL Setup

## Quick Start

The PostgreSQL database is configured to run in Docker with the following credentials:

- **Database**: luxefinds
- **Username**: luxefinds_admin
- **Password**: luxefinds_secure_pass_2026
- **Port**: 5432 (mapped to localhost)

## Docker Commands

### Start Database
```bash
docker compose up -d
```

### Stop Database
```bash
docker compose stop
```

### Restart Database
```bash
docker compose restart
```

### Stop and Remove (keeps data)
```bash
docker compose down
```

### Remove Everything (including data)
```bash
docker compose down -v
```

### View Logs
```bash
docker compose logs postgres
docker compose logs -f postgres  # Follow logs
```

### Check Status
```bash
docker compose ps
```

### Access PostgreSQL Shell
```bash
docker compose exec postgres psql -U luxefinds_admin -d luxefinds
```

Common psql commands:
```sql
\dt              -- List all tables
\d product       -- Describe product table
SELECT * FROM "Product" LIMIT 5;
\q               -- Quit
```

## Connection Details

The application connects using this connection string (already configured in `.env`):
```
postgresql://luxefinds_admin:luxefinds_secure_pass_2026@localhost:5432/luxefinds
```

## Data Persistence

Data is stored in a Docker volume named `butterfly_postgres_data`. This means:
- ✅ Data persists across container restarts
- ✅ Data survives `docker compose down`
- ❌ Data is lost with `docker compose down -v`

## Backup & Restore

### Backup Database
```bash
docker compose exec postgres pg_dump -U luxefinds_admin luxefinds > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker compose exec -T postgres psql -U luxefinds_admin luxefinds
```

## Troubleshooting

### Port Already in Use
If port 5432 is already in use, edit `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use port 5433 instead
```
Then update `.env`:
```
DATABASE_URL="postgresql://luxefinds_admin:luxefinds_secure_pass_2026@localhost:5433/luxefinds"
```

### Container Won't Start
```bash
# Check logs
docker compose logs postgres

# Remove and recreate
docker compose down
docker compose up -d
```

### Reset Database
```bash
# Stop and remove everything
docker compose down -v

# Start fresh
docker compose up -d

# Wait a few seconds, then recreate schema
npm run db:push
npm run db:seed
```

## Security Notes

**For Production:**
1. Change the password in `docker-compose.yml`
2. Update `DATABASE_URL` in `.env` accordingly
3. Never commit `.env` file with real credentials
4. Use environment variables or secrets management
5. Consider using SSL/TLS connections

## Resource Management

### View Container Resources
```bash
docker stats luxefinds-postgres
```

### Adjust Memory/CPU (in docker-compose.yml)
```yaml
services:
  postgres:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Integration with Prisma

The database is already configured and seeded. To reset:

```bash
# Clear all data and reseed
npm run db:seed

# Create new migration
npm run db:migrate

# View database in Prisma Studio
npm run db:studio
```
