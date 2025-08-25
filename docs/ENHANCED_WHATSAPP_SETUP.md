# Enhanced WhatsApp Bulk Messaging Setup Guide

## 🚀 Overview

This guide will help you set up the enhanced WhatsApp bulk messaging system with AI-powered features, compliance guardrails, and Green API integration.

## ✅ Features Included

### 🤖 AI-Powered Features
- **Campaign Composer**: AI analyzes messages for spam, compliance, and optimization
- **Personalization**: Smart message personalization with customer data
- **FAQ Responses**: AI-powered automatic responses to common questions
- **Language Detection**: Automatic Swahili/English language preference detection

### 🛡️ Compliance & Guardrails
- **Spam Detection**: Automatic spam score calculation and risk assessment
- **Opt-out Management**: Automatic opt-out handling with confirmation
- **Rate Limiting**: Configurable rate limits with random jitter
- **Cooldown Periods**: Prevents over-messaging with configurable cooldowns

### 📱 WhatsApp Integration
- **Green API Integration**: Safe integration with Green API
- **Throttled Sending**: Intelligent message throttling to avoid rate limits
- **Webhook Handling**: Automatic reply processing and escalation
- **Status Tracking**: Real-time message delivery and read status

### 📊 Analytics & Management
- **Campaign Management**: Create, schedule, and track campaigns
- **Contact Management**: Filter and segment contacts
- **Results Tracking**: Detailed analytics and success rates
- **Escalation System**: Automatic human escalation for complex queries

## 🔧 Environment Configuration

### Required Environment Variables

Add these to your `.env` file:

```env
# Green API Configuration
VITE_GREEN_API_INSTANCE_ID=7105284900
VITE_GREEN_API_TOKEN=b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294
VITE_GREEN_API_URL=https://7105.api.greenapi.com

# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Rate Limiting Configuration
VITE_GREEN_API_RATE_LIMIT=60
VITE_GREEN_API_COOLDOWN_DAYS=7
VITE_GREEN_API_JITTER_MS=2000

# Webhook Configuration
VITE_WHATSAPP_WEBHOOK_URL=https://your-domain.com/.netlify/functions/enhanced-whatsapp-webhook
```

### Optional Environment Variables

```env
# Advanced Configuration
VITE_WHATSAPP_MAX_RETRIES=3
VITE_WHATSAPP_RETRY_DELAY=5000
VITE_WHATSAPP_BATCH_SIZE=50
VITE_WHATSAPP_ENABLE_ANALYTICS=true
VITE_WHATSAPP_ENABLE_AI_FEATURES=true
VITE_WHATSAPP_ENABLE_COMPLIANCE_CHECKS=true
```

## 📋 Database Setup

### 1. Run the Migration

Apply the enhanced bulk messaging migration:

```bash
# Apply the migration
npx supabase db push

# Or manually run the SQL
# Copy the contents of supabase/migrations/20241225000000_create_enhanced_bulk_messaging_tables.sql
# and run it in your Supabase SQL Editor
```

### 2. Verify Tables Created

The migration creates these tables:
- `whatsapp_campaigns` - Campaign management
- `whatsapp_bulk_message_results` - Send results tracking
- `whatsapp_escalations` - Human escalation queue
- `whatsapp_contact_preferences` - Contact preferences
- `whatsapp_message_templates` - Reusable templates
- `whatsapp_analytics_events` - Analytics tracking

## 🔗 Webhook Configuration

### 1. Deploy the Enhanced Webhook

The enhanced webhook is located at:
```
netlify/functions/enhanced-whatsapp-webhook.js
```

### 2. Configure Green API Webhook

1. Go to your Green API dashboard
2. Navigate to your instance settings
3. Set webhook URL to: `https://your-domain.com/.netlify/functions/enhanced-whatsapp-webhook`
4. Enable these webhook events:
   - ✅ `incomingMessageReceived`
   - ✅ `outgoingMessageReceived`
   - ✅ `outgoingAPIMessageReceived`
   - ✅ `outgoingMessageStatus`

## 🎯 Usage Guide

### 1. Creating a Campaign

```typescript
import { whatsappBulkMessagingService } from '../lib/whatsappBulkMessagingService';

// Create a new campaign
const campaign = await whatsappBulkMessagingService.createCampaign({
  name: 'Welcome Campaign',
  description: 'Welcome new customers',
  messageTemplate: 'Hi {{name}}, welcome to LATS CHANCE!',
  language: 'both',
  variant: 'single',
  targetAudience: {
    customerTypes: ['new'],
    locations: ['Dar es Salaam'],
    lastActivityDays: 30
  }
});
```

