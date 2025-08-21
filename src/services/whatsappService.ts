import { supabase } from '../lib/supabaseClient';

export interface WhatsAppInstance {
  id: string;
  instanceId: string;
  apiToken: string;
  phoneNumber: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'poll';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'incoming' | 'outgoing';
  metadata?: any;
}

export interface WhatsAppWebhook {
  type: 'incomingMessageReceived' | 'outgoingMessageReceived' | 'outgoingAPIMessageReceived' | 'outgoingMessageStatus' | 'stateInstanceChanged' | 'statusInstanceChanged' | 'deviceInfo' | 'incomingCall';
  timestamp: number;
  idMessage?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    sender: string;
    senderName?: string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
    extendedTextMessageData?: {
      text: string;
      description?: string;
      title?: string;
      previewType?: string;
      jpegThumbnail?: string;
    };
    imageMessageData?: {
      downloadUrl: string;
      caption?: string;
      mimeType: string;
      sha256: string;
      fileLength: number;
    };
    videoMessageData?: {
      downloadUrl: string;
      caption?: string;
      mimeType: string;
      sha256: string;
      fileLength: number;
    };
    audioMessageData?: {
      downloadUrl: string;
      mimeType: string;
      sha256: string;
      fileLength: number;
      voice: boolean;
    };
    documentMessageData?: {
      downloadUrl: string;
      caption?: string;
      mimeType: string;
      sha256: string;
      fileLength: number;
      fileName: string;
    };
    locationMessageData?: {
      nameLocation?: string;
      address?: string;
      latitude: number;
      longitude: number;
      jpegThumbnail?: string;
    };
    contactMessageData?: {
      displayName: string;
      vcard: string;
    };
    stickerMessageData?: {
      downloadUrl: string;
      mimeType: string;
      sha256: string;
      fileLength: number;
    };
    pollMessageData?: {
      name: string;
      options: string[];
      selectableOptionsCount: number;
    };
  };
  statusData?: {
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: number;
  };
  stateInstanceData?: {
    stateInstance: 'notAuthorized' | 'authorized' | 'blocked' | 'sleepMode' | 'starting';
  };
}

export class WhatsAppService {
  private instances: Map<string, WhatsAppInstance> = new Map();
  private webhookUrl: string;
  private defaultApiToken: string;
  private isInitialized = false;
  private _initializing = false; // New flag for concurrent initialization

  constructor() {
    this.webhookUrl = import.meta.env.VITE_WHATSAPP_WEBHOOK_URL || '';
    this.defaultApiToken = import.meta.env.VITE_GREEN_API_TOKEN || '';
  }

  /**
   * Initialize the WhatsApp service
   */
  async initialize() {
    // Add a more robust check to prevent multiple initializations
    if (this.isInitialized) {
      DebugUtils.initLog('WhatsApp', 'Service already initialized, skipping...');
      return;
    }
    
    // Add a flag to prevent concurrent initialization attempts
    if (this._initializing) {
      DebugUtils.initLog('WhatsApp', 'Initialization already in progress, waiting...');
      // Wait for the current initialization to complete
      while (this._initializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    this._initializing = true;
    
    try {
      DebugUtils.initLog('WhatsApp', 'Starting service initialization...');
      // Load instances from database
      await this.loadInstances();
      this.isInitialized = true;
      DebugUtils.initLog('WhatsApp', 'Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WhatsApp service:', error);
      // Don't throw the error, just log it and mark as initialized to prevent retries
      this.isInitialized = true;
    } finally {
      this._initializing = false;
    }
  }

  /**
   * Reset initialization state (for debugging purposes)
   */
  resetInitialization() {
    this.isInitialized = false;
    this._initializing = false;
    DebugUtils.initLog('WhatsApp', 'Initialization state reset');
  }

  /**
   * Get initialization status
   */
  getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this._initializing,
      instanceCount: this.instances.size
    };
  }

