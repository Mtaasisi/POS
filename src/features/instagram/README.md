# Instagram DM Feature

## Overview

A comprehensive Instagram Direct Messaging module that integrates with the Instagram Messaging API to enable businesses to manage customer conversations through Instagram DMs.

## Features

### ✅ Core Messaging
- **Send/Receive Messages**: Text messages, images, and media
- **Real-time Conversations**: Live message threading and conversation management
- **User Profiles**: Fetch Instagram user information and profile data
- **Message Status**: Read receipts and typing indicators

### ✅ Advanced Messaging
- **Quick Replies**: Send up to 13 quick reply buttons (20 chars each)
- **Generic Templates**: Rich structured messages with images and buttons
- **Button Templates**: Interactive buttons for actions and navigation
- **Message Templates**: Pre-saved message templates for quick responses

### ✅ Automation
- **Auto-Reply Rules**: Keyword-based automatic responses
- **Business Hours**: Configure when auto-replies are active
- **Welcome Messages**: Automated greeting for new conversations
- **Ice Breakers**: Pre-written conversation starters

### ✅ Management
- **Conversation Management**: Archive, block, and organize conversations
- **User Management**: Track follower status and verification
- **Settings Configuration**: Comprehensive settings panel
- **Analytics Dashboard**: Conversation metrics and performance insights

### 🚧 Planned Features
- **Persistent Menu**: Navigation menu in chat interface
- **Mentions Handling**: Respond to Instagram mentions
- **Media Sharing**: Send images, videos, and files
- **Conversation Assignment**: Team member assignment for conversations

## Installation & Setup

### 1. Prerequisites

Before using this module, ensure you have:

- **Instagram Professional Account** (Business or Creator)
- **Facebook Page** connected to your Instagram account
- **Facebook App** with Instagram API permissions
- **Webhook Server** to receive Instagram notifications

### 2. Required Permissions

Your Facebook App needs these permissions:
- `instagram_business_basic`
- `instagram_business_manage_messages`
- `pages_manage_metadata`
- `pages_messaging`

### 3. API Setup

