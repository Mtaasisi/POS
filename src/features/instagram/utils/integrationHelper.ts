// Instagram Integration Helper
// Utilities for integrating Instagram DM with existing app features

import { InstagramConversation, InstagramUser } from '../types/instagram';

/**
 * Integration utilities for connecting Instagram DM with existing app features
 */

// Customer integration - link Instagram users to existing customers
export interface CustomerInstagramLink {
  customer_id: string;
  instagram_user_id: string;
  instagram_username: string;
  linked_at: string;
  verified: boolean;
}

export class InstagramAppIntegration {
  
  /**
   * Link Instagram user to existing customer
   */
  static async linkToCustomer(
    instagramUser: InstagramUser, 
    customerId: string
  ): Promise<CustomerInstagramLink> {
    const link: CustomerInstagramLink = {
      customer_id: customerId,
      instagram_user_id: instagramUser.id,
      instagram_username: instagramUser.username,
      linked_at: new Date().toISOString(),
      verified: instagramUser.is_verified_user || false
    };

    // Store in your existing customer management system
    // This would integrate with your customer data provider
    localStorage.setItem(
      `customer_instagram_${customerId}`, 
      JSON.stringify(link)
    );

    return link;
  }

  /**
   * Find customer by Instagram user
   */
  static findCustomerByInstagramUser(instagramUserId: string): CustomerInstagramLink | null {
    // Search through your customer database
    // This is a simplified example using localStorage
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('customer_instagram_')) {
        const link = JSON.parse(localStorage.getItem(key) || '{}');
        if (link.instagram_user_id === instagramUserId) {
          return link;
        }
      }
    }
    
    return null;
  }

  /**
   * Create product showcase message for Instagram
   */
  static createProductShowcase(products: any[]): any {
    const elements = products.slice(0, 10).map(product => ({
      title: product.name.substring(0, 80),
      subtitle: `${product.priceRange} • ${product.category?.name || 'Product'}`,
      image_url: product.images?.[0] || undefined,
      buttons: [
        {
          type: 'web_url',
          title: 'View Details',
          url: `${window.location.origin}/products/${product.id}`
        },
        {
          type: 'postback',
          title: 'More Info',
          payload: `PRODUCT_${product.id}`
        }
      ]
    }));

    return {
      template_type: 'generic',
      elements
    };
  }

  /**
   * Create order status template
   */
  static createOrderStatusTemplate(orderId: string, status: string, trackingInfo?: string): any {
    const buttons = [
      {
        type: 'postback',
        title: 'Order Details',
        payload: `ORDER_${orderId}`
      }
    ];

    if (trackingInfo) {
      buttons.push({
        type: 'web_url',
        title: 'Track Package',
        url: trackingInfo
      });
    }

    return {
      template_type: 'button',
      text: `Your order #${orderId} is ${status}. ${trackingInfo ? 'You can track your package using the link below.' : 'We\'ll notify you when it ships.'}`,
      buttons
    };
  }

  /**
   * Create support ticket from Instagram conversation
   */
  static createSupportTicket(conversation: InstagramConversation): any {
    return {
      type: 'instagram_dm',
      customer: {
        name: conversation.user.name || conversation.user.username,
        username: conversation.user.username,
        instagram_id: conversation.user.id,
        follower_count: conversation.user.follower_count,
        is_verified: conversation.user.is_verified_user
      },
      conversation_id: conversation.id,
      messages: conversation.messages.map(msg => ({
        text: msg.text,
        timestamp: msg.timestamp,
        attachments: msg.attachments?.length || 0
      })),
      priority: conversation.user.is_verified_user ? 'high' : 'normal',
      created_at: conversation.created_at
    };
  }

  /**
   * Generate business hours message
   */
  static generateBusinessHoursMessage(businessHours: any): string {
    if (!businessHours?.enabled) {
      return "We're available 24/7 to help you! Feel free to send us a message anytime.";
    }

    let message = "📅 Our business hours:\n\n";
    
    Object.entries(businessHours.schedule).forEach(([day, schedule]: [string, any]) => {
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      if (schedule.enabled) {
        message += `${dayName}: ${schedule.start} - ${schedule.end}\n`;
      } else {
        message += `${dayName}: Closed\n`;
      }
    });

    message += `\n🌍 Timezone: ${businessHours.timezone}`;
    message += "\n\nWe'll respond to your message as soon as possible during business hours!";

    return message;
  }

  /**
   * Integration with existing notification system
   */
  static createNotification(conversation: InstagramConversation, message: any): any {
    return {
      type: 'instagram_dm',
      title: `New Instagram message from @${conversation.user.username}`,
      message: message.text || 'New message received',
      user: {
        name: conversation.user.name || conversation.user.username,
        avatar: conversation.user.profile_pic,
        username: conversation.user.username
      },
      action_url: `/instagram-dm?conversation=${conversation.id}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if business hours are active
   */
  static isBusinessHoursActive(businessHours: any): boolean {
    if (!businessHours?.enabled) return true;

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'monday' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const schedule = businessHours.schedule[dayOfWeek];
    if (!schedule?.enabled) return false;
    
    return currentTime >= schedule.start && currentTime <= schedule.end;
  }

  /**
   * Generate automated response based on context
   */
  static generateContextualResponse(messageText: string, userProfile: InstagramUser): string {
    const text = messageText.toLowerCase();
    
    // Greeting responses
    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      return `Hi ${userProfile.name || userProfile.username}! 👋 Thanks for reaching out. How can I help you today?`;
    }
    
    // Product inquiries
    if (text.includes('product') || text.includes('price') || text.includes('buy')) {
      return "I'd be happy to help you with product information! You can browse our catalog or let me know what specific item you're looking for.";
    }
    
    // Support requests
    if (text.includes('help') || text.includes('support') || text.includes('problem')) {
      return "I'm here to help! Please describe the issue you're experiencing and I'll do my best to assist you.";
    }
    
    // Order related
    if (text.includes('order') || text.includes('shipping') || text.includes('delivery')) {
      return "For order and shipping inquiries, I can help you check your order status. Do you have an order number?";
    }
    
    // Default response
    return "Thanks for your message! I'll get back to you as soon as possible. Is there anything specific I can help you with?";
  }

  /**
   * Create integration status report
   */
  static getIntegrationStatus(): any {
    const instagramSettings = localStorage.getItem('instagram_settings');
    const conversations = localStorage.getItem('instagram_conversations');
    const autoReplyRules = localStorage.getItem('instagram_auto_reply_rules');
    
    return {
      instagram_connected: !!instagramSettings,
      has_conversations: !!conversations,
      auto_reply_configured: !!autoReplyRules,
      webhook_configured: false, // Would check server-side
      last_sync: new Date().toISOString(),
      features: {
        messaging: true,
        auto_reply: true,
        templates: true,
        analytics: true,
        user_profiles: true
      }
    };
  }
}

export default InstagramAppIntegration;