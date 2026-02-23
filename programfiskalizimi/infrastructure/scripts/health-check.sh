#!/bin/bash
#
# FiscalNext Health Check Script
# Created by: Max (DevOps Engineer)
# Date: 2026-02-23
#
# Usage: ./health-check.sh [staging|production]
#

ENV=${1:-staging}
COMPOSE_FILE="infrastructure/docker/docker-compose.${ENV}.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "======================================"
echo "FiscalNext Health Check - ${ENV}"
echo "======================================"
echo ""

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}Error: $COMPOSE_FILE not found${NC}"
    exit 1
fi

# Function to check service health
check_service() {
    local service=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    if docker compose -f $COMPOSE_FILE ps $service | grep -q "Up"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Down${NC}"
        return 1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name ($url)... "
    
    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Container Health Checks
echo "=== Container Status ==="
check_service postgres "PostgreSQL"
check_service redis "Redis"
check_service rabbitmq "RabbitMQ"
check_service api "API Server"
check_service web-admin "Web Admin"
check_service web-pos "Web POS"
check_service nginx "Nginx"
echo ""

# Endpoint Health Checks
echo "=== Endpoint Checks ==="
if [ "$ENV" = "production" ]; then
    check_endpoint "https://fiscalnext.com/api/health" "API Health"
    check_endpoint "https://admin.fiscalnext.com" "Admin Panel"
    check_endpoint "https://pos.fiscalnext.com" "POS System"
else
    check_endpoint "https://staging.fiscalnext.com/api/health" "API Health"
    check_endpoint "https://admin.staging.fiscalnext.com" "Admin Panel"
    check_endpoint "https://pos.staging.fiscalnext.com" "POS System"
fi
echo ""

# Database Check
echo "=== Database Checks ==="
echo -n "Database connections... "
DB_CONNECTIONS=$(docker compose -f $COMPOSE_FILE exec -T postgres \
    psql -U admin -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
echo -e "${GREEN}$DB_CONNECTIONS active${NC}"

echo -n "Database size... "
DB_SIZE=$(docker compose -f $COMPOSE_FILE exec -T postgres \
    psql -U admin -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | xargs)
echo -e "${GREEN}$DB_SIZE${NC}"
echo ""

# Redis Check
echo "=== Redis Checks ==="
echo -n "Redis memory usage... "
REDIS_MEMORY=$(docker compose -f $COMPOSE_FILE exec -T redis \
    redis-cli INFO memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r' 2>/dev/null)
echo -e "${GREEN}$REDIS_MEMORY${NC}"

echo -n "Redis keys... "
REDIS_KEYS=$(docker compose -f $COMPOSE_FILE exec -T redis \
    redis-cli DBSIZE | cut -d: -f2 | tr -d '\r' 2>/dev/null)
echo -e "${GREEN}$REDIS_KEYS keys${NC}"
echo ""

# Docker Stats
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | \
    grep fiscalnext

echo ""
echo "=== Disk Usage ==="
df -h | grep -E "Filesystem|/dev/|overlay"

echo ""
echo "======================================"
echo "Health check complete"
echo "======================================"
