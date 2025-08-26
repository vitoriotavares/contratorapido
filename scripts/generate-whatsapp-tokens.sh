#!/bin/bash

# WhatsApp Business API Token Generation Script
# Generates secure tokens for webhook verification and API security

set -e

echo "🔐 WhatsApp Business API Token Generator"
echo "========================================"

# Function to generate secure random token
generate_token() {
    openssl rand -hex 32
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run setup-environment.sh first."
    exit 1
fi

echo "🔑 Generating secure tokens for WhatsApp Business API..."

# Generate tokens
VERIFY_TOKEN=$(generate_token)
WEBHOOK_SECRET=$(generate_token)

echo ""
echo "✅ Tokens generated successfully!"
echo ""
echo "📋 Add these to your .env file:"
echo "WHATSAPP_VERIFY_TOKEN=${VERIFY_TOKEN}"
echo "WHATSAPP_WEBHOOK_SECRET=${WEBHOOK_SECRET}"
echo ""

# Ask if user wants to automatically update .env file
read -p "Do you want to automatically add these to .env file? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if tokens already exist in .env
    if grep -q "^WHATSAPP_VERIFY_TOKEN=" .env; then
        echo "⚠️  WHATSAPP_VERIFY_TOKEN already exists in .env file"
        read -p "Do you want to replace it? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sed -i.bak "s/^WHATSAPP_VERIFY_TOKEN=.*/WHATSAPP_VERIFY_TOKEN=${VERIFY_TOKEN}/" .env
            echo "✅ WHATSAPP_VERIFY_TOKEN updated"
        fi
    else
        echo "WHATSAPP_VERIFY_TOKEN=${VERIFY_TOKEN}" >> .env
        echo "✅ WHATSAPP_VERIFY_TOKEN added to .env"
    fi
    
    if grep -q "^WHATSAPP_WEBHOOK_SECRET=" .env; then
        echo "⚠️  WHATSAPP_WEBHOOK_SECRET already exists in .env file"
        read -p "Do you want to replace it? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sed -i.bak "s/^WHATSAPP_WEBHOOK_SECRET=.*/WHATSAPP_WEBHOOK_SECRET=${WEBHOOK_SECRET}/" .env
            echo "✅ WHATSAPP_WEBHOOK_SECRET updated"
        fi
    else
        echo "WHATSAPP_WEBHOOK_SECRET=${WEBHOOK_SECRET}" >> .env
        echo "✅ WHATSAPP_WEBHOOK_SECRET added to .env"
    fi
    
    # Add placeholder for other WhatsApp variables if they don't exist
    WHATSAPP_VARS=(
        "WHATSAPP_PHONE_NUMBER_ID="
        "WHATSAPP_ACCESS_TOKEN="
        "WHATSAPP_BUSINESS_ACCOUNT_ID="
    )
    
    for var in "${WHATSAPP_VARS[@]}"; do
        var_name=$(echo $var | cut -d'=' -f1)
        if ! grep -q "^${var_name}=" .env; then
            echo "$var" >> .env
            echo "📝 Added placeholder for $var_name"
        fi
    done
    
    echo ""
    echo "✅ .env file updated with WhatsApp configuration"
else
    echo "📝 Please manually add the tokens to your .env file"
fi

echo ""
echo "📚 Next steps:"
echo "1. Complete WhatsApp Business Account setup in Meta Business Manager"
echo "2. Get Phone Number ID, Access Token, and Business Account ID"
echo "3. Update the remaining WhatsApp variables in .env file"
echo "4. Follow the setup guide: docs/whatsapp-business-setup.md"
echo ""
echo "💡 Important:"
echo "- Keep these tokens secure and never commit them to version control"
echo "- Use the VERIFY_TOKEN when configuring webhook in Meta Business Manager"
echo "- Use the WEBHOOK_SECRET for signature verification in webhook handler"