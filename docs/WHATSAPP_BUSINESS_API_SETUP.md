# WhatsApp Business API Setup Guide

This guide will help you set up and configure WhatsApp Business API integration in your application.

## Overview

WhatsApp Business API is Meta's official API for sending and receiving WhatsApp messages programmatically. This integration replaces the previous Green API implementation with the official Meta solution.

## Prerequisites

1. **Meta Developer Account**: Create an account at [developers.facebook.com](https://developers.facebook.com)
2. **WhatsApp Business App**: Set up a WhatsApp Business App in the Meta Developer Console
3. **Verified Phone Number**: Add and verify a phone number in your WhatsApp Business App
4. **Business Account**: Set up a Meta Business Account

## Step-by-Step Setup

### 1. Create Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click "Get Started" and create an account
3. Complete the verification process

### 2. Create WhatsApp Business App

1. In the Meta Developer Console, click "Create App"
2. Select "Business" as the app type
3. Choose "WhatsApp" as the product
4. Fill in your app details and create the app

### 3. Add WhatsApp to Your App

1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set up" next to WhatsApp
3. Follow the setup wizard

### 4. Add Phone Number

1. In the WhatsApp setup, click "Add phone number"
2. Enter your business phone number
3. Verify the number through SMS or call
4. Note down the **Phone Number ID** (you'll need this later)

### 5. Get Access Token

1. In your app dashboard, go to "System Users" or "Access Tokens"
2. Generate a new access token with the following permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
3. Copy the access token (starts with "EAA...")

### 6. Get Business Account ID

1. In your app dashboard, go to "Business Settings"
2. Find your Business Account ID
3. Copy this ID (you'll need it for templates)

## Configuration

### Option 1: Using the Setup Script (Recommended)

Run the automated setup script:

```bash
node scripts/setup-whatsapp-business-api.js
```

The script will guide you through entering all the required information.

### Option 2: Manual Configuration

1. Go to your application's WhatsApp settings
2. Click "Configure WhatsApp Business API"
3. Enter the following information:
   - **Access Token**: Your Meta app access token
   - **Phone Number ID**: The ID of your verified phone number
   - **Business Account ID**: Your Meta Business Account ID
   - **App ID**: Your Meta App ID (optional)
   - **App Secret**: Your Meta App Secret (optional)
   - **API Version**: v18.0 (recommended)

### 3. Webhook Configuration

1. In your Meta Developer Console, go to your WhatsApp app
2. Click "Configuration" → "Webhooks"
3. Add a new webhook with:
   - **Webhook URL**: `https://your-domain.com/api/whatsapp-business-webhook`
   - **Verify Token**: Use the token generated in the configuration
4. Subscribe to the following fields:
   - `messages`
   - `message_status`
   - `message_template_status_update`

## Database Migration

Run the database migration to create the necessary tables:

```bash
# If using Supabase CLI
supabase db push

# Or run the migration manually
psql -d your_database -f supabase/migrations/20241201000040_add_whatsapp_business_tables.sql
```

## Testing the Integration

### 1. Test Connection

1. In your WhatsApp dashboard, click "Test Connection"
2. Verify that your phone number and access token are working
3. Check that the connection status shows "Connected"

### 2. Send Test Message

1. Go to the Chat tab in your WhatsApp dashboard
2. Select a contact or enter a phone number
3. Send a test message
4. Verify the message is delivered

### 3. Test Webhook

1. Send a message to your WhatsApp Business number
2. Check the webhook logs in your application
3. Verify that incoming messages are stored in the database

## API Usage

### Sending Messages

```typescript
import { whatsappBusinessApi } from '../services/whatsappBusinessApi';

// Send text message
const result = await whatsappBusinessApi.sendMessage(
  '1234567890', // Phone number
  'Hello from WhatsApp Business API!'
);

// Send template message
const templateResult = await whatsappBusinessApi.sendMessage(
  '1234567890',
  'Hello {{1}}!',
  'template',
  'hello_world',
  'en_US',
  ['John']
);
```

### Sending Media

```typescript
// Send image
const mediaResult = await whatsappBusinessApi.sendMediaMessage(
  '1234567890',
  'https://example.com/image.jpg',
  'image',
  'Check out this image!'
);

// Upload and send file
const uploadResult = await whatsappBusinessApi.uploadMedia(file);
if (uploadResult.success) {
  await whatsappBusinessApi.sendMediaMessage(
    '1234567890',
    uploadResult.mediaId!,
    'document'
  );
}
```

### Getting Templates

```typescript
const templates = await whatsappBusinessApi.getTemplates();
if (templates.success) {
  console.log('Available templates:', templates.templates);
}
```

## Webhook Handling

The application automatically handles incoming webhooks and stores messages in the database. The webhook endpoint is:

```
POST /api/whatsapp-business-webhook
```

### Webhook Events

- **Messages**: Incoming messages from users
- **Status Updates**: Delivery status of sent messages
- **Template Status**: Status of message templates

## Troubleshooting

### Common Issues

1. **"Access Token Invalid"**
   - Check that your access token is correct
   - Ensure the token hasn't expired
   - Verify the token has the required permissions

2. **"Phone Number Not Verified"**
   - Complete the phone number verification process
   - Wait for verification to complete (can take up to 24 hours)

3. **"Webhook Verification Failed"**
   - Check that the webhook URL is accessible
   - Verify the webhook token matches
   - Ensure HTTPS is enabled for the webhook URL

4. **"Rate Limit Exceeded"**
   - The API has rate limits (typically 1000 messages per day for free tier)
   - Implement proper rate limiting in your application
   - Consider upgrading your WhatsApp Business API plan

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=whatsapp-business-api
```

### Checking Logs

Monitor your application logs for WhatsApp Business API activity:

```bash
# View real-time logs
tail -f logs/application.log | grep whatsapp
```

## Security Considerations

1. **Access Token Security**
   - Store access tokens securely
   - Rotate tokens regularly
   - Use environment variables for sensitive data

2. **Webhook Security**
   - Use HTTPS for webhook URLs
   - Implement webhook signature verification
   - Validate webhook payloads

3. **Rate Limiting**
   - Implement proper rate limiting
   - Monitor API usage
   - Handle rate limit errors gracefully

## Migration from Green API

If you're migrating from Green API:

1. **Backup Current Data**
   - Export your current WhatsApp messages
   - Save your Green API configuration

2. **Update Configuration**
   - Switch to WhatsApp Business API settings
   - Update webhook URLs
   - Test the new integration

3. **Data Migration**
   - Import existing messages if needed
   - Update message IDs to match new format
   - Verify all functionality works

## Support

For additional support:

1. **Meta Developer Documentation**: [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
2. **Meta Developer Community**: [Facebook Developer Community](https://developers.facebook.com/community/)
3. **Application Support**: Check your application's support channels

## API Limits

- **Free Tier**: 1,000 messages per month
- **Business Tier**: Higher limits based on your plan
- **Rate Limits**: Varies by plan and usage

## Best Practices

1. **Message Templates**: Use approved templates for initial messages
2. **Response Time**: Respond within 24 hours to maintain session
3. **Content Guidelines**: Follow WhatsApp's content policies
4. **Testing**: Test thoroughly in development before production
5. **Monitoring**: Monitor message delivery and engagement rates

## Environment Variables

Add these to your `.env` file:

```bash
# WhatsApp Business API
WHATSAPP_BUSINESS_ACCESS_TOKEN=your_access_token
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_BUSINESS_WEBHOOK_VERIFY_TOKEN=your_webhook_token
WHATSAPP_BUSINESS_API_VERSION=v18.0
```

## Next Steps

After setup:

1. **Test the Integration**: Send test messages and verify webhooks
2. **Configure Templates**: Set up message templates for business use
3. **Implement Features**: Add bulk messaging, autoresponders, etc.
4. **Monitor Usage**: Track message delivery and engagement
5. **Scale Up**: Upgrade your plan as needed

---

For more information, refer to the [WhatsApp Business API documentation](https://developers.facebook.com/docs/whatsapp/cloud-api).
