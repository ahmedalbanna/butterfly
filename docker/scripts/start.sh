#!/bin/bash

# LuxeFinds Docker Startup Script
# Smart script to start services with selected profiles
#
# Usage:
#   ./scripts/start.sh                    # Core services only
#   ./scripts/start.sh --profile ai       # With AI
#   ./scripts/start.sh --profile monitoring  # With monitoring
#   ./scripts/start.sh --profile ha       # With high availability
#   ./scripts/start.sh --profile ai --profile monitoring # Multiple profiles
#   ./scripts/start.sh --all              # All profiles

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$DOCKER_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default compose file
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
COMPOSE_CMD="docker compose -f $COMPOSE_FILE"

# Initialize profiles array
PROFILES=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --profile)
      if [ -n "$2" ] && [ "$2" != "--"* ]; then
        PROFILES+=("$2")
        shift 2
      else
        echo -e "${RED}Error: --profile requires a value${NC}"
        exit 1
      fi
      ;;
    --all)
      PROFILES=("ai" "monitoring" "ha" "development")
      shift
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_help
      exit 1
      ;;
  esac
done

print_help() {
  cat << EOF
${BLUE}LuxeFinds Docker Startup Script${NC}

Usage: ./scripts/start.sh [OPTIONS]

Options:
  --profile PROFILE     Add a profile (can be used multiple times)
                        Available: ai, monitoring, ha, development
  --all                 Enable all profiles
  -h, --help           Show this help message

Examples:
  ./scripts/start.sh                              # Core services only
  ./scripts/start.sh --profile ai                 # With AI
  ./scripts/start.sh --profile monitoring         # With monitoring
  ./scripts/start.sh --profile ai --profile monitoring
  ./scripts/start.sh --all                        # All services

Profiles:
  core (default)    - PostgreSQL + Redis
  ai                - Ollama AI services
  monitoring        - Prometheus, Grafana, AlertManager
  ha                - Redis Sentinel, replicas, Postgres replicas
  development       - Development-specific configs

EOF
}

# Build compose command with profiles
for profile in "${PROFILES[@]}"; do
  COMPOSE_CMD="$COMPOSE_CMD --profile $profile"
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}LuxeFinds Docker Services Startup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Show configuration
echo -e "${YELLOW}Configuration:${NC}"
echo "  Compose file: $COMPOSE_FILE"
if [ ${#PROFILES[@]} -eq 0 ]; then
  echo "  Profiles: core (default)"
else
  echo "  Profiles: core, ${PROFILES[*]}"
fi
echo ""

# Show services that will be started
echo -e "${YELLOW}Services to start:${NC}"
echo "  ✓ PostgreSQL (port 5432)"
echo "  ✓ Redis (port 6379)"

if [[ " ${PROFILES[@]} " =~ " ai " ]]; then
  echo "  ✓ Ollama (port 11434)"
fi

if [[ " ${PROFILES[@]} " =~ " monitoring " ]]; then
  echo "  ✓ Prometheus (port 9090)"
  echo "  ✓ Grafana (port 3000)"
  echo "  ✓ AlertManager (port 9093)"
fi

if [[ " ${PROFILES[@]} " =~ " ha " ]]; then
  echo "  ✓ Redis Master (port 6379)"
  echo "  ✓ Redis Replica 1 (port 6380)"
  echo "  ✓ Redis Replica 2 (port 6381)"
  echo "  ✓ Redis Sentinel 1 (port 26379)"
  echo "  ✓ Redis Sentinel 2 (port 26380)"
  echo "  ✓ Redis Sentinel 3 (port 26381)"
fi

echo ""
echo -e "${YELLOW}Starting services...${NC}"
echo ""

# Start services
if $COMPOSE_CMD up -d; then
  echo ""
  echo -e "${GREEN}✓ Services started successfully!${NC}"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Check status: $COMPOSE_CMD ps"
  echo "  2. View logs: $COMPOSE_CMD logs -f"
  echo "  3. Health check: ./scripts/health-check.sh"
  echo ""
  echo -e "${YELLOW}Service URLs:${NC}"
  echo "  PostgreSQL: localhost:5432"
  echo "  Redis: localhost:6379"
  
  if [[ " ${PROFILES[@]} " =~ " ai " ]]; then
    echo "  Ollama: http://localhost:11434"
  fi
  
  if [[ " ${PROFILES[@]} " =~ " monitoring " ]]; then
    echo "  Prometheus: http://localhost:9090"
    echo "  Grafana: http://localhost:3000"
    echo "  AlertManager: http://localhost:9093"
  fi
  
  echo ""
else
  echo -e "${RED}✗ Failed to start services${NC}"
  exit 1
fi