### 2. Sending Bulk Messages

```typescript
// Get contacts
const contacts = await whatsappBulkMessagingService.getContactsForBulkMessaging({
  customerTypes: ['high_value'],
  excludeOptedOut: true
});

// Send messages
const { results, stats } = await whatsappBulkMessagingService.sendBulkMessages(
  campaign.id,
  contacts,
  (progress) => {
    console.log(`Progress: ${progress.completed}/${progress.total}`);
  }
);
```

### 3. Using the Enhanced Component

```tsx
import { EnhancedWhatsAppBulkSender } from '../components/EnhancedWhatsAppBulkSender';

function MyPage() {
  return (
    <EnhancedWhatsAppBulkSender
      onComplete={(results, stats) => {
        console.log('Campaign completed:', stats);
      }}
      onProgress={(progress) => {
        console.log('Progress:', progress);
      }}
    />
  );
}
```

## 🛡️ Compliance Features

### Automatic Spam Detection

The system automatically detects:
- Excessive capitalization
- Urgency indicators ("act now", "limited time")
- Suspicious links
- Spam keywords
- High-frequency sending patterns

### Opt-out Management

- Automatic opt-out detection ("STOP", "unsubscribe")
- Opt-out confirmation messages
- Database tracking of opt-out status
- Respect for opt-out preferences

### Rate Limiting

- Configurable rate limits per minute
- Random jitter to avoid detection
- Cooldown periods between sends
- Automatic retry with exponential backoff

## 🤖 AI Features

### Campaign Analysis

AI analyzes campaigns for:
- Spam score calculation
- Risk level assessment
- Compliance issues
- Personalization suggestions
- Language optimization

### FAQ Responses

AI automatically responds to:
- Greetings and introductions
- Service inquiries
- Pricing questions
- Location requests
- General support questions

### Smart Escalation

AI escalates to humans when:
- Questions are too complex
- Technical issues arise
- Complaints are detected
- Sales inquiries need attention

## 📊 Analytics & Reporting

### Campaign Analytics

- Success rates by campaign
- Delivery and read statistics
- Opt-out rates
- Response rates
- Performance trends

### Contact Analytics

- Engagement levels
- Language preferences
- Response patterns
- Opt-in/opt-out trends

### System Analytics

- API usage statistics
- Rate limiting events
- Error rates and types
- Performance metrics

## 🔧 Advanced Configuration

### Custom Rate Limits

```env
# Messages per minute
VITE_GREEN_API_RATE_LIMIT=60

# Days between sends to same contact
VITE_GREEN_API_COOLDOWN_DAYS=7

# Random jitter in milliseconds
VITE_GREEN_API_JITTER_MS=2000
```

### AI Configuration

```env
# Enable/disable AI features
VITE_WHATSAPP_ENABLE_AI_FEATURES=true

# AI confidence threshold
VITE_AI_CONFIDENCE_THRESHOLD=0.7

# Maximum AI response time
VITE_AI_MAX_RESPONSE_TIME=30
```

### Compliance Settings

```env
# Enable compliance checks
VITE_WHATSAPP_ENABLE_COMPLIANCE_CHECKS=true

# Maximum spam score allowed
VITE_MAX_SPAM_SCORE=50

# Required opt-out text
VITE_REQUIRED_OPT_OUT_TEXT=Reply STOP to unsubscribe
```

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Messages**
   - Check webhook URL configuration
   - Verify Green API instance status
   - Check Netlify function logs

2. **Rate Limiting Errors**
   - Increase `VITE_GREEN_API_RATE_LIMIT`
   - Increase `VITE_GREEN_API_JITTER_MS`
   - Check Green API quota

3. **AI Features Not Working**
   - Verify `VITE_GEMINI_API_KEY` is set
   - Check API key permissions
   - Verify internet connectivity

4. **Database Errors**
   - Run migration again
   - Check Supabase connection
   - Verify RLS policies

### Debug Mode

Enable debug mode for detailed logging:

```env
VITE_WHATSAPP_DEBUG_MODE=true
```

### Support

For issues:
1. Check the console logs
2. Review Netlify function logs
3. Check Supabase logs
4. Verify environment variables
5. Test with small batches first

## 🎉 Ready to Use!

Your enhanced WhatsApp bulk messaging system is now ready! You can:

1. **Create AI-powered campaigns** with automatic analysis
2. **Send personalized messages** with smart throttling
3. **Handle replies automatically** with AI responses
4. **Track performance** with detailed analytics
5. **Ensure compliance** with automatic guardrails

Start by creating your first campaign in the Enhanced WhatsApp Bulk Sender component!
