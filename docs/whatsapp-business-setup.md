# WhatsApp Business API Setup Guide (CR-002)

## Overview
This guide walks through setting up WhatsApp Business API for ContratoRápido, following Brazilian market requirements and compliance standards.

## Prerequisites
- Valid business documentation (CNPJ)
- Business website with privacy policy
- Business phone number (not previously used with WhatsApp)
- Facebook Business Manager account

## Step 1: Meta Business Account Setup

### 1.1 Create Meta Business Account
1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create Account"
3. Enter business name: "ContratoRápido" or your registered business name
4. Provide business email and contact information
5. Complete business verification with CNPJ documentation

### 1.2 Business Verification Requirements (Brazil)
- **CNPJ**: Valid business registration number
- **Business Address**: Physical address matching CNPJ registration
- **Business Website**: Must include privacy policy in Portuguese
- **Business Phone**: Landline or business mobile (not personal WhatsApp number)

## Step 2: WhatsApp Business API Application

### 2.1 Apply for WhatsApp Business API
1. In Meta Business Manager, go to "WhatsApp Manager"
2. Click "Get Started" 
3. Select "WhatsApp Business API"
4. Choose account type: "Business" (for commercial use)

### 2.2 Phone Number Registration
1. **Important**: Use a phone number NOT currently registered with WhatsApp
2. Choose Brazilian phone number (+55)
3. Verify phone number via SMS
4. Complete two-factor authentication setup

### 2.3 Business Profile Setup
```json
{
  "business_name": "ContratoRápido",
  "category": "Business Service",
  "description": "Geração rápida de contratos de aluguel via WhatsApp",
  "website": "https://your-domain.com",
  "address": {
    "street": "Your business address",
    "city": "Your city", 
    "state": "Your state",
    "country": "BR",
    "postal_code": "Your CEP"
  }
}
```

## Step 3: App Configuration

### 3.1 Create WhatsApp Business App
1. In Meta Business Manager, go to "Apps"
2. Click "Create App" → "Business"
3. App name: "ContratoRápido WhatsApp Bot"
4. Add WhatsApp Business API product

### 3.2 Configure Webhook
```bash
# Webhook URL (update with your domain)
WEBHOOK_URL=https://your-domain.com/webhook/whatsapp

# Verify Token (generate secure random string)
VERIFY_TOKEN=$(openssl rand -hex 32)
```

### 3.3 Required Permissions
Request these permissions during app review:
- `whatsapp_business_messaging` - Send and receive messages
- `whatsapp_business_management` - Manage business account

## Step 4: Environment Configuration

### 4.1 Update .env File
Add these variables to your `.env` file:

```bash
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Webhook Configuration
WEBHOOK_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN}
WEBHOOK_URL=https://your-domain.com/webhook/whatsapp
```

### 4.2 Security Configuration
```bash
# Generate secure tokens
WHATSAPP_VERIFY_TOKEN=$(openssl rand -hex 32)
WHATSAPP_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Add to .env
echo "WHATSAPP_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN}" >> .env
echo "WHATSAPP_WEBHOOK_SECRET=${WHATSAPP_WEBHOOK_SECRET}" >> .env
```

## Step 5: Webhook Setup (n8n Integration)

### 5.1 Create Webhook Workflow
This will be implemented in CR-005, but prepare the webhook endpoint:

```json
{
  "webhook_endpoint": "/webhook/whatsapp",
  "methods": ["GET", "POST"],
  "verification": true,
  "security": {
    "verify_token": true,
    "signature_verification": true
  }
}
```

### 5.2 Webhook Verification Process
1. Meta will send GET request to verify webhook
2. n8n must respond with challenge parameter
3. POST requests will contain actual message data

## Step 6: Message Templates

### 6.1 Create Welcome Template
Brazilian Portuguese template for user onboarding:

```json
{
  "name": "welcome_message",
  "language": "pt_BR",
  "category": "UTILITY",
  "components": [
    {
      "type": "BODY",
      "text": "Olá! 👋 Bem-vindo ao ContratoRápido!\n\nEu sou seu assistente para criar contratos de aluguel de forma rápida e segura.\n\nPara começar, me conte sobre o imóvel que você quer alugar:"
    }
  ]
}
```

### 6.2 Create Contract Ready Template
```json
{
  "name": "contract_ready",
  "language": "pt_BR", 
  "category": "UTILITY",
  "components": [
    {
      "type": "BODY",
      "text": "✅ Seu contrato está pronto!\n\nRevisão:\n• Tipo: {{1}}\n• Valor: R$ {{2}}\n• Vigência: {{3}}\n\nO documento em PDF será enviado em alguns segundos."
    }
  ]
}
```

## Step 7: Compliance & LGPD

### 7.1 Privacy Policy Requirements
Your website must include:
- Data collection practices
- Purpose of data processing  
- User rights under LGPD
- Contact information for data protection officer
- Retention policies

### 7.2 Consent Management
```javascript
// Implement consent tracking
const consentData = {
  user_phone: "+5511999999999",
  consent_given: true,
  consent_timestamp: new Date().toISOString(),
  purposes: ["contract_generation", "communication"],
  retention_period: "5_years"
};
```

## Step 8: Rate Limits & Quotas

### 8.1 Brazilian Market Limits
- **Messaging Limit**: 1,000 messages per day (initial)
- **Request Rate**: 80 requests per second
- **Upgrade Path**: Verified businesses can request higher limits

### 8.2 Monitoring Setup
```bash
# Add rate limiting monitoring
WHATSAPP_DAILY_MESSAGE_LIMIT=1000
WHATSAPP_RATE_LIMIT_PER_SECOND=80
```

## Step 9: Testing Configuration

### 9.1 Test Phone Numbers
Add test numbers in Meta Business Manager:
1. Go to WhatsApp Manager → Phone Numbers
2. Add test phone numbers
3. These can receive messages without consuming quota

### 9.2 Sandbox Testing
```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "test",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "messages": [{
            "from": "5511999999999",
            "text": { "body": "test message" }
          }]
        }
      }]
    }]
  }'
```

## Step 10: Go-Live Checklist

### 10.1 Pre-Launch Verification
- [ ] Business verification completed
- [ ] Phone number verified and activated
- [ ] Message templates approved
- [ ] Webhook endpoint configured and tested
- [ ] Privacy policy published
- [ ] LGPD compliance documented
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up

### 10.2 Production Deployment
1. Update webhook URL to production domain
2. Configure SSL certificates
3. Test message sending and receiving
4. Verify template message delivery
5. Monitor rate limits and quotas

## Expected Timeline
- **Business Verification**: 3-7 business days
- **App Review**: 5-10 business days  
- **Template Approval**: 1-3 business days
- **Total**: 7-14 business days

## Common Issues & Solutions

### Issue: Business Verification Rejected
**Solution**: Ensure CNPJ documentation is clear and business website has complete privacy policy in Portuguese.

### Issue: Phone Number Already Used
**Solution**: Use a different phone number or contact WhatsApp support to release the number.

### Issue: Webhook Verification Failed
**Solution**: Ensure webhook responds with exact challenge parameter sent by Meta.

### Issue: Message Templates Rejected
**Solution**: Avoid promotional language, use clear business communication, ensure Portuguese grammar is correct.

## Next Steps
After completing WhatsApp Business API setup:
1. Proceed to CR-003: Docker Services Setup
2. Configure Gotenberg for PDF generation
3. Implement webhook handler in CR-005

## Support Resources
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Brazilian Business Verification Guide](https://www.facebook.com/business/help/1095661473946872)
- [LGPD Compliance Checklist](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)