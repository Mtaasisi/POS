# Instagram DM Integration Guide

## Overview

This guide explains how to integrate the Instagram Direct Messaging module into your existing application. The Instagram DM feature is built as a standalone module that can be easily connected to your app.

## Quick Start

### 1. Import and Use

```typescript
// Add to your router
import { InstagramDMPage } from '@/features/instagram';

// Use as a standalone page
<Route path="/instagram-dm" element={<InstagramDMPage />} />

// Or use components individually
import { 
  ConversationList, 
  MessageThread, 
  useInstagramDM 
} from '@/features/instagram';
```

### 2. Add Navigation

```typescript
// Add to your navigation menu
import { Instagram } from 'lucide-react';
import { useInstagramDM } from '@/features/instagram';

function NavBar() {
  const [instagramState] = useInstagramDM();
  
  return (
    <nav>
      <Link 
        to="/instagram-dm"
        className="nav-item"
      >
        <Instagram size={20} />
        Instagram DMs
        {instagramState.unreadCount > 0 && (
          <span className="badge">{instagramState.unreadCount}</span>
        )}
      </Link>
    </nav>
  );
}
```

### 3. Dashboard Integration

```typescript
// Add widget to dashboard
import { InstagramIntegrationWidget } from '@/features/instagram';

function Dashboard() {
  return (
    <div className="dashboard-grid">
      {/* Existing widgets */}
      
      <InstagramIntegrationWidget 
        onNavigateToInstagram={() => navigate('/instagram-dm')}
        showDetails={true}
      />
    </div>
  );
}
```

## Setup Requirements

### Instagram/Facebook Setup

1. **Instagram Professional Account**
   - Convert your Instagram account to Business or Creator
   - Connect to a Facebook Page

2. **Facebook App Configuration**
   - Create app at [developers.facebook.com](https://developers.facebook.com)
   - Add Instagram API product
   - Configure required permissions:
     - `instagram_business_basic`
     - `instagram_business_manage_messages`
     - `pages_manage_metadata`
     - `pages_messaging`

3. **Access Token Generation**
   - Use Facebook's [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Generate long-lived access token (60 days)
   - Store securely in your application

### Webhook Configuration

1. **Webhook URL Setup**
   ```
   URL: https://yourdomain.com/webhook/instagram
   Verify Token: Generate secure random string
   ```

2. **Event Subscriptions**
   - `messages` - New messages from users
   - `messaging_postbacks` - Button clicks and interactions
   - `messaging_optins` - User opt-ins
   - `messaging_referral` - Referral messages

3. **Backend Implementation**
   ```typescript
   // Example Express.js setup
   app.get('/webhook/instagram', webhookHandler.verify);
   app.post('/webhook/instagram', webhookHandler.handle);
   ```

## Environment Variables

Add these to your `.env` file:

```bash
# Instagram API
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id
FACEBOOK_PAGE_ID=your_facebook_page_id

# Webhook Security
INSTAGRAM_VERIFY_TOKEN=your_verify_token_here
FACEBOOK_APP_SECRET=your_app_secret_here

# Application URLs
FRONTEND_URL=http://localhost:3000
WEBHOOK_BASE_URL=https://yourdomain.com
```

## Integration Examples

### Customer Service Integration

```typescript
// Integrate with existing customer service
import { useInstagramDM, createSupportTicket } from '@/features/instagram';

function CustomerServiceDashboard() {
  const [instagramState, instagramActions] = useInstagramDM();
  
  const handleCreateTicket = (conversation) => {
    const ticket = createSupportTicket(conversation);
    // Send to your existing ticketing system
    submitSupportTicket(ticket);
  };
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <ConversationList 
        conversations={instagramState.conversations}
        onSelectConversation={instagramActions.selectConversation}
      />
      <MessageThread 
        conversation={instagramState.activeConversation}
        onMarkAsRead={instagramActions.markAsRead}
      />
      <div>
        <button onClick={() => handleCreateTicket(instagramState.activeConversation)}>
          Create Support Ticket
        </button>
      </div>
    </div>
  );
}
```

### E-commerce Integration

```typescript
// Integrate with product catalog
import { createProductShowcase } from '@/features/instagram';

function ProductCatalogIntegration() {
  const [instagramState, instagramActions] = useInstagramDM();
  const { products } = useProducts(); // Your existing product hook
  
  const handleShowProducts = async (recipientId: string, categoryId?: string) => {
    const filteredProducts = categoryId 
      ? products.filter(p => p.categoryId === categoryId)
      : products.slice(0, 10);
      
    const template = createProductShowcase(filteredProducts);
    await instagramActions.sendTemplate(recipientId, template);
  };
  
  return (
    <div>
      {/* Your product management UI */}
    </div>
  );
}
```

### Notification Integration

```typescript
// Integrate with existing notification system
import { createInstagramNotification } from '@/features/instagram';

function NotificationManager() {
  const { addNotification } = useNotifications(); // Your existing hook
  
  useEffect(() => {
    // Listen for new Instagram messages
    const handleNewMessage = (event) => {
      const notification = createInstagramNotification(
        event.conversation, 
        event.message
      );
      addNotification(notification);
    };
    
    // Subscribe to Instagram message events
    // This would be set up through your webhook handler
    
  }, []);
}
```

## API Integration

### With Existing Backend

```typescript
// If you have an existing API, create endpoints
// backend/routes/instagram.js

router.get('/api/instagram/conversations', async (req, res) => {
  // Return conversations from your database
  const conversations = await db.query('SELECT * FROM instagram_conversations');
  res.json(conversations);
});

router.post('/api/instagram/send-message', async (req, res) => {
  const { recipientId, message } = req.body;
  
  // Send via Instagram API
  const result = await instagramApiService.sendTextMessage(recipientId, message);
  
  // Log to database
  if (result.ok) {
    await db.query('INSERT INTO instagram_messages ...', [recipientId, message]);
  }
  
  res.json(result);
});
```

### Database Schema

If you want to persist Instagram data server-side:

```sql
-- Instagram conversations table
CREATE TABLE instagram_conversations (
    id VARCHAR(255) PRIMARY KEY,
    instagram_user_id VARCHAR(255) NOT NULL,
    instagram_username VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    profile_pic_url TEXT,
    follower_count INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    unread_count INTEGER DEFAULT 0,
    last_message_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Instagram messages table
CREATE TABLE instagram_messages (
    id VARCHAR(255) PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    text TEXT,
    attachments JSON,
    quick_reply_payload VARCHAR(255),
    direction ENUM('inbound', 'outbound') NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES instagram_conversations(id)
);

-- Auto-reply rules table
CREATE TABLE instagram_auto_reply_rules (
    id VARCHAR(255) PRIMARY KEY,
    trigger_keywords JSON NOT NULL,
    response_type ENUM('text', 'quick_reply', 'template') NOT NULL,
    response_content JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Security Considerations

### 1. Access Token Security

```typescript
// Never expose access tokens in frontend code
// Use environment variables and secure storage

// Good: Server-side storage
const settings = await fetchInstagramSettings(); // From secure backend

// Bad: Client-side storage of sensitive tokens
localStorage.setItem('access_token', token); // Don't do this in production
```

### 2. Webhook Verification

```typescript
// Always verify webhook signatures in production
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET!)
    .update(payload, 'utf8')
    .digest('hex');
    
  return signature === `sha256=${expectedSignature}`;
}
```

### 3. Rate Limiting

```typescript
// Implement rate limiting for API calls
import rateLimit from 'express-rate-limit';

const instagramRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Instagram's limit
  message: 'Too many Instagram API requests'
});

app.use('/api/instagram', instagramRateLimit);
```

## Monitoring & Analytics

### 1. Error Tracking

```typescript
// Add error tracking for Instagram operations
import { captureException } from '@sentry/react';

const instagramApiService = {
  async sendMessage(recipientId: string, text: string) {
    try {
      const result = await this.makeRequest(/* ... */);
      return result;
    } catch (error) {
      captureException(error, {
        tags: { feature: 'instagram_dm' },
        extra: { recipientId, messageLength: text.length }
      });
      throw error;
    }
  }
};
```

### 2. Performance Monitoring

```typescript
// Monitor Instagram API performance
const performanceMonitor = {
  trackApiCall: (endpoint: string, duration: number, success: boolean) => {
    // Send to your analytics service
    analytics.track('instagram_api_call', {
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString()
    });
  }
};
```

## Testing

### 1. Unit Tests

```typescript
// __tests__/instagram.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useInstagramDM } from '@/features/instagram';

describe('useInstagramDM', () => {
  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useInstagramDM());
    expect(result.current[0].isConnected).toBe(false);
  });
});
```

### 2. Integration Tests

```typescript
// Test webhook processing
import { processInstagramWebhook } from '@/features/instagram';

describe('Instagram Webhook', () => {
  it('should process message webhook', async () => {
    const webhook = {
      object: 'instagram',
      entry: [{ messaging: [/* test data */] }]
    };
    
    await processInstagramWebhook(webhook);
    // Assert expected behavior
  });
});
```

## Production Deployment

### 1. Webhook Endpoint

```typescript
// Ensure your webhook endpoint is:
// - Accessible via HTTPS
// - Returns 200 status quickly (< 20 seconds)
// - Handles high traffic (use queues for processing)

// Example with queue processing
import Queue from 'bull';

const instagramQueue = new Queue('instagram processing');

app.post('/webhook/instagram', (req, res) => {
  // Respond immediately
  res.status(200).send('OK');
  
  // Queue processing for later
  instagramQueue.add('process_webhook', req.body);
});
```

### 2. Scaling Considerations

- Use database storage instead of localStorage
- Implement proper caching for user profiles
- Set up monitoring and alerting
- Use CDN for media attachments
- Implement message archival for old conversations

## Support

For questions about this integration:

1. Check the [Instagram API Documentation](https://developers.facebook.com/docs/instagram-platform/)
2. Review the feature README: `/src/features/instagram/README.md`
3. Test with the Graph API Explorer
4. Enable debug logging: `localStorage.setItem('instagram_debug', 'true')`

## Migration from Existing Instagram Integration

If you have an existing Instagram integration:

1. **Export existing data** before switching
2. **Map your data** to the new conversation format
3. **Update webhook endpoints** to use the new handler
4. **Test thoroughly** with a small subset of users
5. **Monitor performance** during migration