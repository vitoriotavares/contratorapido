#!/bin/bash

# Start PDF Generation Services
# Starts Gotenberg and LibreOffice services for PDF generation

set -e

echo "🚀 Starting PDF Generation Services"
echo "==================================="

# Check if main network exists
echo "🔍 Checking Docker network..."

if ! docker network ls | grep -q criador_contrato_network; then
    echo "📡 Creating Docker network..."
    docker network create criador_contrato_network
    echo "✅ Network created: criador_contrato_network"
else
    echo "✅ Network exists: criador_contrato_network"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p pdf-templates test-output

echo "✅ Directories ready"

# Start PDF services
echo "🐳 Starting PDF generation services..."

# Start services in background
docker-compose -f docker-compose.gotenberg.yml up -d

echo "⏳ Waiting for services to start..."

# Wait for services to be healthy
max_attempts=10
attempt=0

while [ $attempt -lt $max_attempts ]; do
    gotenberg_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
    libreoffice_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")
    
    if [ "$gotenberg_status" = "200" ] && [ "$libreoffice_status" = "200" ]; then
        echo "✅ Both services are healthy!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts - Gotenberg: $gotenberg_status, LibreOffice: $libreoffice_status"
    sleep 3
done

if [ $attempt -eq $max_attempts ]; then
    echo "⚠️  Services may still be starting. Check status manually."
fi

# Show status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.gotenberg.yml ps

echo ""
echo "🎯 Service Endpoints:"
echo "• Gotenberg (PDF): http://localhost:3000"
echo "• LibreOffice (Docs): http://localhost:3001"

echo ""
echo "🧪 Test PDF generation:"
echo "  ./scripts/test-pdf-generation.sh"

echo ""
echo "🛑 Stop services:"
echo "  docker-compose -f docker-compose.gotenberg.yml down"

echo ""
echo "✅ PDF services ready!"