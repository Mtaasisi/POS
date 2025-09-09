# How to Fetch Real Instagram DMs

## Overview

Instagram doesn't provide a direct API endpoint to fetch existing conversations. Instead, you need to use **webhooks** to receive messages in real-time and store them in a database. Here's how to implement this properly.

## 🔧 **Step 1: Set Up Instagram Webhooks**

### 1.1 Create Facebook App with Instagram Permissions

1. Go to [Facebook Developer Console](https://developers.facebook.com/)
2. Create a new app or use existing app
3. Add **Instagram Basic Display** and **Instagram Graph API** products
4. Configure required permissions:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_manage_metadata`
   - `pages_messaging`

### 1.2 Configure Webhook URL

```typescript
// Your webhook URL should be publicly accessible
const WEBHOOK_URL = 'https://yourdomain.com/api/instagram/webhook';
const VERIFY_TOKEN = 'your_secure_verify_token_here';
```

### 1.3 Set Up Webhook Endpoints

```typescript
// backend/routes/instagram-webhook.ts
import express from 'express';
import { InstagramWebhookHandler } from '../services/instagramWebhookHandler';

const router = express.Router();
const webhookHandler = new InstagramWebhookHandler();

// Webhook verification (GET request from Facebook)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// Webhook events (POST request from Instagram)
router.post('/webhook', async (req, res) => {
  try {
    console.log('📱 Received Instagram webhook:', req.body);
    
    // Verify webhook signature for security
    const signature = req.headers['x-hub-signature-256'];
    if (!verifyWebhookSignature(req.body, signature, APP_SECRET)) {
      return res.status(403).send('Invalid signature');
    }

    // Process the webhook
    await webhookHandler.processWebhook(req.body);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
```

## 🔧 **Step 2: Create Database Schema**

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
    is_user_follow_business BOOLEAN DEFAULT FALSE,
    is_business_follow_user BOOLEAN DEFAULT FALSE,
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
    sender_id VARCHAR(255) NOT NULL,
    sender_type ENUM('user', 'business') NOT NULL,
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    attachments JSON,
    timestamp TIMESTAMP NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES instagram_conversations(id)
);

-- Instagram user profiles table
CREATE TABLE instagram_users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    profile_pic_url TEXT,
    follower_count INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔧 **Step 3: Enhanced Webhook Handler**

```typescript
// services/instagramWebhookHandler.ts
import { Database } from '../database';
import { InstagramApiService } from './instagramApiService';

export class InstagramWebhookHandler {
  private db: Database;
  private apiService: InstagramApiService;

  constructor() {
    this.db = new Database();
    this.apiService = new InstagramApiService();
  }

  async processWebhook(webhookData: any): Promise<void> {
    console.log('📱 Processing Instagram webhook:', webhookData);

    for (const entry of webhookData.entry) {
      if (entry.messaging) {
        for (const messaging of entry.messaging) {
          await this.handleMessaging(messaging);
        }
      }
    }
  }

  private async handleMessaging(messaging: any): Promise<void> {
    const senderId = messaging.sender.id;
    const recipientId = messaging.recipient.id;
    const message = messaging.message;

    // 1. Get or create user profile
    let user = await this.getOrCreateUser(senderId);
    
    // 2. Get or create conversation
    const conversationId = await this.getOrCreateConversation(senderId, user);
    
    // 3. Save the message
    if (message) {
      await this.saveMessage(conversationId, senderId, message);
      
      // 4. Update conversation unread count
      await this.updateConversationUnreadCount(conversationId);
      
      // 5. Trigger auto-reply if enabled
      await this.handleAutoReply(conversationId, message.text);
    }
  }

  private async getOrCreateUser(userId: string): Promise<any> {
    // Check if user exists in database
    let user = await this.db.query(
      'SELECT * FROM instagram_users WHERE id = ?',
      [userId]
    );

    if (!user) {
      // Fetch user profile from Instagram API
      const profileResult = await this.apiService.getUserProfile(userId);
      
      if (profileResult.ok && profileResult.data) {
        const profile = profileResult.data;
        
        // Save to database
        await this.db.query(`
          INSERT INTO instagram_users (id, username, name, profile_pic_url, follower_count, is_verified)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          profile.id,
          profile.username,
          profile.name,
          profile.profile_pic,
          profile.follower_count,
          profile.is_verified_user
        ]);
        
        user = profile;
      }
    }

    return user;
  }

  private async getOrCreateConversation(userId: string, user: any): Promise<string> {
    const conversationId = `conv_${userId}`;
    
    // Check if conversation exists
    let conversation = await this.db.query(
      'SELECT * FROM instagram_conversations WHERE id = ?',
      [conversationId]
    );

    if (!conversation) {
      // Create new conversation
      await this.db.query(`
        INSERT INTO instagram_conversations (
          id, instagram_user_id, instagram_username, user_name, 
          profile_pic_url, follower_count, is_verified, unread_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        conversationId,
        userId,
        user.username,
        user.name,
        user.profile_pic_url,
        user.follower_count,
        user.is_verified
      ]);
    }

    return conversationId;
  }

  private async saveMessage(conversationId: string, senderId: string, message: any): Promise<void> {
    await this.db.query(`
      INSERT INTO instagram_messages (
        id, conversation_id, sender_id, sender_type, 
        message_text, message_type, attachments, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      message.mid,
      conversationId,
      senderId,
      'user',
      message.text,
      message.type || 'text',
      JSON.stringify(message.attachments || []),
      new Date(message.timestamp)
    ]);
  }

  private async updateConversationUnreadCount(conversationId: string): Promise<void> {
    await this.db.query(`
      UPDATE instagram_conversations 
      SET unread_count = unread_count + 1,
          last_message_time = NOW(),
          updated_at = NOW()
      WHERE id = ?
    `, [conversationId]);
  }

  private async handleAutoReply(conversationId: string, messageText: string): Promise<void> {
    // Check if auto-reply is enabled
    const settings = await this.getInstagramSettings();
    
    if (!settings.auto_reply_enabled) return;

    // Check business hours
    if (settings.business_hours?.enabled) {
      if (!this.isWithinBusinessHours(settings.business_hours)) {
        return; // Outside business hours
      }
    }

    // Check auto-reply rules
    const matchingRule = await this.findMatchingAutoReplyRule(messageText);
    
    if (matchingRule) {
      // Send auto-reply
      const conversation = await this.getConversation(conversationId);
      await this.apiService.sendTextMessage(conversation.instagram_user_id, matchingRule.response);
    }
  }

  // API methods for frontend
  async getConversations(limit: number = 50): Promise<any[]> {
    const conversations = await this.db.query(`
      SELECT c.*, 
             COUNT(m.id) as message_count,
             MAX(m.timestamp) as last_message_time
      FROM instagram_conversations c
      LEFT JOIN instagram_messages m ON c.id = m.conversation_id
      GROUP BY c.id
      ORDER BY c.last_message_time DESC
      LIMIT ?
    `, [limit]);

    return conversations;
  }

  async getConversationMessages(conversationId: string): Promise<any[]> {
    return await this.db.query(`
      SELECT * FROM instagram_messages 
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
    `, [conversationId]);
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    await this.db.query(`
      UPDATE instagram_conversations 
      SET unread_count = 0, updated_at = NOW()
      WHERE id = ?
    `, [conversationId]);

    await this.db.query(`
      UPDATE instagram_messages 
      SET is_read = TRUE 
      WHERE conversation_id = ?
    `, [conversationId]);
  }
}
```

## 🔧 **Step 4: Update Frontend Hook**

```typescript
// hooks/useInstagramDM.ts - Updated to use real data
const fetchConversationsFromAPI = useCallback(async () => {
  try {
    console.log('🔍 Fetching real conversations from database...');
    
    // Call your backend API
    const response = await fetch('/api/instagram/conversations');
    const result = await response.json();
    
    if (result.success) {
      const conversations = result.data.map((conv: any) => ({
        id: conv.id,
        user: {
          id: conv.instagram_user_id,
          username: conv.instagram_username,
          name: conv.user_name,
          profile_pic: conv.profile_pic_url,
          follower_count: conv.follower_count,
          is_verified_user: conv.is_verified,
          is_user_follow_business: conv.is_user_follow_business,
          is_business_follow_user: conv.is_business_follow_user
        },
        messages: [], // Will be loaded when conversation is selected
        unread_count: conv.unread_count,
        status: conv.status,
        created_at: conv.created_at,
        updated_at: conv.updated_at
      }));

      const unreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
      
      setState(prev => ({
        ...prev,
        conversations,
        unreadCount
      }));
      
      console.log(`📊 Loaded ${conversations.length} real conversations with ${unreadCount} unread messages`);
    } else {
      console.error('❌ Failed to fetch conversations:', result.error);
      setState(prev => ({ ...prev, error: result.error }));
    }
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    setState(prev => ({ 
      ...prev, 
      error: error instanceof Error ? error.message : 'Failed to fetch conversations' 
    }));
  }
}, []);

// Add method to fetch conversation messages
const fetchConversationMessages = useCallback(async (conversationId: string) => {
  try {
    const response = await fetch(`/api/instagram/conversations/${conversationId}/messages`);
    const result = await response.json();
    
    if (result.success) {
      const messages = result.data.map((msg: any) => ({
        mid: msg.id,
        text: msg.message_text,
        timestamp: new Date(msg.timestamp).getTime(),
        from: msg.sender_id,
        attachments: JSON.parse(msg.attachments || '[]')
      }));

      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages }
            : conv
        )
      }));
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
}, []);
```

## 🔧 **Step 5: Backend API Endpoints**

```typescript
// backend/routes/instagram-api.ts
import express from 'express';
import { InstagramWebhookHandler } from '../services/instagramWebhookHandler';

const router = express.Router();
const webhookHandler = new InstagramWebhookHandler();

// Get all conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await webhookHandler.getConversations(50);
    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get conversation messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await webhookHandler.getConversationMessages(req.params.id);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark conversation as read
router.post('/conversations/:id/read', async (req, res) => {
  try {
    await webhookHandler.markConversationAsRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send message
router.post('/messages', async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const result = await instagramApiService.sendTextMessage(recipientId, text);
    
    if (result.ok) {
      // Save message to database
      await webhookHandler.saveOutgoingMessage(recipientId, text);
      res.json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

## 🚀 **Step 6: Deployment Checklist**

1. **Set up webhook URL** in Facebook Developer Console
2. **Configure database** with the provided schema
3. **Deploy backend** with webhook endpoints
4. **Update frontend** to use real API calls
5. **Test webhook** with Instagram test messages
6. **Monitor logs** for incoming messages

## 📝 **Important Notes**

- **Instagram requires user consent** - users must message your account first
- **24-hour messaging window** - you can only send messages within 24 hours of user's last message
- **Webhook verification** - Facebook will verify your webhook URL
- **Rate limits** - Instagram has API rate limits you need to respect
- **Message tags** - Use appropriate tags for messages outside 24-hour window

This implementation will give you real Instagram DMs with proper database storage, webhook processing, and a fully functional frontend interface!
