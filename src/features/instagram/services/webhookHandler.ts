// Instagram Webhook Handler
// Processes incoming Instagram messages and events

import {
  InstagramWebhook,
  InstagramMessaging,
  InstagramMessage,
  InstagramUser,
  InstagramConversation,
  AutoReplyRule,
  ApiResponse
} from '../types/instagram';
import instagramApiService from './instagramApiService';

export interface WebhookEvent {
  type: 'message' | 'postback' | 'read' | 'delivery' | 'echo';
  messaging: InstagramMessaging;
  user?: InstagramUser;
  conversation_id?: string;
}

export interface WebhookHandlerConfig {
  autoReply: boolean;
  welcomeMessage?: string;
  businessHours?: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { start: string; end: string; enabled: boolean }>;
  };
  autoReplyRules: AutoReplyRule[];
  onMessage?: (event: WebhookEvent) => void;
  onPostback?: (event: WebhookEvent) => void;
  onUserUpdate?: (user: InstagramUser) => void;
}

class InstagramWebhookHandler {
  private config: WebhookHandlerConfig;
  private conversations: Map<string, InstagramConversation> = new Map();
  private userProfiles: Map<string, InstagramUser> = new Map();

  constructor(config: WebhookHandlerConfig) {
    this.config = config;
    this.loadConversations();
  }

  private loadConversations() {
    const stored = localStorage.getItem('instagram_conversations');
    if (stored) {
      const conversations = JSON.parse(stored);
      Object.values(conversations).forEach((conv: any) => {
        this.conversations.set(conv.id, conv);
      });
    }
  }

  private saveConversations() {
    const conversationsObj: Record<string, InstagramConversation> = {};
    this.conversations.forEach((conv, id) => {
      conversationsObj[id] = conv;
    });
    localStorage.setItem('instagram_conversations', JSON.stringify(conversationsObj));
  }

  private saveUserProfile(user: InstagramUser) {
    this.userProfiles.set(user.id, user);
    const profiles: Record<string, InstagramUser> = {};
    this.userProfiles.forEach((profile, id) => {
      profiles[id] = profile;
    });
    localStorage.setItem('instagram_user_profiles', JSON.stringify(profiles));
  }

  // Main webhook processing function
  async processWebhook(webhook: InstagramWebhook): Promise<void> {
    console.log('📱 Processing Instagram webhook:', webhook);

    for (const entry of webhook.entry) {
      if (entry.messaging) {
        for (const messaging of entry.messaging) {
          await this.handleMessaging(messaging);
        }
      }

      if (entry.changes) {
        for (const change of entry.changes) {
          await this.handleChange(change);
        }
      }
    }
  }

  private async handleMessaging(messaging: InstagramMessaging): Promise<void> {
    const senderId = messaging.sender.id;
    const recipientId = messaging.recipient.id;

    // Fetch user profile if we don't have it
    if (!this.userProfiles.has(senderId)) {
      const profileResult = await instagramApiService.getUserProfile(senderId);
      if (profileResult.ok && profileResult.data) {
        this.saveUserProfile(profileResult.data);
        this.config.onUserUpdate?.(profileResult.data);
      }
    }

    const user = this.userProfiles.get(senderId);
    const conversationId = this.getOrCreateConversationId(senderId, recipientId);

    // Handle different message types
    if (messaging.message) {
      await this.handleIncomingMessage(messaging, user, conversationId);
    } else if (messaging.postback) {
      await this.handlePostback(messaging, user, conversationId);
    } else if (messaging.read) {
      await this.handleReadReceipt(messaging, conversationId);
    }
  }

  private async handleIncomingMessage(
    messaging: InstagramMessaging,
    user?: InstagramUser,
    conversationId?: string
  ): Promise<void> {
    const message = messaging.message!;
    const senderId = messaging.sender.id;

    console.log('💬 Incoming message:', {
      from: user?.username || senderId,
      text: message.text,
      hasQuickReply: !!message.quick_reply,
      hasAttachments: !!message.attachments
    });

    // Update conversation
    if (conversationId) {
      this.updateConversation(conversationId, message, user);
    }

    // Create webhook event
    const event: WebhookEvent = {
      type: 'message',
      messaging,
      user,
      conversation_id: conversationId
    };

    // Trigger callback
    this.config.onMessage?.(event);

    // Handle quick reply
    if (message.quick_reply) {
      await this.handleQuickReplyPayload(senderId, message.quick_reply.payload, user);
      return;
    }

    // Auto-reply logic
    if (this.config.autoReply && this.shouldSendAutoReply(senderId)) {
      await this.processAutoReply(senderId, message.text || '', user);
    }
  }

