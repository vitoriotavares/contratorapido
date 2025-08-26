#!/bin/bash

# WhatsApp Webhook Testing Script
# Tests webhook endpoints for proper verification and message handling

set -e

echo "🧪 WhatsApp Webhook Testing"
echo "============================"

# Check if .env file exists and load it
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run setup-environment.sh first."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check required variables
if [ -z "$WHATSAPP_VERIFY_TOKEN" ]; then
    echo "❌ WHATSAPP_VERIFY_TOKEN not set in .env file"
    echo "💡 Run: ./scripts/generate-whatsapp-tokens.sh"
    exit 1
fi

# Default webhook URL (update for your environment)
WEBHOOK_BASE_URL=${WEBHOOK_URL:-"http://localhost:5678"}
WEBHOOK_ENDPOINT="${WEBHOOK_BASE_URL}/webhook/whatsapp"

echo "🎯 Testing webhook endpoint: $WEBHOOK_ENDPOINT"
echo ""

# Test 1: Webhook Verification (GET request)
echo "🔍 Test 1: Webhook Verification"
echo "Simulating Meta's webhook verification..."

CHALLENGE="test_challenge_$(date +%s)"
VERIFY_TOKEN="$WHATSAPP_VERIFY_TOKEN"

echo "GET request to: ${WEBHOOK_ENDPOINT}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}"

# Note: This will fail until CR-005 (webhook handler) is implemented
response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  "${WEBHOOK_ENDPOINT}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}" \
  2>/dev/null || echo "HTTP_STATUS:000")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_status" = "200" ] && [ "$response_body" = "$CHALLENGE" ]; then
    echo "✅ Webhook verification successful"
    echo "   Response: $response_body"
else
    echo "❌ Webhook verification failed"
    echo "   HTTP Status: $http_status"
    echo "   Response: $response_body"
    echo "   Expected: $CHALLENGE"
    echo ""
    echo "💡 This is expected until CR-005 (webhook handler) is implemented"
fi

echo ""

# Test 2: Message Webhook (POST request)
echo "🔍 Test 2: Message Webhook"
echo "Simulating WhatsApp message delivery..."

test_message='{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "business_account_id",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "phone_number_id"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Test User"
                },
                "wa_id": "5511888888888"
              }
            ],
            "messages": [
              {
                "from": "5511888888888",
                "id": "message_id_123",
                "timestamp": "'$(date +%s)'",
                "text": {
                  "body": "Olá! Quero criar um contrato de aluguel."
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}'

echo "POST request to: $WEBHOOK_ENDPOINT"
echo "Payload: $test_message"

response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$test_message" \
  "$WEBHOOK_ENDPOINT" \
  2>/dev/null || echo "HTTP_STATUS:000")

http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_status" = "200" ]; then
    echo "✅ Message webhook successful"
    echo "   HTTP Status: $http_status"
    echo "   Response: $response_body"
else
    echo "❌ Message webhook failed"
    echo "   HTTP Status: $http_status" 
    echo "   Response: $response_body"
    echo ""
    echo "💡 This is expected until CR-005 (webhook handler) is implemented"
fi

echo ""

# Test 3: Service Health Check
echo "🔍 Test 3: Service Health Check"
echo "Checking if n8n is running and accessible..."

health_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  "${WEBHOOK_BASE_URL}/healthz" \
  2>/dev/null || echo "HTTP_STATUS:000")

health_status=$(echo "$health_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [ "$health_status" = "200" ]; then
    echo "✅ n8n service is healthy"
else
    echo "❌ n8n service is not accessible"
    echo "   HTTP Status: $health_status"
    echo "💡 Make sure n8n is running: docker-compose ps"
fi

echo ""

# Test 4: Environment Configuration Check
echo "🔍 Test 4: Environment Configuration"
echo "Checking WhatsApp configuration in .env..."

required_vars=(
    "WHATSAPP_VERIFY_TOKEN"
    "WHATSAPP_WEBHOOK_SECRET"
)

optional_vars=(
    "WHATSAPP_PHONE_NUMBER_ID"
    "WHATSAPP_ACCESS_TOKEN"
    "WHATSAPP_BUSINESS_ACCOUNT_ID"
)

all_required_set=true

for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ] && [ "${!var}" != "" ]; then
        echo "✅ $var: configured"
    else
        echo "❌ $var: not set"
        all_required_set=false
    fi
done

for var in "${optional_vars[@]}"; do
    if [ -n "${!var}" ] && [ "${!var}" != "" ]; then
        echo "✅ $var: configured"
    else
        echo "⚠️  $var: not set (will be needed for production)"
    fi
done

echo ""

# Summary
echo "📋 Test Summary"
echo "==============="

if [ "$all_required_set" = true ]; then
    echo "✅ Environment configuration: Ready"
else
    echo "❌ Environment configuration: Missing required variables"
fi

echo ""
echo "📚 Next Steps:"
echo "1. Complete WhatsApp Business Account setup in Meta Business Manager"
echo "2. Implement webhook handler workflow in CR-005"
echo "3. Update .env with production WhatsApp credentials"
echo "4. Configure webhook URL in Meta Business Manager"
echo ""
echo "📖 For detailed setup instructions, see: docs/whatsapp-business-setup.md"