  /**
   * Load WhatsApp instances from database
   */
  private async loadInstances() {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.instances.clear();
      data?.forEach(instance => {
        this.instances.set(instance.instanceId, {
          id: instance.id,
          instanceId: instance.instance_id,
          apiToken: instance.api_token,
          phoneNumber: instance.phone_number,
          status: instance.status,
          qrCode: instance.qr_code,
          createdAt: instance.created_at,
          updatedAt: instance.updated_at
        });
      });
    } catch (error) {
      console.error('Error loading WhatsApp instances:', error);
      throw error;
    }
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(phoneNumber: string, apiToken?: string): Promise<WhatsAppInstance> {
    try {
      const instanceId = `instance_${Date.now()}`;
      const token = apiToken || this.defaultApiToken;
      
      if (!token) {
        throw new Error('API token is required. Please provide an API token or set VITE_GREEN_API_TOKEN in your environment variables.');
      }
      
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_id: instanceId,
          api_token: token,
          phone_number: phoneNumber,
          status: 'disconnected'
        })
        .select()
        .single();

      if (error) throw error;

      const instance: WhatsAppInstance = {
        id: data.id,
        instanceId: data.instance_id,
        apiToken: data.api_token,
        phoneNumber: data.phone_number,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      this.instances.set(instanceId, instance);
      return instance;
    } catch (error) {
      console.error('Error creating WhatsApp instance:', error);
      throw error;
    }
  }

  /**
   * Get QR code for instance authentication
   */
  async getQRCode(instanceId: string): Promise<string> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/getQrCode/${instance.apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.qrCode) {
        // Update instance with QR code
        await this.updateInstanceStatus(instanceId, 'connecting', data.qrCode);
        return data.qrCode;
      } else {
        throw new Error('QR code not received');
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  }

  /**
   * Get instance state
   */
  async getInstanceState(instanceId: string): Promise<string> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/getStateInstance/${instance.apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const state = data.stateInstance;
      
      // Update instance status based on state
      let status: WhatsAppInstance['status'] = 'disconnected';
      if (state === 'authorized') status = 'connected';
      else if (state === 'notAuthorized') status = 'disconnected';
      else if (state === 'blocked') status = 'error';
      
      await this.updateInstanceStatus(instanceId, status);
      return state;
    } catch (error) {
      console.error('Error getting instance state:', error);
      throw error;
    }
  }

  /**
   * Send text message
   */
  async sendTextMessage(instanceId: string, chatId: string, message: string): Promise<string> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendMessage/${instance.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          message: message
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Log the message
      await this.logMessage(instanceId, chatId, 'text', message, 'outgoing', 'sent');
      
      return data.idMessage;
    } catch (error) {
      console.error('Error sending text message:', error);
      await this.logMessage(instanceId, chatId, 'text', message, 'outgoing', 'failed');
      throw error;
    }
  }

  /**
   * Send file message
   */
  async sendFileMessage(instanceId: string, chatId: string, fileUrl: string, caption?: string): Promise<string> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendFileByUrl/${instance.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          urlFile: fileUrl,
          fileName: fileUrl.split('/').pop() || 'file',
          caption: caption || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Log the message
      await this.logMessage(instanceId, chatId, 'document', fileUrl, 'outgoing', 'sent', { caption });
      
      return data.idMessage;
    } catch (error) {
      console.error('Error sending file message:', error);
      await this.logMessage(instanceId, chatId, 'document', fileUrl, 'outgoing', 'failed', { caption });
      throw error;
    }
  }

  /**
   * Send location message
   */
  async sendLocationMessage(instanceId: string, chatId: string, latitude: number, longitude: number, name?: string, address?: string): Promise<string> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendLocation/${instance.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          latitude: latitude,
          longitude: longitude,
          nameLocation: name || '',
          address: address || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Log the message
      await this.logMessage(instanceId, chatId, 'location', `${latitude},${longitude}`, 'outgoing', 'sent', { name, address });
      
      return data.idMessage;
    } catch (error) {
      console.error('Error sending location message:', error);
      await this.logMessage(instanceId, chatId, 'location', `${latitude},${longitude}`, 'outgoing', 'failed', { name, address });
      throw error;
    }
  }

  /**
   * Send contact message
   */
  async sendContactMessage(instanceId: string, chatId: string, contactData: { name: string; phone: string; email?: string }): Promise<string> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contactData.name}\nTEL:${contactData.phone}\n${contactData.email ? `EMAIL:${contactData.email}\n` : ''}END:VCARD`;

      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendContact/${instance.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          contact: {
            name: contactData.name,
            phone: contactData.phone,
            email: contactData.email || ''
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Log the message
      await this.logMessage(instanceId, chatId, 'contact', contactData.name, 'outgoing', 'sent', contactData);
      
      return data.idMessage;
    } catch (error) {
      console.error('Error sending contact message:', error);
      await this.logMessage(instanceId, chatId, 'contact', contactData.name, 'outgoing', 'failed', contactData);
      throw error;
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(instanceId: string, chatId: string, count: number = 100): Promise<WhatsAppMessage[]> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/getChatHistory/${instance.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          count: count
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.map((msg: any) => ({
        id: msg.idMessage,
        chatId: msg.chatId,
        type: this.mapMessageType(msg.typeMessage),
        content: this.extractMessageContent(msg),
        timestamp: new Date(msg.timestamp * 1000).toISOString(),
        status: msg.statusMessage || 'sent',
        direction: msg.type === 'incoming' ? 'incoming' : 'outgoing',
        metadata: msg
      }));
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  /**
   * Check if a phone number is on WhatsApp
   */
  async checkWhatsApp(instanceId: string, phoneNumber: string): Promise<boolean> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/checkWhatsapp/${instance.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.existsWhatsapp;
    } catch (error) {
      console.error('Error checking WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Get contacts
   */
  async getContacts(instanceId: string): Promise<any[]> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/getContacts/${instance.apiToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting contacts:', error);
      throw error;
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(webhookData: WhatsAppWebhook): Promise<void> {
    try {
      // Log the webhook
      await this.logWebhook(webhookData);

      // Handle different webhook types
      switch (webhookData.type) {
        case 'incomingMessageReceived':
          await this.handleIncomingMessage(webhookData);
          break;
        case 'outgoingMessageStatus':
          await this.handleMessageStatus(webhookData);
          break;
        case 'stateInstanceChanged':
          await this.handleStateChange(webhookData);
          break;
        default:
          console.log('Unhandled webhook type:', webhookData.type);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(webhook: WhatsAppWebhook): Promise<void> {
    if (!webhook.messageData || !webhook.senderData) return;

    const instanceId = this.getInstanceIdFromChatId(webhook.senderData.chatId);
    if (!instanceId) return;

    const messageType = this.mapMessageType(webhook.messageData.typeMessage);
    const content = this.extractMessageContent(webhook.messageData);

    await this.logMessage(
      instanceId,
      webhook.senderData.chatId,
      messageType,
      content,
      'incoming',
      'delivered',
      webhook.messageData
    );
  }

  /**
   * Handle message status update
   */
  private async handleMessageStatus(webhook: WhatsAppWebhook): Promise<void> {
    if (!webhook.statusData || !webhook.idMessage) return;

    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({
          status: webhook.statusData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', webhook.idMessage);

      if (error) {
        console.error('Error updating message status:', error);
      }
    } catch (error) {
      console.error('Error handling message status:', error);
    }
  }

  /**
   * Handle instance state change
   */
  private async handleStateChange(webhook: WhatsAppWebhook): Promise<void> {
    if (!webhook.stateInstanceData) return;

    const instanceId = this.getInstanceIdFromWebhook(webhook);
    if (!instanceId) return;

    let status: WhatsAppInstance['status'] = 'disconnected';
    if (webhook.stateInstanceData.stateInstance === 'authorized') status = 'connected';
    else if (webhook.stateInstanceData.stateInstance === 'notAuthorized') status = 'disconnected';
    else if (webhook.stateInstanceData.stateInstance === 'blocked') status = 'error';

    await this.updateInstanceStatus(instanceId, status);
  }

  /**
   * Update instance status
   */
  private async updateInstanceStatus(instanceId: string, status: WhatsAppInstance['status'], qrCode?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (qrCode) {
        updateData.qr_code = qrCode;
      }

      const { error } = await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('instance_id', instanceId);

      if (error) throw error;

      // Update local cache
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.status = status;
        if (qrCode) instance.qrCode = qrCode;
        instance.updatedAt = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error updating instance status:', error);
      throw error;
    }
  }

  /**
   * Log message to database
   */
  private async logMessage(
    instanceId: string,
    chatId: string,
    type: WhatsAppMessage['type'],
    content: string,
    direction: WhatsAppMessage['direction'],
    status: WhatsAppMessage['status'],
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .insert({
          instance_id: instanceId,
          chat_id: chatId,
          type,
          content,
          direction,
          status,
          metadata,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging message:', error);
      throw error;
    }
  }

  /**
   * Log webhook to database
   */
  private async logWebhook(webhook: WhatsAppWebhook): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_webhooks')
        .insert({
          type: webhook.type,
          payload: webhook,
          processed: false,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging webhook:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private mapMessageType(typeMessage: string): WhatsAppMessage['type'] {
    switch (typeMessage) {
      case 'textMessage':
      case 'extendedTextMessage':
        return 'text';
      case 'imageMessage':
        return 'image';
      case 'videoMessage':
        return 'video';
      case 'audioMessage':
        return 'audio';
      case 'documentMessage':
        return 'document';
      case 'locationMessage':
        return 'location';
      case 'contactMessage':
        return 'contact';
      case 'stickerMessage':
        return 'sticker';
      case 'pollMessage':
        return 'poll';
      default:
        return 'text';
    }
  }

  private extractMessageContent(messageData: any): string {
    if (messageData.textMessageData) {
      return messageData.textMessageData.textMessage;
    }
    if (messageData.extendedTextMessageData) {
      return messageData.extendedTextMessageData.text;
    }
    if (messageData.imageMessageData) {
      return messageData.imageMessageData.caption || '[Image]';
    }
    if (messageData.videoMessageData) {
      return messageData.videoMessageData.caption || '[Video]';
    }
    if (messageData.audioMessageData) {
      return '[Audio]';
    }
    if (messageData.documentMessageData) {
      return messageData.documentMessageData.caption || `[Document: ${messageData.documentMessageData.fileName}]`;
    }
    if (messageData.locationMessageData) {
      return `[Location: ${messageData.locationMessageData.nameLocation || 'Unknown'}]`;
    }
    if (messageData.contactMessageData) {
      return `[Contact: ${messageData.contactMessageData.displayName}]`;
    }
    if (messageData.stickerMessageData) {
      return '[Sticker]';
    }
    if (messageData.pollMessageData) {
      return `[Poll: ${messageData.pollMessageData.name}]`;
    }
    return '[Unknown message type]';
  }

  private getInstanceIdFromChatId(chatId: string): string | null {
    // Extract instance ID from chat ID or find the active instance
    for (const [instanceId, instance] of this.instances) {
      if (instance.status === 'connected') {
        return instanceId;
      }
    }
    return null;
  }

  private getInstanceIdFromWebhook(webhook: WhatsAppWebhook): string | null {
    // This would need to be implemented based on how you identify which instance the webhook belongs to
    // For now, return the first connected instance
    for (const [instanceId, instance] of this.instances) {
      if (instance.status === 'connected') {
        return instanceId;
      }
    }
    return null;
  }

  /**
   * Get all instances
   */
  getInstances(): WhatsAppInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): WhatsAppInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Delete instance
   */
  async deleteInstance(instanceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('instance_id', instanceId);

      if (error) throw error;

      this.instances.delete(instanceId);
    } catch (error) {
      console.error('Error deleting instance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();
