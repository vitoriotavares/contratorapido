#!/bin/bash

# ContratoRápido - Local Development Startup Script
# Starts all services for local testing

set -e

echo "🚀 Starting ContratoRápido Local Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install docker-compose first.${NC}"
    exit 1
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.local.yml down

# Clean up old volumes if requested
if [[ "$1" == "--clean" ]]; then
    echo -e "${YELLOW}🧹 Cleaning up old volumes...${NC}"
    docker volume prune -f
    docker-compose -f docker-compose.local.yml down -v
fi

# Start services
echo -e "${BLUE}🐳 Starting Docker services...${NC}"
docker-compose -f docker-compose.local.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"

# Function to check service health
check_service() {
    local service_name=$1
    local port=$2
    local path=${3:-""}
    local max_attempts=30
    local attempt=0

    echo -n "Checking $service_name"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$port$path" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    echo -e " ${RED}✗ (timeout)${NC}"
    return 1
}

# Check MongoDB
echo -n "Checking MongoDB"
attempt=0
while [ $attempt -lt 30 ]; do
    if docker-compose -f docker-compose.local.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
    ((attempt++))
done

# Check Redis
echo -n "Checking Redis"
attempt=0
while [ $attempt -lt 30 ]; do
    if docker-compose -f docker-compose.local.yml exec -T redis redis-cli -a redis123 ping > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 2
    ((attempt++))
done

# Check other services
check_service "n8n" "5678" "/healthz" || echo -e "${YELLOW}n8n may still be starting...${NC}"
check_service "Gotenberg" "3000" "/health" || echo -e "${YELLOW}Gotenberg may still be starting...${NC}"
check_service "Mongo Express" "8081" "/" || echo -e "${YELLOW}Mongo Express may still be starting...${NC}"
check_service "Redis Commander" "8082" "/" || echo -e "${YELLOW}Redis Commander may still be starting...${NC}"

echo ""
echo -e "${GREEN}🎉 Services started successfully!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 Service URLs:${NC}"
echo "• n8n Workflow Editor:    http://localhost:5678"
echo "• MongoDB Admin:          http://localhost:8081 (admin/admin123)"
echo "• Redis Admin:            http://localhost:8082 (admin/admin123)"
echo "• Gotenberg PDF Service:  http://localhost:3000"
echo ""
echo -e "${BLUE}🔌 Database Connections:${NC}"
echo "• PostgreSQL:  localhost:5432 (postgres/postgres123)"
echo "• MongoDB:     localhost:27017 (contratorapido/mongo123)"
echo "• Redis:       localhost:6379 (password: redis123)"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Open n8n at http://localhost:5678"
echo "2. Import the WhatsApp Handler workflow from:"
echo "   workflows/whatsapp-handler.json"
echo "3. Configure MongoDB connection in n8n nodes:"
echo "   - Host: mongodb"
echo "   - Port: 27017"
echo "   - Database: contratorapido"
echo "   - Username: contratorapido"
echo "   - Password: mongo123"
echo ""
echo -e "${GREEN}✨ Ready for development!${NC}"
echo ""
echo "To stop all services:"
echo "  docker-compose -f docker-compose.local.yml down"
echo ""
echo "To clean up and restart:"
echo "  ./scripts/start-local-dev.sh --clean"