  private async handlePostback(
    messaging: InstagramMessaging,
    user?: InstagramUser,
    conversationId?: string
  ): Promise<void> {
    const postback = messaging.postback!;
    const senderId = messaging.sender.id;

    console.log('🔄 Postback received:', {
      from: user?.username || senderId,
      title: postback.title,
      payload: postback.payload
    });

    const event: WebhookEvent = {
      type: 'postback',
      messaging,
      user,
      conversation_id: conversationId
    };

    this.config.onPostback?.(event);

    // Handle postback payload
    await this.handlePostbackPayload(senderId, postback.payload, user);
  }

  private async handleReadReceipt(
    messaging: InstagramMessaging,
    conversationId?: string
  ): Promise<void> {
    console.log('✅ Message read by user:', messaging.sender.id);
    
    // Update conversation read status
    if (conversationId) {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.updated_at = new Date().toISOString();
        this.conversations.set(conversationId, conversation);
        this.saveConversations();
      }
    }
  }

  private async handleChange(change: any): Promise<void> {
    console.log('🔄 Instagram change notification:', change);
    // Handle mentions, comments, etc.
  }

  private getOrCreateConversationId(senderId: string, recipientId: string): string {
    const conversationId = `${senderId}_${recipientId}`;
    
    if (!this.conversations.has(conversationId)) {
      const user = this.userProfiles.get(senderId);
      const newConversation: InstagramConversation = {
        id: conversationId,
        user: user || {
          id: senderId,
          username: 'unknown',
          is_user_follow_business: false,
          is_business_follow_user: false
        },
        messages: [],
        last_message_time: Date.now(),
        unread_count: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.conversations.set(conversationId, newConversation);
      this.saveConversations();
    }
    
    return conversationId;
  }

  private updateConversation(
    conversationId: string,
    message: InstagramMessage,
    user?: InstagramUser
  ): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.last_message_time = message.timestamp;
      conversation.unread_count += 1;
      conversation.updated_at = new Date().toISOString();
      
      if (user) {
        conversation.user = user;
      }
      
      // Keep only last 100 messages to prevent memory issues
      if (conversation.messages.length > 100) {
        conversation.messages = conversation.messages.slice(-100);
      }
      
      this.conversations.set(conversationId, conversation);
      this.saveConversations();
    }
  }

  private shouldSendAutoReply(senderId: string): boolean {
    // Check business hours if enabled
    if (this.config.businessHours?.enabled) {
      const now = new Date();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'monday' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const schedule = this.config.businessHours.schedule[dayOfWeek];
      if (!schedule?.enabled) {
        return false; // Outside business hours
      }
      
      if (currentTime < schedule.start || currentTime > schedule.end) {
        return false; // Outside business hours
      }
    }

    // Check if we've already sent an auto-reply recently
    const lastAutoReply = localStorage.getItem(`last_auto_reply_${senderId}`);
    if (lastAutoReply) {
      const lastTime = parseInt(lastAutoReply);
      const timeDiff = Date.now() - lastTime;
      const hoursSinceLastReply = timeDiff / (1000 * 60 * 60);
      
      if (hoursSinceLastReply < 24) {
        return false; // Don't spam auto-replies
      }
    }

    return true;
  }

  private async processAutoReply(senderId: string, messageText: string, user?: InstagramUser): Promise<void> {
    // Check for matching auto-reply rules
    const matchingRule = this.findMatchingAutoReplyRule(messageText);
    
    if (matchingRule) {
      await this.executeAutoReplyRule(senderId, matchingRule);
    } else if (this.config.welcomeMessage) {
      // Send default welcome message
      await instagramApiService.sendTextMessage(senderId, this.config.welcomeMessage);
    }

    // Record that we sent an auto-reply
    localStorage.setItem(`last_auto_reply_${senderId}`, Date.now().toString());
  }

  private findMatchingAutoReplyRule(messageText: string): AutoReplyRule | null {
    const text = messageText.toLowerCase();
    
    return this.config.autoReplyRules
      .filter(rule => rule.is_active)
      .sort((a, b) => b.priority - a.priority) // Higher priority first
      .find(rule => 
        rule.trigger_keywords.some(keyword => 
          text.includes(keyword.toLowerCase())
        )
      ) || null;
  }

  private async executeAutoReplyRule(senderId: string, rule: AutoReplyRule): Promise<void> {
    try {
      switch (rule.response_type) {
        case 'text':
          await instagramApiService.sendTextMessage(senderId, rule.response_content as string);
          break;
          
        case 'quick_reply':
          const quickReplies = rule.response_content as any;
          await instagramApiService.sendQuickReplies(
            senderId,
            quickReplies.text || 'Please choose an option:',
            quickReplies.replies || []
          );
          break;
          
        case 'template':
          const template = rule.response_content as any;
          if (template.template_type === 'generic') {
            await instagramApiService.sendGenericTemplate(senderId, template);
          } else if (template.template_type === 'button') {
            await instagramApiService.sendButtonTemplate(senderId, template);
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error executing auto-reply rule:', error);
    }
  }

  private async handleQuickReplyPayload(senderId: string, payload: string, user?: InstagramUser): Promise<void> {
    console.log('⚡ Quick reply payload:', payload);
    
    // Handle common payloads
    switch (payload) {
      case 'GET_STARTED':
        await this.sendWelcomeFlow(senderId);
        break;
        
      case 'VIEW_PRODUCTS':
        await this.sendProductCatalog(senderId);
        break;
        
      case 'CONTACT_SUPPORT':
        await this.sendSupportOptions(senderId);
        break;
        
      case 'BUSINESS_HOURS':
        await this.sendBusinessHours(senderId);
        break;
        
      default:
        // Custom payload handling
        await this.handleCustomPayload(senderId, payload, user);
    }
  }

  private async handlePostbackPayload(senderId: string, payload: string, user?: InstagramUser): Promise<void> {
    // Similar to quick reply but from button template postbacks
    await this.handleQuickReplyPayload(senderId, payload, user);
  }

  // Predefined flows
  private async sendWelcomeFlow(senderId: string): Promise<void> {
    const welcomeTemplate = instagramApiService.createButtonTemplate(
      "Welcome! I'm here to help you with your questions. What would you like to do?",
      [
        instagramApiService.createPostbackButton("View Products", "VIEW_PRODUCTS"),
        instagramApiService.createPostbackButton("Contact Support", "CONTACT_SUPPORT"),
        instagramApiService.createWebUrlButton("Visit Website", "https://yourwebsite.com")
      ]
    );

    await instagramApiService.sendButtonTemplate(senderId, welcomeTemplate);
  }

  private async sendProductCatalog(senderId: string): Promise<void> {
    // This would integrate with your existing product system
    const productTemplate: any = {
      template_type: 'generic',
      elements: [
        {
          title: "Featured Products",
          subtitle: "Check out our latest offerings",
          image_url: "https://example.com/product1.jpg",
          buttons: [
            instagramApiService.createWebUrlButton("View Details", "https://yourstore.com/products"),
            instagramApiService.createPostbackButton("More Products", "MORE_PRODUCTS")
          ]
        }
      ]
    };

    await instagramApiService.sendGenericTemplate(senderId, productTemplate);
  }

  private async sendSupportOptions(senderId: string): Promise<void> {
    const quickReplies = [
      instagramApiService.createQuickReply("Technical Help", "TECH_SUPPORT"),
      instagramApiService.createQuickReply("Order Status", "ORDER_STATUS"),
      instagramApiService.createQuickReply("Returns", "RETURNS"),
      instagramApiService.createQuickReply("Talk to Human", "HUMAN_AGENT")
    ];

    await instagramApiService.sendQuickReplies(
      senderId,
      "How can I help you today?",
      quickReplies
    );
  }

  private async sendBusinessHours(senderId: string): Promise<void> {
    const hours = this.config.businessHours;
    if (!hours) {
      await instagramApiService.sendTextMessage(senderId, "We're available 24/7 to help you!");
      return;
    }

    let hoursText = "📅 Our business hours:\n\n";
    Object.entries(hours.schedule).forEach(([day, schedule]) => {
      if (schedule.enabled) {
        hoursText += `${day.charAt(0).toUpperCase() + day.slice(1)}: ${schedule.start} - ${schedule.end}\n`;
      } else {
        hoursText += `${day.charAt(0).toUpperCase() + day.slice(1)}: Closed\n`;
      }
    });

    hoursText += `\nTimezone: ${hours.timezone}`;
    await instagramApiService.sendTextMessage(senderId, hoursText);
  }

  private async handleCustomPayload(senderId: string, payload: string, user?: InstagramUser): Promise<void> {
    // Handle custom payloads - can be extended based on business needs
    console.log('🎯 Custom payload received:', payload);
    
    // Example: Handle product-specific queries
    if (payload.startsWith('PRODUCT_')) {
      const productId = payload.replace('PRODUCT_', '');
      await this.sendProductDetails(senderId, productId);
    } else if (payload.startsWith('CATEGORY_')) {
      const categoryId = payload.replace('CATEGORY_', '');
      await this.sendCategoryProducts(senderId, categoryId);
    } else {
      // Unknown payload
      await instagramApiService.sendTextMessage(
        senderId, 
        "I didn't understand that request. Please try again or contact our support team."
      );
    }
  }

  private async sendProductDetails(senderId: string, productId: string): Promise<void> {
    // This would integrate with your existing product data
    // For now, sending a placeholder response
    await instagramApiService.sendTextMessage(
      senderId, 
      `Here are the details for product ${productId}. You can view more information on our website.`
    );
  }

  private async sendCategoryProducts(senderId: string, categoryId: string): Promise<void> {
    // This would integrate with your existing category system
    await instagramApiService.sendTextMessage(
      senderId, 
      `Here are products in category ${categoryId}. Visit our website to see the full catalog.`
    );
  }

  // Public methods for manual message sending
  async sendMessage(recipientId: string, text: string): Promise<ApiResponse<any>> {
    return instagramApiService.sendTextMessage(recipientId, text, 'UPDATE');
  }

  async sendTemplateMessage(recipientId: string, template: any): Promise<ApiResponse<any>> {
    if (template.template_type === 'generic') {
      return instagramApiService.sendGenericTemplate(recipientId, template, 'UPDATE');
    } else if (template.template_type === 'button') {
      return instagramApiService.sendButtonTemplate(recipientId, template, 'UPDATE');
    }
    
    return { ok: false, error: 'Unknown template type' };
  }

  // Conversation management
  getConversations(): InstagramConversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.last_message_time - a.last_message_time);
  }

  getConversation(conversationId: string): InstagramConversation | undefined {
    return this.conversations.get(conversationId);
  }

  markConversationAsRead(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.unread_count = 0;
      conversation.updated_at = new Date().toISOString();
      this.conversations.set(conversationId, conversation);
      this.saveConversations();
    }
  }

  archiveConversation(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.status = 'archived';
      conversation.updated_at = new Date().toISOString();
      this.conversations.set(conversationId, conversation);
      this.saveConversations();
    }
  }

  blockUser(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.status = 'blocked';
      conversation.updated_at = new Date().toISOString();
      this.conversations.set(conversationId, conversation);
      this.saveConversations();
    }
  }

  // Configuration updates
  updateConfig(updates: Partial<WebhookHandlerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Analytics
  getAnalytics(): any {
    const conversations = this.getConversations();
    const totalConversations = conversations.length;
    const activeConversations = conversations.filter(c => c.status === 'active').length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const unreadMessages = conversations.reduce((sum, c) => sum + c.unread_count, 0);

    return {
      total_conversations: totalConversations,
      active_conversations: activeConversations,
      total_messages: totalMessages,
      unread_messages: unreadMessages,
      response_rate: totalConversations > 0 ? (totalMessages / totalConversations) : 0
    };
  }
}

export default InstagramWebhookHandler;