1. **Create Facebook App**:
   - Go to [Facebook Developer Console](https://developers.facebook.com/)
   - Create new app with Instagram API product

2. **Get Access Token**:
   - Use [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Generate token with required permissions
   - Make token long-lived (60 days)

3. **Configure Webhooks**:
   ```
   Webhook URL: https://yourdomain.com/webhook/instagram
   Verify Token: Generate secure random string
   Events: messages, messaging_postbacks, messaging_optins, messaging_referral
   ```

## Usage

### Basic Integration

```typescript
import { InstagramDMPage, useInstagramDM } from '@/features/instagram';

// Use the complete page component
function App() {
  return <InstagramDMPage />;
}

// Or use the hook for custom implementation
function CustomInstagramChat() {
  const [state, actions] = useInstagramDM();
  
  // Connect to Instagram
  const handleConnect = async () => {
    await actions.connect(accessToken, accountId, pageId);
  };
  
  // Send message
  const handleSendMessage = async (recipientId: string, text: string) => {
    await actions.sendMessage(recipientId, text);
  };
  
  return (
    <div>
      {/* Your custom UI */}
    </div>
  );
}
```

### Webhook Integration

```typescript
import { processInstagramWebhook } from '@/features/instagram';

// Express.js webhook endpoint example
app.post('/webhook/instagram', async (req, res) => {
  try {
    await processInstagramWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send('Error');
  }
});

// Webhook verification
app.get('/webhook/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const result = InstagramWebhookHandler.verifyWebhook(
    mode, token, challenge, YOUR_VERIFY_TOKEN
  );
  
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(403).send('Forbidden');
  }
});
```

### Auto-Reply Rules

```typescript
const autoReplyRule = {
  trigger_keywords: ['hello', 'hi', 'hey'],
  response_type: 'text',
  response_content: 'Hello! Thanks for reaching out. How can I help you today?',
  is_active: true,
  priority: 5
};

actions.addAutoReplyRule(autoReplyRule);
```

### Quick Replies

```typescript
const quickReplies = [
  { content_type: 'text', title: 'View Products', payload: 'VIEW_PRODUCTS' },
  { content_type: 'text', title: 'Contact Support', payload: 'CONTACT_SUPPORT' },
  { content_type: 'text', title: 'Business Hours', payload: 'BUSINESS_HOURS' }
];

await actions.sendQuickReplies(
  recipientId, 
  'How can I help you today?', 
  quickReplies
);
```

### Generic Template

```typescript
const productTemplate = {
  template_type: 'generic',
  elements: [
    {
      title: 'Amazing Product',
      subtitle: 'High quality product description',
      image_url: 'https://example.com/product.jpg',
      buttons: [
        { type: 'web_url', title: 'View Details', url: 'https://store.com/product' },
        { type: 'postback', title: 'Add to Cart', payload: 'ADD_TO_CART_123' }
      ]
    }
  ]
};

await actions.sendTemplate(recipientId, productTemplate);
```

## File Structure

```
src/features/instagram/
├── pages/
│   └── InstagramDMPage.tsx         # Main dashboard page
├── components/
│   ├── ConversationList.tsx        # List of conversations
│   ├── MessageThread.tsx           # Message thread display
│   ├── MessageComposer.tsx         # Message composition interface
│   ├── InstagramConnection.tsx     # Connection/auth component
│   ├── InstagramSettingsPanel.tsx  # Settings configuration
│   └── InstagramAnalytics.tsx      # Analytics dashboard
├── hooks/
│   └── useInstagramDM.ts           # Main hook for Instagram DM
├── services/
│   ├── instagramApiService.ts      # Instagram API client
│   └── webhookHandler.ts           # Webhook processing logic
├── types/
│   └── instagram.ts                # TypeScript definitions
├── utils/                          # Utility functions (future)
├── index.ts                        # Feature exports
└── README.md                       # This file
```

## Data Storage

The module uses localStorage for client-side data persistence:

- **Conversations**: `instagram_conversations`
- **User Profiles**: `instagram_user_profiles`
- **Settings**: `instagram_settings`
- **Auto-Reply Rules**: `instagram_auto_reply_rules`
- **Message Templates**: `instagram_message_templates`

For production use, consider implementing server-side storage with your preferred database.

## API Rate Limits

Instagram API has rate limits:
- **Messages**: 1000 per hour per app
- **User Profile**: 200 per hour per app
- **Templates**: 250 per hour per recipient

The module includes basic throttling but consider implementing more sophisticated rate limiting for high-volume use.

## Security Considerations

1. **Access Tokens**: Store securely, implement token refresh
2. **Webhook Security**: Verify webhook signatures
3. **User Data**: Handle personal data according to privacy laws
4. **Rate Limiting**: Implement proper rate limiting
5. **Error Handling**: Never expose sensitive data in error messages

## Integration with Existing App

The module is designed as a standalone feature that can be easily integrated:

```typescript
// Add to your main app routes
import { InstagramDMPage } from '@/features/instagram';

const routes = [
  // ... existing routes
  { path: '/instagram-dm', component: InstagramDMPage }
];

// Or embed in existing dashboard
import { ConversationList, MessageThread } from '@/features/instagram';

function CustomerServiceDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <ConversationList {...props} />
      <MessageThread {...props} />
      {/* Other channels */}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Connection Failed**:
   - Verify access token has required permissions
   - Check Instagram account is Professional type
   - Ensure Facebook Page is connected to Instagram

2. **Webhooks Not Working**:
   - Verify webhook URL is accessible publicly
   - Check verify token matches Facebook App configuration
   - Ensure HTTPS is used for webhook URL

3. **Messages Not Sending**:
   - Check user consent (user must message first)
   - Verify Instagram account ID is correct
   - Check API rate limits

4. **User Profile Not Loading**:
   - User must have messaged your account first
   - Check access token permissions
   - Verify user hasn't blocked your account

### Debug Mode

Enable debug logging:

```typescript
// Enable detailed console logging
localStorage.setItem('instagram_debug', 'true');
```

## Support & Documentation

- [Instagram Messaging API Docs](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api)
- [Facebook Developer Console](https://developers.facebook.com/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

## License

This module follows the same license as the main application.