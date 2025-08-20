import { supabase } from '../lib/supabaseClient';

interface ChromeExtensionMessage {
  type: 'message' | 'status' | 'contact' | 'order';
  data: any;
  timestamp: number;
  chatId?: string;
  customerId?: string;
}

interface WhatsAppMessage {
  id: string;
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  timestamp: number;
  isFromMe: boolean;
  customerPhone?: string;
  customerName?: string;
}

class ChromeExtensionService {
  private apiKey: string = '1755675069644-f5ab0e92276f1e3332d41ece111c6201';
  private baseUrl: string = 'https://api.whatsapp.com/v1';
  private isConnected: boolean = false;
  private messageQueue: ChromeExtensionMessage[] = [];
  private processingQueue: boolean = false;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Test connection with your API key
      const response = await fetch(`${this.baseUrl}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Chrome extension connected successfully');
        this.startMessageProcessing();
      } else {
        console.error('❌ Failed to connect Chrome extension');
      }
    } catch (error) {
      console.error('❌ Chrome extension connection error:', error);
    }
  }

  // Process incoming messages from Chrome extension
  async processIncomingMessage(message: ChromeExtensionMessage) {
    try {
      switch (message.type) {
        case 'message':
          await this.handleNewMessage(message.data);
          break;
        case 'status':
          await this.handleStatusUpdate(message.data);
          break;
        case 'contact':
          await this.handleContactUpdate(message.data);
          break;
        case 'order':
          await this.handleOrderRequest(message.data);
          break;
        default:
          console.warn('⚠️ Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error processing Chrome extension message:', error);
    }
  }

  // Handle new WhatsApp messages
  private async handleNewMessage(data: any) {
    const message: WhatsAppMessage = {
      id: data.id,
      chatId: data.chatId,
      content: data.content,
      type: data.type || 'text',
      timestamp: data.timestamp,
      isFromMe: data.isFromMe,
      customerPhone: data.customerPhone,
      customerName: data.customerName
    };

    // Store message in database
    await this.storeMessage(message);

    // Auto-process based on content
    await this.autoProcessMessage(message);
  }

  // Store message in database
  private async storeMessage(message: WhatsAppMessage) {
    try {
      // Try to insert with all columns first (for when migration is complete)
      let insertData: any = {
        chat_id: message.chatId,
        content: message.content,
        message_type: message.type
      };

      // Add optional columns if they exist
      try {
        // Test if additional columns exist by attempting to insert them
        const fullData = {
          ...insertData,
          message_id: message.id,
          message_timestamp: new Date(message.timestamp),
          is_from_me: message.isFromMe,
          customer_phone: message.customerPhone,
          customer_name: message.customerName
        };

        const { error: fullError } = await supabase
          .from('whatsapp_messages')
          .insert(fullData);

        if (!fullError) {
          console.log('✅ Message stored with full data');
          return;
        } else {
          // If full insert fails, fall back to basic insert
          console.log('⚠️ Full insert failed, using basic insert');
        }
      } catch (err) {
        console.log('⚠️ Full insert not available, using basic insert');
      }

      // Basic insert with only required columns
      const { error } = await supabase
        .from('whatsapp_messages')
        .insert(insertData);

      if (error) {
        console.error('❌ Error storing message:', error);
      } else {
        console.log('✅ Message stored successfully (basic)');
      }
    } catch (error) {
      console.error('❌ Database error:', error);
    }
  }

  // Auto-process messages based on content
  private async autoProcessMessage(message: WhatsAppMessage) {
    const content = message.content.toLowerCase();

    // Order inquiries
    if (content.includes('order') || content.includes('buy') || content.includes('price')) {
      await this.handleOrderInquiry(message);
    }

    // Support requests
    if (content.includes('help') || content.includes('support') || content.includes('problem')) {
      await this.handleSupportRequest(message);
    }

    // Appointment requests
    if (content.includes('appointment') || content.includes('book') || content.includes('schedule')) {
      await this.handleAppointmentRequest(message);
    }

    // Payment inquiries
    if (content.includes('payment') || content.includes('pay') || content.includes('mpesa')) {
      await this.handlePaymentInquiry(message);
    }
  }

  // Handle order inquiries
  private async handleOrderInquiry(message: WhatsAppMessage) {
    try {
      // Create support ticket
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          customer_phone: message.customerPhone,
          customer_name: message.customerName,
          issue_type: 'order_inquiry',
          description: message.content,
          source: 'whatsapp',
          status: 'new'
        });

      if (!error) {
        // Send auto-reply
        await this.sendAutoReply(message.chatId, 
          "Thank you for your inquiry! Our team will assist you with your order. You'll receive a response shortly.");
      }
    } catch (error) {
      console.error('❌ Error handling order inquiry:', error);
    }
  }

  // Handle support requests
  private async handleSupportRequest(message: WhatsAppMessage) {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          customer_phone: message.customerPhone,
          customer_name: message.customerName,
          issue_type: 'support',
          description: message.content,
          source: 'whatsapp',
          status: 'new'
        });

      if (!error) {
        await this.sendAutoReply(message.chatId,
          "We're here to help! Your support request has been logged and our team will contact you soon.");
      }
    } catch (error) {
      console.error('❌ Error handling support request:', error);
    }
  }

  // Handle appointment requests
  private async handleAppointmentRequest(message: WhatsAppMessage) {
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          customer_phone: message.customerPhone,
          customer_name: message.customerName,
          description: message.content,
          source: 'whatsapp',
          status: 'pending'
        });

      if (!error) {
        await this.sendAutoReply(message.chatId,
          "Thank you for requesting an appointment! We'll contact you to confirm the details.");
      }
    } catch (error) {
      console.error('❌ Error handling appointment request:', error);
    }
  }

  // Handle payment inquiries
  private async handlePaymentInquiry(message: WhatsAppMessage) {
    try {
      await this.sendAutoReply(message.chatId,
        "We accept M-Pesa, Cash, and Card payments. For M-Pesa, please use our Paybill number: 123456");
    } catch (error) {
      console.error('❌ Error handling payment inquiry:', error);
    }
  }

  // Send auto-reply
  private async sendAutoReply(chatId: string, message: string) {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId,
          message,
          type: 'text'
        })
      });

      if (response.ok) {
        console.log('✅ Auto-reply sent successfully');
      } else {
        console.error('❌ Failed to send auto-reply');
      }
    } catch (error) {
      console.error('❌ Error sending auto-reply:', error);
    }
  }

  // Start message processing queue
  private startMessageProcessing() {
    setInterval(() => {
      if (this.messageQueue.length > 0 && !this.processingQueue) {
        this.processMessageQueue();
      }
    }, 1000);
  }

  // Process message queue
  private async processMessageQueue() {
    this.processingQueue = true;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.processIncomingMessage(message);
      }
    }
    
    this.processingQueue = false;
  }

  // Add message to queue
  addMessageToQueue(message: ChromeExtensionMessage) {
    this.messageQueue.push(message);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      queueLength: this.messageQueue.length,
      apiKey: this.apiKey ? 'Configured' : 'Not configured'
    };
  }

  // Send message through Chrome extension
  async sendMessage(chatId: string, message: string, type: string = 'text') {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId,
          message,
          type
        })
      });

      if (response.ok) {
        console.log('✅ Message sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send message');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }
}

export const chromeExtensionService = new ChromeExtensionService();
