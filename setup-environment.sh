#!/bin/bash

# ContratoRápido Environment Setup Script
# This script helps set up the environment variables and initialize the system

set -e

echo "🚀 ContratoRápido Environment Setup"
echo "===================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    echo "⚠️  IMPORTANT: Please update the following values in .env file:"
    echo "   - REDIS_PASSWORD: Use a strong password"
    echo "   - MONGO_ROOT_PASSWORD: Use a strong password"
    echo "   - N8N_BASIC_AUTH_PASSWORD: Use a strong password"
    echo "   - N8N_ENCRYPTION_KEY: Generate a 32-character encryption key"
    echo ""
    echo "💡 You can generate a secure encryption key with:"
    echo "   openssl rand -hex 16"
    echo ""
    read -p "Press Enter after updating .env file..."
else
    echo "✅ .env file already exists"
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

if ! grep -q "^REDIS_PASSWORD=.\+" .env; then
    echo "❌ REDIS_PASSWORD is not set in .env"
    exit 1
fi

if ! grep -q "^MONGO_ROOT_PASSWORD=.\+" .env; then
    echo "❌ MONGO_ROOT_PASSWORD is not set in .env"
    exit 1
fi

if ! grep -q "^N8N_ENCRYPTION_KEY=.\+" .env; then
    echo "❌ N8N_ENCRYPTION_KEY is not set in .env"
    exit 1
fi

echo "✅ Environment variables configured"

# Check Docker and Docker Compose
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Start services
echo "🔧 Starting n8n Queue Mode infrastructure..."
echo "This will start: Redis, MongoDB (with replica set), n8n main process, and 3 workers"

docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."

# Wait for services to be ready
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose ps | grep -q "Up (healthy)" && [ $(docker-compose ps | grep -c "Up (healthy)") -ge 3 ]; then
        echo "✅ Services are healthy!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts - Waiting for services..."
    sleep 10
done

if [ $attempt -eq $max_attempts ]; then
    echo "⚠️  Services may still be starting. Check status with: docker-compose ps"
fi

# Show status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Access n8n at: http://localhost:5678"
echo "2. Login with credentials from .env file"
echo "3. Import and test the queue mode workflow"
echo ""
echo "Useful commands:"
echo "  docker-compose ps          # Check service status"
echo "  docker-compose logs n8n    # View n8n logs"
echo "  docker-compose logs -f     # Follow all logs"
echo "  docker-compose down        # Stop all services"