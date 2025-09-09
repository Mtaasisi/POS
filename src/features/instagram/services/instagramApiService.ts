// Instagram Messaging API Service
// Handles all Instagram API communication

import {
  InstagramUser,
  InstagramMessage,
  InstagramConversation,
  InstagramProfile,
  InstagramSettings,
  SendMessageRequest,
  SendMessageResponse,
  QuickReply,
  GenericTemplate,
  ButtonTemplate,
  PersistentMenu,
  IceBreaker,
  ApiResponse,
  InstagramApiError
} from '../types/instagram';

class InstagramApiService {
  private baseUrl = 'https://graph.instagram.com/v23.0';
  private accessToken: string = '';
  private instagramAccountId: string = '';

  constructor() {
    // Initialize from localStorage or environment
    this.loadConfiguration();
  }

  private loadConfiguration() {
    const settings = localStorage.getItem('instagram_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      this.accessToken = parsed.access_token || '';
      this.instagramAccountId = parsed.instagram_account_id || '';
    }
  }

  private saveConfiguration(settings: Partial<InstagramSettings>) {
    const existing = localStorage.getItem('instagram_settings');
    const current = existing ? JSON.parse(existing) : {};
    const updated = { ...current, ...settings };
    localStorage.setItem('instagram_settings', JSON.stringify(updated));
  }

