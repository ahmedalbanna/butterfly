#!/bin/bash

# LuxeFinds Docker Health Check Script
# Verifies that all running services are healthy
#
# Usage:
#   ./scripts/health-check.sh          # Check all services
#   ./scripts/health-check.sh --watch  # Watch health status continuously

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m'

WATCH_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --watch)
      WATCH_MODE=true
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_help
      exit 1
      ;;
  esac
done

print_help() {
  cat << EOF
${BLUE}LuxeFinds Docker Health Check${NC}

Usage: ./scripts/health-check.sh [OPTIONS]

Options:
  --watch     Watch health status continuously
  -h, --help  Show this help message

Examples:
  ./scripts/health-check.sh          # Check once
  ./scripts/health-check.sh --watch  # Watch continuously

EOF
}

check_service() {
  local service=$1
  local port=$2
  local type=$3  # tcp, redis, postgres, http
  
  case $type in
    tcp)
      if timeout 2 bash -c "cat < /dev/null > /dev/tcp/localhost/$port" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $service"
        return 0
      else
        echo -e "${RED}✗${NC} $service (port $port unreachable)"
        return 1
      fi
      ;;
    redis)
      if redis-cli -p $port ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service"
        return 0
      else
        echo -e "${RED}✗${NC} $service (redis-cli failed)"
        return 1
      fi
      ;;
    postgres)
      if PGPASSWORD="luxefinds_secure_pass_2026" pg_isready -h localhost -p $port -U luxefinds_admin -d luxefinds > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service"
        return 0
      else
        echo -e "${RED}✗${NC} $service (psql check failed)"
        return 1
      fi
      ;;
    http)
      if curl -s http://localhost:$port/ > /dev/null; then
        echo -e "${GREEN}✓${NC} $service"
        return 0
      else
        echo -e "${RED}✗${NC} $service (HTTP request failed)"
        return 1
      fi
      ;;
  esac
}

run_health_checks() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}LuxeFinds Docker Health Check${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  # Get list of running containers
  POSTGRES=$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-postgres$' || true)
  REDIS=$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-redis$' || true)
  OLLAMA=$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-ollama$' || true)
  PROMETHEUS=$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-prometheus$' || true)
  GRAFANA=$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-grafana$' || true)
  ALERTMANAGER=$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-alertmanager$' || true)
  REDIS_MASTER=$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-redis-master$' || true)
  SENTINEL_1=$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-sentinel-1$' || true)
  
  # Counters
  HEALTHY=0
  UNHEALTHY=0
  
  echo -e "${YELLOW}Core Services:${NC}"
  if [ -n "$POSTGRES" ]; then
    check_service "PostgreSQL" 5432 postgres && ((HEALTHY++)) || ((UNHEALTHY++))
  else
    echo -e "${GRAY}⊘${NC} PostgreSQL (not running)"
  fi
  
  if [ -n "$REDIS" ]; then
    check_service "Redis" 6379 redis && ((HEALTHY++)) || ((UNHEALTHY++))
  else
    echo -e "${GRAY}⊘${NC} Redis (not running)"
  fi
  
  if [ -n "$OLLAMA" ]; then
    echo -e "${YELLOW}AI Services:${NC}"
    check_service "Ollama" 11434 http && ((HEALTHY++)) || ((UNHEALTHY++))
  fi
  
  if [ -n "$PROMETHEUS" ] || [ -n "$GRAFANA" ] || [ -n "$ALERTMANAGER" ]; then
    echo -e "${YELLOW}Monitoring Services:${NC}"
    [ -n "$PROMETHEUS" ] && check_service "Prometheus" 9090 http && ((HEALTHY++)) || ((UNHEALTHY++))
    [ -n "$GRAFANA" ] && check_service "Grafana" 3000 http && ((HEALTHY++)) || ((UNHEALTHY++))
    [ -n "$ALERTMANAGER" ] && check_service "AlertManager" 9093 http && ((HEALTHY++)) || ((UNHEALTHY++))
  fi
  
  if [ -n "$REDIS_MASTER" ] || [ -n "$SENTINEL_1" ]; then
    echo -e "${YELLOW}HA Services:${NC}"
    [ -n "$REDIS_MASTER" ] && check_service "Redis Master" 6379 redis && ((HEALTHY++)) || ((UNHEALTHY++))
    [ -n "$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-redis-replica-1$' || true)" ] && check_service "Redis Replica 1" 6380 redis && ((HEALTHY++)) || ((UNHEALTHY++))
    [ -n "$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-redis-replica-2$' || true)" ] && check_service "Redis Replica 2" 6381 redis && ((HEALTHY++)) || ((UNHEALTHY++))
    [ -n "$SENTINEL_1" ] && check_service "Sentinel 1" 26379 redis && ((HEALTHY++)) || ((UNHEALTHY++))
    [ -n "$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-sentinel-2$' || true)" ] && check_service "Sentinel 2" 26380 redis && ((HEALTHY++)) || ((UNHEALTHY++))
    [ -n "$(docker ps --format '{{.Names}}' | grep -E '^luxefinds-sentinel-3$' || true)" ] && check_service "Sentinel 3" 26381 redis && ((HEALTHY++)) || ((UNHEALTHY++))
  fi
  
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  
  if [ $UNHEALTHY -eq 0 ]; then
    echo -e "${GREEN}✓ All services are healthy ($HEALTHY healthy)${NC}"
  else
    echo -e "${RED}✗ Some services are unhealthy ($HEALTHY healthy, $UNHEALTHY unhealthy)${NC}"
  fi
  
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  return $UNHEALTHY
}

if [ "$WATCH_MODE" = true ]; then
  while true; do
    clear
    run_health_checks
    sleep 5
  done
else
  run_health_checks
  exit $?
fi
