#!/bin/bash

# Database Setup Script
# Initializes MongoDB with legal template database structure

set -e

echo "🗄️  Database Setup for ContratoRápido"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run setup-environment.sh first."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check if MongoDB connection string is set
if [ -z "$MONGO_ROOT_PASSWORD" ]; then
    echo "❌ MONGO_ROOT_PASSWORD not set in .env file"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

npm install

echo "✅ Dependencies installed"

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."

DB_CONNECTION_URL="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@localhost:27017/criador_contrato?replicaSet=rs0&authSource=admin"

# Test MongoDB connection with timeout
timeout 10s node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient('$DB_CONNECTION_URL');
client.connect()
  .then(() => {
    console.log('✅ MongoDB connection successful');
    return client.close();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
" || {
    echo "❌ Cannot connect to MongoDB. Make sure MongoDB is running:"
    echo "   docker-compose ps"
    echo "   docker-compose up -d"
    exit 1
}

# Initialize database
echo "🚀 Initializing database..."

export DB_MONGODB_CONNECTION_URL="$DB_CONNECTION_URL"

node database/init-database.js

if [ $? -eq 0 ]; then
    echo "✅ Database initialization completed successfully"
else
    echo "❌ Database initialization failed"
    exit 1
fi

# Run database tests
echo "🧪 Running database tests..."

node database/test-database.js

if [ $? -eq 0 ]; then
    echo "✅ Database tests passed"
else
    echo "⚠️  Some database tests failed, but setup may still be functional"
fi

# Create backup directory
echo "📂 Setting up backup directory..."
mkdir -p backups/database
mkdir -p backups/generated-contracts

echo "✅ Backup directories created"

# Show final status
echo ""
echo "📊 Database Setup Summary"
echo "========================="

# Count documents in each collection
echo "Checking collection contents..."

node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient('$DB_CONNECTION_URL');

async function showStats() {
  await client.connect();
  const db = client.db('criador_contrato');
  
  const collections = ['templates', 'conversations', 'audit_trail', 'system_config'];
  
  for (const collName of collections) {
    try {
      const count = await db.collection(collName).countDocuments();
      console.log(\`✅ \${collName}: \${count} documents\`);
    } catch (err) {
      console.log(\`❌ \${collName}: Error - \${err.message}\`);
    }
  }
  
  await client.close();
}

showStats().catch(console.error);
"

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify database is working: npm run test-db"
echo "2. Continue with CR-005: WhatsApp Message Handler Workflow"
echo "3. Test complete system with: ./scripts/test-whatsapp-webhook.sh"
echo ""
echo "Database connection string (for n8n):"
echo "mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/criador_contrato?replicaSet=rs0&authSource=admin"
echo ""
echo "Useful commands:"
echo "  npm run init-db      # Reinitialize database"
echo "  npm run test-db      # Run database tests"
echo "  npm run backup-db    # Backup database (when implemented)"