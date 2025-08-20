# WhatsApp Chrome Extension Integration

This document explains how to integrate your WhatsApp Chrome extension with the LATS CHANCE app.

## Overview

The Chrome extension integration allows you to:
- Automatically process WhatsApp messages
- Create support tickets from customer inquiries
- Schedule appointments from chat requests
- Send automated responses
- Track customer interactions

## Setup Instructions

### 1. Chrome Extension Configuration

1. Install your WhatsApp Chrome extension
2. Configure the webhook URL in your extension settings:
   ```
   https://your-domain.com/api/chrome-extension-webhook
   ```
3. Enter your API key: `1755675069644-f5ab0e92276f1e3332d41ece111c6201`

### 2. Database Setup

Run the migration to create necessary tables:
```bash
npx supabase db push
```

### 3. Access the Management Interface

Navigate to: `/whatsapp/chrome-extension` in your app to access the Chrome Extension Manager.

## API Endpoints

### Webhook Endpoint
- **URL**: `POST /api/chrome-extension-webhook`
- **Purpose**: Receive messages from Chrome extension
- **Body Format**:
```json
{
  "type": "message",
  "data": {
    "id": "message_id",
    "chatId": "chat_id",
    "content": "message content",
    "type": "text",
    "timestamp": 1234567890,
    "isFromMe": false,
    "customerPhone": "+1234567890",
    "customerName": "John Doe"
  }
}
```

### Send Message Endpoint
- **URL**: `POST /api/chrome-extension/messages`
- **Purpose**: Send messages through Chrome extension
- **Body Format**:
```json
{
  "chatId": "chat_id",
  "message": "Your message here",
  "type": "text"
}
```

### Status Check Endpoint
- **URL**: `GET /api/chrome-extension/status`
- **Purpose**: Check connection status
- **Response**:
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "queueLength": 0,
    "apiKey": "Configured"
  }
}
```

## Features

### Automatic Message Processing

The system automatically processes incoming messages based on content:

1. **Order Inquiries**: Creates support tickets for order-related questions
2. **Support Requests**: Logs support issues automatically
3. **Appointment Requests**: Schedules appointments from chat
4. **Payment Inquiries**: Provides payment information

### Auto-Reply System

Pre-configured auto-replies for common inquiries:
- Order inquiries
- Support requests
- Appointment requests
- Payment information

### Database Storage

All messages are stored in the database with:
- Message content and metadata
- Customer information
- Processing status
- Timestamps

## Management Interface

The Chrome Extension Manager provides:
- Real-time connection status
- Message queue monitoring
- Test message sending
- Webhook URL display
- Feature overview

## Troubleshooting

### Connection Issues
1. Check if the API key is correct
2. Verify the webhook URL is accessible
3. Ensure the Chrome extension is properly configured

### Message Processing Issues
1. Check the browser console for errors
2. Verify database tables exist
3. Check RLS policies are properly configured

### Auto-Reply Issues
1. Verify auto-reply templates exist in database
2. Check if auto-reply is enabled in settings
3. Review trigger keywords configuration

## Security Considerations

- API key is stored securely in database
- All endpoints require authentication
- RLS policies protect data access
- Webhook validation prevents unauthorized access

## Customization

### Adding New Auto-Reply Templates

Insert into `auto_reply_templates` table:
```sql
INSERT INTO auto_reply_templates (name, trigger_keywords, message, priority)
VALUES ('Custom Template', ARRAY['keyword1', 'keyword2'], 'Custom message', 5);
```

### Modifying Message Processing

Edit the `autoProcessMessage` method in `chromeExtensionService.ts` to add new processing logic.

### Custom Webhook Processing

Modify the webhook handler in `chrome-extension-webhook.ts` to add custom processing logic.
