# ContratoRápido - WhatsApp Contract Generator

A WhatsApp-first SaaS for rapid Brazilian rental contract generation using n8n workflow automation.

## Quick Start

1. **Setup Environment**
   ```bash
   ./setup-environment.sh
   ```

2. **Access n8n**
   - Open http://localhost:5678
   - Login with credentials from `.env` file

3. **Test Queue Mode**
   - Import the test workflow from `n8n/workflows/test-queue-mode.json`
   - Execute to verify queue processing

## Architecture

- **n8n**: Main workflow engine in queue mode
- **Redis**: Message queue and caching
- **MongoDB**: Primary database with replica set
- **3 Workers**: Parallel processing for scalability

## Services

| Service | Port | Description |
|---------|------|-------------|
| n8n | 5678 | Main interface and workflow engine |
| MongoDB | 27017 | Primary database |
| Redis | 6379 | Message queue and cache |
| Gotenberg | 3000 | PDF generation service |
| LibreOffice | 3001 | Document conversion service |

## Sprint 1 Status

- ✅ **CR-001**: n8n Queue Mode Infrastructure
- ✅ **CR-002**: WhatsApp Business API Registration
- ✅ **CR-003**: Docker Services Setup
- ✅ **CR-004**: Legal Template Database Setup

## Commands

```bash
# Start main services (n8n, MongoDB, Redis)
docker-compose up -d

# Start PDF services (Gotenberg, LibreOffice)
./scripts/start-pdf-services.sh

# Initialize database with legal templates
./scripts/setup-database.sh

# Check all services
docker-compose ps
docker-compose -f docker-compose.gotenberg.yml ps

# Test services
./scripts/test-pdf-generation.sh
npm run test-db

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
docker-compose -f docker-compose.gotenberg.yml down
```