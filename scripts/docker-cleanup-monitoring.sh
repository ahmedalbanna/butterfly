#!/bin/bash

# 🐳 Docker Monitoring Stack Cleanup & Setup Script
# Properly handles orphaned containers and starts fresh monitoring stack

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════${NC}"
echo -e "${CYAN}🐳 Docker Monitoring Stack Cleanup${NC}"
echo -e "${CYAN}═══════════════════════════════════${NC}\n"

# Step 1: Stop monitoring services
echo -e "${YELLOW}Step 1: Stopping monitoring services...${NC}"
docker compose -f docker-compose.monitoring.yml down 2>/dev/null || true
sleep 2

# Step 2: Remove orphaned containers
echo -e "${YELLOW}Step 2: Removing orphaned containers...${NC}"
ORPHANS=$(docker ps -a --format '{{.Names}}' | grep -E "luxefinds-redis|luxefinds-postgres|luxefinds-sentinel" || true)

if [ -n "$ORPHANS" ]; then
    echo "Found orphaned containers:"
    echo "$ORPHANS"
    echo -e "${YELLOW}Removing...${NC}"
    echo "$ORPHANS" | xargs -r docker rm -f 2>/dev/null || true
    sleep 2
else
    echo -e "${GREEN}✓ No orphaned containers found${NC}"
fi

# Step 3: Clean up stuck containers
echo -e "${YELLOW}Step 3: Cleaning up any stuck monitoring containers...${NC}"
docker ps -a --format '{{.Names}}' | grep -E "butterfly-prometheus|butterfly-grafana|butterfly-alertmanager|butterfly-redis-exporter|butterfly-postgres-exporter" | xargs -r docker rm -f 2>/dev/null || true
sleep 2

# Step 4: Prune unused resources
echo -e "${YELLOW}Step 4: Pruning unused Docker resources...${NC}"
docker system prune -f --volumes 2>/dev/null || true

# Step 5: Start fresh monitoring stack
echo -e "${YELLOW}Step 5: Starting fresh monitoring stack...${NC}"
docker compose -f docker-compose.monitoring.yml up -d

sleep 5

# Step 6: Verify services
echo -e "${YELLOW}Step 6: Verifying services...${NC}"
docker compose -f docker-compose.monitoring.yml ps

echo -e "\n${GREEN}═══════════════════════════════════${NC}"
echo -e "${GREEN}✓ Monitoring stack setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════${NC}\n"

echo -e "${CYAN}Services available at:${NC}"
echo -e "  ${GREEN}Prometheus:${NC}    http://localhost:9092"
echo -e "  ${GREEN}Grafana:${NC}       http://localhost:3001 (admin/admin123)"
echo -e "  ${GREEN}AlertManager:${NC}  http://localhost:9093"
echo -e "  ${GREEN}Redis Exporter:${NC} http://localhost:9121"
echo -e "  ${GREEN}PG Exporter:${NC}   http://localhost:9187\n"