  public setCredentials(accessToken: string, instagramAccountId: string) {
    this.accessToken = accessToken;
    this.instagramAccountId = instagramAccountId;
    this.saveConfiguration({ access_token: accessToken, instagram_account_id: instagramAccountId });
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {};

      // Only set Content-Type for non-GET requests to avoid CORS preflight
      if (method !== 'GET') {
        headers['Content-Type'] = 'application/json';
      }

      const config: RequestInit = {
        method,
        headers,
      };

      if (method === 'GET') {
        const params = new URLSearchParams();
        if (data) {
          Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
              params.append(key, data[key]);
            }
          });
        }
        params.append('access_token', this.accessToken);
        const finalUrl = `${url}?${params.toString()}`;
        config.method = 'GET';
        
        const response = await fetch(finalUrl, config);
        const result = await response.json();
        
        if (!response.ok) {
          return { ok: false, error: result.error?.message || 'Request failed' };
        }
        
        return { ok: true, data: result };
      } else {
        if (data) {
          config.body = JSON.stringify({ ...data, access_token: this.accessToken });
        }
        
        const response = await fetch(url, config);
        const result = await response.json();
        
        if (!response.ok) {
          return { ok: false, error: result.error?.message || 'Request failed' };
        }
        
        return { ok: true, data: result };
      }
    } catch (error) {
      console.error('Instagram API request failed:', error);
      return { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // User Profile API
  async getUserProfile(instagramScopedId: string): Promise<ApiResponse<InstagramUser>> {
    return this.makeRequest<InstagramUser>(
      `/${instagramScopedId}`,
      'GET',
      {
        fields: 'name,username,profile_pic,follower_count,is_user_follow_business,is_business_follow_user,is_verified_user'
      }
    );
  }

  // Send Messages
  async sendTextMessage(
    recipientId: string, 
    text: string, 
    messagingType: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' = 'RESPONSE'
  ): Promise<ApiResponse<SendMessageResponse>> {
    const request: SendMessageRequest = {
      recipient: { id: recipientId },
      messaging_type: messagingType,
      message: { text }
    };

    return this.makeRequest<SendMessageResponse>(
      `/${this.instagramAccountId}/messages`,
      'POST',
      request
    );
  }

  async sendQuickReplies(
    recipientId: string,
    text: string,
    quickReplies: QuickReply[],
    messagingType: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' = 'RESPONSE'
  ): Promise<ApiResponse<SendMessageResponse>> {
    const request: SendMessageRequest = {
      recipient: { id: recipientId },
      messaging_type: messagingType,
      message: {
        text,
        quick_replies: quickReplies
      }
    };

    return this.makeRequest<SendMessageResponse>(
      `/${this.instagramAccountId}/messages`,
      'POST',
      request
    );
  }

  async sendGenericTemplate(
    recipientId: string,
    template: GenericTemplate,
    messagingType: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' = 'RESPONSE'
  ): Promise<ApiResponse<SendMessageResponse>> {
    const request: SendMessageRequest = {
      recipient: { id: recipientId },
      messaging_type: messagingType,
      message: {
        attachment: {
          type: 'template',
          payload: template
        }
      }
    };

    return this.makeRequest<SendMessageResponse>(
      `/${this.instagramAccountId}/messages`,
      'POST',
      request
    );
  }

  async sendButtonTemplate(
    recipientId: string,
    template: ButtonTemplate,
    messagingType: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' = 'RESPONSE'
  ): Promise<ApiResponse<SendMessageResponse>> {
    const request: SendMessageRequest = {
      recipient: { id: recipientId },
      messaging_type: messagingType,
      message: {
        attachment: {
          type: 'template',
          payload: template
        }
      }
    };

    return this.makeRequest<SendMessageResponse>(
      `/${this.instagramAccountId}/messages`,
      'POST',
      request
    );
  }

  // Account Management
  async getAccountInfo(): Promise<ApiResponse<InstagramProfile>> {
    return this.makeRequest<InstagramProfile>(
      `/${this.instagramAccountId}`,
      'GET',
      {
        fields: 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website,account_type'
      }
    );
  }

  // Persistent Menu
  async setPersistentMenu(menu: PersistentMenu): Promise<ApiResponse<any>> {
    return this.makeRequest(
      `/${this.instagramAccountId}/messenger_profile`,
      'POST',
      {
        persistent_menu: [menu]
      }
    );
  }

  async deletePersistentMenu(): Promise<ApiResponse<any>> {
    return this.makeRequest(
      `/${this.instagramAccountId}/messenger_profile`,
      'DELETE',
      {
        fields: ['persistent_menu']
      }
    );
  }

  // Ice Breakers
  async setIceBreakers(iceBreakers: IceBreaker[]): Promise<ApiResponse<any>> {
    return this.makeRequest(
      `/${this.instagramAccountId}/messenger_profile`,
      'POST',
      {
        ice_breakers: iceBreakers
      }
    );
  }

  async deleteIceBreakers(): Promise<ApiResponse<any>> {
    return this.makeRequest(
      `/${this.instagramAccountId}/messenger_profile`,
      'DELETE',
      {
        fields: ['ice_breakers']
      }
    );
  }

  // Welcome Message
  async setWelcomeMessage(message: string): Promise<ApiResponse<any>> {
    return this.makeRequest(
      `/${this.instagramAccountId}/messenger_profile`,
      'POST',
      {
        greeting: [
          {
            locale: 'default',
            text: message
          }
        ]
      }
    );
  }

  // Get Conversations - Instagram doesn't have a conversations endpoint
  // This would typically come from webhooks or a database
  async getConversations(limit: number = 25): Promise<ApiResponse<any[]>> {
    try {
      console.log('⚠️ Instagram API: Conversations endpoint not available');
      console.log('📝 Conversations should come from webhooks or database storage');
      
      // For now, return empty array - conversations will be populated via webhooks
      return {
        ok: true,
        data: []
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        ok: false,
        error: 'Instagram conversations endpoint not available'
      };
    }
  }

  // Message Management
  async markMessageAsRead(messageId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(
      `/${this.instagramAccountId}/messages`,
      'POST',
      {
        recipient: { id: messageId },
        sender_action: 'mark_seen'
      }
    );
  }

  // Typing Indicators
  async sendTypingOn(recipientId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(
      `/${this.instagramAccountId}/messages`,
      'POST',
      {
        recipient: { id: recipientId },
        sender_action: 'typing_on'
      }
    );
  }

  async sendTypingOff(recipientId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(
      `/${this.instagramAccountId}/messages`,
      'POST',
      {
        recipient: { id: recipientId },
        sender_action: 'typing_off'
      }
    );
  }

  // Webhook Verification
  static verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
  ): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  // Helper Methods
  createQuickReply(title: string, payload: string): QuickReply {
    return {
      content_type: 'text',
      title: title.substring(0, 20), // Max 20 characters
      payload
    };
  }

  createGenericTemplateElement(
    title: string,
    subtitle?: string,
    imageUrl?: string,
    buttons?: TemplateButton[]
  ): GenericTemplateElement {
    return {
      title: title.substring(0, 80), // Max 80 characters
      subtitle: subtitle?.substring(0, 80), // Max 80 characters
      image_url: imageUrl,
      buttons: buttons?.slice(0, 3) // Max 3 buttons per element
    };
  }

  createButtonTemplate(text: string, buttons: TemplateButton[]): ButtonTemplate {
    return {
      template_type: 'button',
      text: text.substring(0, 640), // Max 640 characters
      buttons: buttons.slice(0, 3) // Max 3 buttons
    };
  }

  createWebUrlButton(title: string, url: string): TemplateButton {
    return {
      type: 'web_url',
      title: title.substring(0, 20), // Max 20 characters
      url
    };
  }

  createPostbackButton(title: string, payload: string): TemplateButton {
    return {
      type: 'postback',
      title: title.substring(0, 20), // Max 20 characters
      payload
    };
  }

  // Configuration
  isConfigured(): boolean {
    return !!(this.accessToken && this.instagramAccountId);
  }

  getConfiguration(): Partial<InstagramSettings> {
    const settings = localStorage.getItem('instagram_settings');
    return settings ? JSON.parse(settings) : {};
  }

  updateConfiguration(updates: Partial<InstagramSettings>): void {
    this.saveConfiguration(updates);
    if (updates.access_token) this.accessToken = updates.access_token;
    if (updates.instagram_account_id) this.instagramAccountId = updates.instagram_account_id;
  }
}

export default new InstagramApiService();
