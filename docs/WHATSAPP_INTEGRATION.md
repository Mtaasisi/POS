# WhatsApp Green API Integration

This document provides comprehensive information about integrating WhatsApp Green API into your LATS CHANCE application.

## Overview

The WhatsApp integration allows you to:
- Send and receive WhatsApp messages
- Manage multiple WhatsApp instances
- Handle different message types (text, files, location, contacts)
- Monitor message status and instance states
- Integrate with your existing customer management system

## Prerequisites

1. **Green API Account**: Sign up at [https://green-api.com](https://green-api.com)
2. **WhatsApp Business Account** (optional but recommended)
3. **Phone Number**: A dedicated phone number for WhatsApp integration
4. **API Token**: Get your API token from Green API dashboard

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# WhatsApp Green API Configuration
VITE_WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp-webhook
VITE_WHATSAPP_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Database Migration

Run the database migration to create the required tables:

```bash
# Apply the WhatsApp migration
npx supabase db push
```

This will create the following tables:
- `whatsapp_instances` - Stores WhatsApp instance configurations
- `whatsapp_messages` - Stores all sent and received messages
- `whatsapp_webhooks` - Stores incoming webhook data

### 3. Webhook Configuration

Configure your webhook URL in the Green API dashboard:

1. Go to your Green API dashboard
2. Navigate to the instance settings
3. Set the webhook URL to: `https://your-domain.com/api/whatsapp-webhook`
4. Enable the following webhook events:
   - `incomingMessageReceived`
   - `outgoingMessageReceived`
   - `outgoingAPIMessageReceived`
   - `outgoingMessageStatus`
   - `stateInstanceChanged`
   - `statusInstanceChanged`
   - `deviceInfo`
   - `incomingCall`

## Usage

### 1. Creating a WhatsApp Instance

```typescript
import { useWhatsApp } from '../hooks/useWhatsApp';

const { createInstance } = useWhatsApp();

// Create a new WhatsApp instance
const instance = await createInstance(
  '255123456789', // Phone number
  'your_api_token_here' // Green API token
);
```

### 2. Sending Messages

```typescript
import { useWhatsApp } from '../hooks/useWhatsApp';

const { sendTextMessage, sendFileMessage } = useWhatsApp();

// Send text message
await sendTextMessage(
  instanceId,
  '255123456789@c.us', // Chat ID (phone number with @c.us suffix)
  'Hello from LATS CHANCE!'
);

// Send file message
await sendFileMessage(
  instanceId,
  '255123456789@c.us',
  'https://example.com/file.pdf',
  'Check out this document'
);
```

### 3. Managing Instances

```typescript
import { useWhatsApp } from '../hooks/useWhatsApp';

const { 
  instances, 
  getQRCode, 
  getInstanceState, 
  deleteInstance 
} = useWhatsApp();

// Get QR code for authentication
const qrCode = await getQRCode(instanceId);

// Check instance status
const status = await getInstanceState(instanceId);

// Delete instance
await deleteInstance(instanceId);
```

### 4. Chat History

```typescript
import { useWhatsApp } from '../hooks/useWhatsApp';

const { getChatHistory } = useWhatsApp();

// Get chat history
const messages = await getChatHistory(
  instanceId,
  '255123456789@c.us',
  100 // Number of messages to retrieve
);
```

## API Reference

### WhatsAppService

The main service class that handles all WhatsApp operations.

#### Methods

- `createInstance(phoneNumber: string, apiToken: string): Promise<WhatsAppInstance>`
- `getQRCode(instanceId: string): Promise<string>`
- `getInstanceState(instanceId: string): Promise<string>`
- `sendTextMessage(instanceId: string, chatId: string, message: string): Promise<string>`
- `sendFileMessage(instanceId: string, chatId: string, fileUrl: string, caption?: string): Promise<string>`
- `sendLocationMessage(instanceId: string, chatId: string, latitude: number, longitude: number, name?: string, address?: string): Promise<string>`
- `sendContactMessage(instanceId: string, chatId: string, contactData: { name: string; phone: string; email?: string }): Promise<string>`
- `getChatHistory(instanceId: string, chatId: string, count?: number): Promise<WhatsAppMessage[]>`
- `checkWhatsApp(instanceId: string, phoneNumber: string): Promise<boolean>`
- `getContacts(instanceId: string): Promise<any[]>`
- `deleteInstance(instanceId: string): Promise<void>`

### useWhatsApp Hook

React hook that provides easy access to WhatsApp functionality.

#### Returns

- `instances: WhatsAppInstance[]` - List of all instances
- `loading: boolean` - Loading state
- `error: string | null` - Error state
- All methods from WhatsAppService

## Message Types

### Text Messages
```typescript
await sendTextMessage(instanceId, chatId, "Hello World!");
```

### File Messages
```typescript
await sendFileMessage(
  instanceId, 
  chatId, 
  "https://example.com/document.pdf",
  "Check this out!"
);
```

### Location Messages
```typescript
await sendLocationMessage(
  instanceId,
  chatId,
  -6.8235, // Latitude
  39.2695, // Longitude
  "LATS CHANCE Office",
  "Dar es Salaam, Tanzania"
);
```

### Contact Messages
```typescript
await sendContactMessage(
  instanceId,
  chatId,
  {
    name: "John Doe",
    phone: "255123456789",
    email: "john@example.com"
  }
);
```

## Chat ID Format

WhatsApp uses a specific format for chat IDs:

- **Individual chats**: `255123456789@c.us`
- **Group chats**: `group_id@g.us`
- **Broadcast lists**: `broadcast_id@broadcast`

## Webhook Events

The system handles the following webhook events:

### incomingMessageReceived
Triggered when a new message is received.

### outgoingMessageReceived
Triggered when a message is sent from the phone.

### outgoingAPIMessageReceived
Triggered when a message is sent via API.

### outgoingMessageStatus
Triggered when message status changes (sent, delivered, read).

### stateInstanceChanged
Triggered when instance state changes (authorized, notAuthorized, blocked).

### statusInstanceChanged
Triggered when instance status changes.

### deviceInfo
Triggered when device information is updated.

### incomingCall
Triggered when an incoming call is received.

## Error Handling

The integration includes comprehensive error handling:

```typescript
try {
  await sendTextMessage(instanceId, chatId, message);
} catch (error) {
  console.error('Failed to send message:', error);
  // Handle error appropriately
}
```

Common error scenarios:
- Instance not found
- Invalid phone number
- Message too long
- File too large
- Network errors
- Authentication errors

## Rate Limiting

The integration respects WhatsApp's rate limits:

- **Messages per minute**: 30 (configurable)
- **Messages per hour**: 1000 (configurable)
- **API requests per minute**: 60 (configurable)

## Security Considerations

1. **API Token Security**: Never expose API tokens in client-side code
2. **Webhook Validation**: Implement webhook signature validation
3. **Phone Number Privacy**: Handle phone numbers securely
4. **Message Encryption**: Consider end-to-end encryption for sensitive messages

## Troubleshooting

### Common Issues

1. **QR Code Not Generating**
   - Check if the instance is properly created
   - Verify API token is correct
   - Ensure instance is not already authorized

2. **Messages Not Sending**
   - Check instance status (should be 'authorized')
   - Verify phone number format
   - Check rate limits

3. **Webhooks Not Receiving**
   - Verify webhook URL is accessible
   - Check webhook configuration in Green API dashboard
   - Ensure proper SSL certificate

4. **Authentication Issues**
   - Verify API token is valid
   - Check instance permissions
   - Ensure phone number is registered

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// In development
const config = getWhatsAppConfig();
console.log('Debug mode:', config.development.debugMode);
```

### Logs

Check the following logs for debugging:

1. **Browser Console**: Client-side errors
2. **Server Logs**: Webhook processing errors
3. **Database Logs**: Message and instance errors

## Integration with Existing Features

### Customer Management
```typescript
// Send welcome message to new customer
const customer = await getCustomer(customerId);
await sendTextMessage(
  instanceId,
  `${customer.phone}@c.us`,
  `Welcome ${customer.name}! Thank you for choosing LATS CHANCE.`
);
```

### Order Notifications
```typescript
// Send order confirmation
const order = await getOrder(orderId);
await sendTextMessage(
  instanceId,
  `${order.customerPhone}@c.us`,
  `Your order #${order.id} has been confirmed and is being processed.`
);
```

### Appointment Reminders
```typescript
// Send appointment reminder
const appointment = await getAppointment(appointmentId);
await sendTextMessage(
  instanceId,
  `${appointment.customerPhone}@c.us`,
  `Reminder: You have an appointment tomorrow at ${appointment.time}.`
);
```

## Best Practices

1. **Instance Management**
   - Use dedicated instances for different purposes
   - Monitor instance health regularly
   - Implement automatic reconnection

2. **Message Handling**
   - Implement message queuing for high volume
   - Use templates for common messages
   - Handle message status updates

3. **Error Recovery**
   - Implement retry mechanisms
   - Log all errors for debugging
   - Provide user-friendly error messages

4. **Performance**
   - Cache frequently used data
   - Implement pagination for chat history
   - Use efficient database queries

## Support

For issues related to:
- **Green API**: Contact Green API support
- **Integration**: Check this documentation
- **Application**: Contact your development team

## Resources

- [Green API Documentation](https://green-api.com/en/docs/api/)
- [WhatsApp Business API](https://business.whatsapp.com/)
- [WhatsApp Message Format](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
