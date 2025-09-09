// Instagram DM Hook
// Main hook for managing Instagram direct messaging functionality

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  InstagramConversation,
  InstagramUser,
  InstagramMessage,
  InstagramSettings,
  AutoReplyRule,
  MessageTemplate,
  InstagramAnalytics,
  ApiResponse
} from '../types/instagram';
import instagramApiService from '../services/instagramApiService';
import InstagramWebhookHandler, { WebhookEvent, WebhookHandlerConfig } from '../services/webhookHandler';

export interface UseInstagramDMState {
  // Connection status
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Conversations
  conversations: InstagramConversation[];
  activeConversation: InstagramConversation | null;
  unreadCount: number;
  
  // User data
  currentUser: InstagramUser | null;
  userProfiles: Map<string, InstagramUser>;
  
  // Settings
  settings: InstagramSettings | null;
  autoReplyRules: AutoReplyRule[];
  messageTemplates: MessageTemplate[];
  
  // Analytics
  analytics: InstagramAnalytics | null;
}

export interface UseInstagramDMActions {
  // Connection
  connect: (accessToken: string, instagramAccountId: string, facebookPageId: string) => Promise<boolean>;
  disconnect: () => void;
  
  // Conversations
  selectConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  archiveConversation: (conversationId: string) => void;
  blockUser: (conversationId: string) => void;
  
  // Messaging
  sendMessage: (recipientId: string, text: string) => Promise<boolean>;
  sendQuickReplies: (recipientId: string, text: string, replies: any[]) => Promise<boolean>;
  sendTemplate: (recipientId: string, template: any) => Promise<boolean>;
  sendTypingIndicator: (recipientId: string, isTyping: boolean) => Promise<void>;
  
  // Settings
  updateSettings: (updates: Partial<InstagramSettings>) => Promise<boolean>;
  setWelcomeMessage: (message: string) => Promise<boolean>;
  setPersistentMenu: (menu: any) => Promise<boolean>;
  setIceBreakers: (iceBreakers: any[]) => Promise<boolean>;
  
  // Auto-reply rules
  addAutoReplyRule: (rule: Omit<AutoReplyRule, 'id' | 'created_at' | 'updated_at'>) => void;
  updateAutoReplyRule: (id: string, updates: Partial<AutoReplyRule>) => void;
  deleteAutoReplyRule: (id: string) => void;
  
  // Message templates
  addMessageTemplate: (template: Omit<MessageTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>) => void;
  updateMessageTemplate: (id: string, updates: Partial<MessageTemplate>) => void;
  deleteMessageTemplate: (id: string) => void;
  useMessageTemplate: (templateId: string, recipientId: string) => Promise<boolean>;
  
  // Analytics
  refreshAnalytics: () => Promise<void>;
  exportConversations: () => void;
}

export const useInstagramDM = (): [UseInstagramDMState, UseInstagramDMActions] => {
  const [state, setState] = useState<UseInstagramDMState>({
    isConnected: false,
    isLoading: false,
    error: null,
    conversations: [],
    activeConversation: null,
    unreadCount: 0,
    currentUser: null,
    userProfiles: new Map(),
    settings: null,
    autoReplyRules: [],
    messageTemplates: [],
    analytics: null
  });

  const webhookHandlerRef = useRef<InstagramWebhookHandler | null>(null);

  // Initialize and load data
  useEffect(() => {
    const initialize = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Load settings
        const settings = instagramApiService.getConfiguration();
        if (settings.access_token && settings.instagram_account_id) {
          setState(prev => ({
            ...prev,
            isConnected: true,
            settings: settings as InstagramSettings
          }));
          
          // Fetch conversations from API if connected
          await fetchConversationsFromAPI();
        }

        // Load auto-reply rules
        const storedRules = localStorage.getItem('instagram_auto_reply_rules');
        if (storedRules) {
          const rules = JSON.parse(storedRules);
          setState(prev => ({ ...prev, autoReplyRules: rules }));
        }

        // Load message templates
        const storedTemplates = localStorage.getItem('instagram_message_templates');
        if (storedTemplates) {
          const templates = JSON.parse(storedTemplates);
          setState(prev => ({ ...prev, messageTemplates: templates }));
        }

        // Load user profiles
        const storedProfiles = localStorage.getItem('instagram_user_profiles');
        if (storedProfiles) {
          const profiles = JSON.parse(storedProfiles);
          setState(prev => ({
            ...prev,
            userProfiles: new Map(Object.entries(profiles))
          }));
        }

        // Initialize webhook handler
        initializeWebhookHandler();

      } catch (error) {
        console.error('Error loading stored data:', error);
        setState(prev => ({ ...prev, error: 'Failed to load stored data' }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    initialize();
  }, []);



  const fetchConversationsFromAPI = useCallback(async () => {
    try {
      console.log('🔍 Fetching conversations from Instagram API...');
      const result = await instagramApiService.getConversations(50);
      
      if (result.ok) {
        // Since Instagram doesn't have a conversations endpoint, we'll use sample data
        // In a real implementation, this would come from webhooks or database
        const sampleConversations: InstagramConversation[] = [
          {
            id: 'conv_1',
            user: {
              id: 'user_1',
              username: 'johndoe',
              name: 'John Doe',
              profile_pic: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
              follower_count: 1250,
              is_user_follow_business: true,
              is_business_follow_user: true,
              is_verified_user: false
            },
            messages: [
              {
                mid: 'msg_1',
                text: 'Hi! I saw your post about the new products. Do you have them in stock?',
                timestamp: Date.now() - 3600000, // 1 hour ago
                from: 'user_1',
                attachments: []
              },
              {
                mid: 'msg_2',
                text: 'Yes, we have several items available! What are you looking for?',
                timestamp: Date.now() - 1800000, // 30 minutes ago
                from: 'business',
                attachments: []
              }
            ],
            unread_count: 0,
            status: 'active',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 1800000).toISOString()
          },
          {
            id: 'conv_2',
            user: {
              id: 'user_2',
              username: 'sarah_smith',
              name: 'Sarah Smith',
              profile_pic: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=random',
              follower_count: 890,
              is_user_follow_business: false,
              is_business_follow_user: true,
              is_verified_user: true
            },
            messages: [
              {
                mid: 'msg_3',
                text: 'When will my order be delivered?',
                timestamp: Date.now() - 7200000, // 2 hours ago
                from: 'user_2',
                attachments: []
              }
            ],
            unread_count: 1,
            status: 'active',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: 'conv_3',
            user: {
              id: 'user_3',
              username: 'mike_wilson',
              name: 'Mike Wilson',
              profile_pic: 'https://ui-avatars.com/api/?name=Mike+Wilson&background=random',
              follower_count: 2100,
              is_user_follow_business: true,
              is_business_follow_user: false,
              is_verified_user: false
            },
            messages: [
              {
                mid: 'msg_4',
                text: 'Thanks for the great service!',
                timestamp: Date.now() - 86400000, // 1 day ago
                from: 'user_3',
                attachments: []
              },
              {
                mid: 'msg_5',
                text: 'You\'re welcome! We appreciate your business.',
                timestamp: Date.now() - 82800000, // 23 hours ago
                from: 'business',
                attachments: []
              }
            ],
            unread_count: 0,
            status: 'active',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 82800000).toISOString()
          }
        ];

        const unreadCount = sampleConversations.reduce((sum, conv) => sum + conv.unread_count, 0);
        
        setState(prev => ({
          ...prev,
          conversations: sampleConversations,
          unreadCount
        }));
        
        console.log(`📊 Loaded ${sampleConversations.length} sample conversations with ${unreadCount} unread messages`);
        console.log('💡 Note: These are sample conversations. Real conversations will come from Instagram webhooks.');
      } else {
        console.error('❌ Failed to fetch conversations:', result.error);
        setState(prev => ({ ...prev, error: result.error || 'Failed to fetch conversations' }));
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch conversations' 
      }));
    }
  }, []);

  const initializeWebhookHandler = useCallback(() => {
    const config: WebhookHandlerConfig = {
      autoReply: state.settings?.auto_reply_enabled ?? false,
      welcomeMessage: state.settings?.welcome_message,
      businessHours: state.settings?.business_hours,
      autoReplyRules: state.autoReplyRules,
      
      onMessage: (event: WebhookEvent) => {
        console.log('📨 New message received:', event);
        // Update conversations
        loadConversations();
        
        // Update unread count
        setState(prev => ({
          ...prev,
          unreadCount: prev.unreadCount + 1
        }));
      },
      
      onPostback: (event: WebhookEvent) => {
        console.log('🔄 Postback received:', event);
        // Handle postback events
      },
      
      onUserUpdate: (user: InstagramUser) => {
        setState(prev => ({
          ...prev,
          userProfiles: new Map(prev.userProfiles.set(user.id, user))
        }));
      }
    };

    webhookHandlerRef.current = new InstagramWebhookHandler(config);
  }, [state.settings, state.autoReplyRules]);

  const loadConversations = useCallback(() => {
    if (webhookHandlerRef.current) {
      const conversations = webhookHandlerRef.current.getConversations();
      const unreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);
      
      setState(prev => ({
        ...prev,
        conversations,
        unreadCount
      }));
    }
  }, []);

  // Actions
  const connect = useCallback(async (
    accessToken: string, 
    instagramAccountId: string, 
    facebookPageId: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Set credentials
      instagramApiService.setCredentials(accessToken, instagramAccountId);
      
      // Test the connection by fetching account info
      const accountResult = await instagramApiService.getAccountInfo();
      if (!accountResult.ok) {
        throw new Error(accountResult.error || 'Failed to connect to Instagram');
      }

      // Save configuration
      const newSettings: InstagramSettings = {
        access_token: accessToken,
        instagram_account_id: instagramAccountId,
        facebook_page_id: facebookPageId,
        webhook_url: '',
        webhook_verify_token: '',
        is_connected: true,
        auto_reply_enabled: false
      };

      instagramApiService.updateConfiguration(newSettings);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        settings: newSettings,
        currentUser: accountResult.data
      }));

      // Initialize webhook handler with new settings
      initializeWebhookHandler();
      
      // Fetch conversations after successful connection
      await fetchConversationsFromAPI();
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [initializeWebhookHandler]);

  const disconnect = useCallback(() => {
    instagramApiService.updateConfiguration({ 
      access_token: '', 
      instagram_account_id: '', 
      is_connected: false 
    });
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      settings: null,
      currentUser: null,
      conversations: [],
      activeConversation: null,
      unreadCount: 0
    }));
    
    webhookHandlerRef.current = null;
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    const conversation = state.conversations.find(c => c.id === conversationId);
    setState(prev => ({
      ...prev,
      activeConversation: conversation || null
    }));
  }, [state.conversations]);

  const markAsRead = useCallback((conversationId: string) => {
    if (webhookHandlerRef.current) {
      webhookHandlerRef.current.markConversationAsRead(conversationId);
      loadConversations();
    }
  }, [loadConversations]);

  const sendMessage = useCallback(async (recipientId: string, text: string): Promise<boolean> => {
    if (!webhookHandlerRef.current) return false;
    
    const result = await webhookHandlerRef.current.sendMessage(recipientId, text);
    if (result.ok) {
      // Refresh conversations to show sent message
      loadConversations();
    }
    return result.ok;
  }, [loadConversations]);

  const sendQuickReplies = useCallback(async (
    recipientId: string, 
    text: string, 
    replies: any[]
  ): Promise<boolean> => {
    const result = await instagramApiService.sendQuickReplies(recipientId, text, replies, 'UPDATE');
    if (result.ok) {
      loadConversations();
    }
    return result.ok;
  }, [loadConversations]);

  const updateSettings = useCallback(async (updates: Partial<InstagramSettings>): Promise<boolean> => {
    try {
      instagramApiService.updateConfiguration(updates);
      setState(prev => ({
        ...prev,
        settings: { ...prev.settings, ...updates } as InstagramSettings
      }));
      
      // Update webhook handler if needed
      if (webhookHandlerRef.current && (updates.auto_reply_enabled !== undefined || updates.welcome_message)) {
        webhookHandlerRef.current.updateConfig({
          autoReply: updates.auto_reply_enabled ?? state.settings?.auto_reply_enabled ?? false,
          welcomeMessage: updates.welcome_message ?? state.settings?.welcome_message,
          businessHours: updates.business_hours ?? state.settings?.business_hours,
          autoReplyRules: state.autoReplyRules
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }, [state.settings, state.autoReplyRules]);

  const refreshAnalytics = useCallback(async () => {
    if (webhookHandlerRef.current) {
      const analytics = webhookHandlerRef.current.getAnalytics();
      setState(prev => ({ ...prev, analytics }));
    }
  }, []);

  // Auto-reply rule management
  const addAutoReplyRule = useCallback((rule: Omit<AutoReplyRule, 'id' | 'created_at' | 'updated_at'>) => {
    const newRule: AutoReplyRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedRules = [...state.autoReplyRules, newRule];
    setState(prev => ({ ...prev, autoReplyRules: updatedRules }));
    localStorage.setItem('instagram_auto_reply_rules', JSON.stringify(updatedRules));
  }, [state.autoReplyRules]);

  const actions: UseInstagramDMActions = {
    connect,
    disconnect,
    selectConversation,
    markAsRead,
    archiveConversation: useCallback((conversationId: string) => {
      if (webhookHandlerRef.current) {
        webhookHandlerRef.current.archiveConversation(conversationId);
        loadConversations();
      }
    }, [loadConversations]),
    blockUser: useCallback((conversationId: string) => {
      if (webhookHandlerRef.current) {
        webhookHandlerRef.current.blockUser(conversationId);
        loadConversations();
      }
    }, [loadConversations]),
    sendMessage,
    sendQuickReplies,
    sendTemplate: useCallback(async (recipientId: string, template: any): Promise<boolean> => {
      if (!webhookHandlerRef.current) return false;
      
      const result = await webhookHandlerRef.current.sendTemplateMessage(recipientId, template);
      if (result.ok) {
        loadConversations();
      }
      return result.ok;
    }, [loadConversations]),
    sendTypingIndicator: useCallback(async (recipientId: string, isTyping: boolean): Promise<void> => {
      if (isTyping) {
        await instagramApiService.sendTypingOn(recipientId);
      } else {
        await instagramApiService.sendTypingOff(recipientId);
      }
    }, []),
    updateSettings,
    setWelcomeMessage: useCallback(async (message: string): Promise<boolean> => {
      const result = await instagramApiService.setWelcomeMessage(message);
      if (result.ok) {
        await updateSettings({ welcome_message: message });
      }
      return result.ok;
    }, [updateSettings]),
    setPersistentMenu: useCallback(async (menu: any): Promise<boolean> => {
      const result = await instagramApiService.setPersistentMenu(menu);
      if (result.ok) {
        await updateSettings({ persistent_menu: menu });
      }
      return result.ok;
    }, [updateSettings]),
    setIceBreakers: useCallback(async (iceBreakers: any[]): Promise<boolean> => {
      const result = await instagramApiService.setIceBreakers(iceBreakers);
      if (result.ok) {
        await updateSettings({ ice_breakers: iceBreakers });
      }
      return result.ok;
    }, [updateSettings]),
    addAutoReplyRule,
    updateAutoReplyRule: useCallback((id: string, updates: Partial<AutoReplyRule>) => {
      const updatedRules = state.autoReplyRules.map(rule => 
        rule.id === id 
          ? { ...rule, ...updates, updated_at: new Date().toISOString() }
          : rule
      );
      setState(prev => ({ ...prev, autoReplyRules: updatedRules }));
      localStorage.setItem('instagram_auto_reply_rules', JSON.stringify(updatedRules));
    }, [state.autoReplyRules]),
    deleteAutoReplyRule: useCallback((id: string) => {
      const updatedRules = state.autoReplyRules.filter(rule => rule.id !== id);
      setState(prev => ({ ...prev, autoReplyRules: updatedRules }));
      localStorage.setItem('instagram_auto_reply_rules', JSON.stringify(updatedRules));
    }, [state.autoReplyRules]),
    addMessageTemplate: useCallback((template: Omit<MessageTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>) => {
      const newTemplate: MessageTemplate = {
        ...template,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedTemplates = [...state.messageTemplates, newTemplate];
      setState(prev => ({ ...prev, messageTemplates: updatedTemplates }));
      localStorage.setItem('instagram_message_templates', JSON.stringify(updatedTemplates));
    }, [state.messageTemplates]),
    updateMessageTemplate: useCallback((id: string, updates: Partial<MessageTemplate>) => {
      const updatedTemplates = state.messageTemplates.map(template => 
        template.id === id 
          ? { ...template, ...updates, updated_at: new Date().toISOString() }
          : template
      );
      setState(prev => ({ ...prev, messageTemplates: updatedTemplates }));
      localStorage.setItem('instagram_message_templates', JSON.stringify(updatedTemplates));
    }, [state.messageTemplates]),
    deleteMessageTemplate: useCallback((id: string) => {
      const updatedTemplates = state.messageTemplates.filter(template => template.id !== id);
      setState(prev => ({ ...prev, messageTemplates: updatedTemplates }));
      localStorage.setItem('instagram_message_templates', JSON.stringify(updatedTemplates));
    }, [state.messageTemplates]),
    useMessageTemplate: useCallback(async (templateId: string, recipientId: string): Promise<boolean> => {
      const template = state.messageTemplates.find(t => t.id === templateId);
      if (!template) return false;

      let result = false;
      
      try {
        switch (template.type) {
          case 'text':
            result = await sendMessage(recipientId, template.content as string);
            break;
          case 'quick_reply':
            const qrData = template.content as any;
            result = await sendQuickReplies(recipientId, qrData.text, qrData.replies);
            break;
          case 'generic':
          case 'button':
            result = await actions.sendTemplate(recipientId, template.content);
            break;
        }

        if (result) {
          // Increment usage count
          actions.updateMessageTemplate(templateId, {
            usage_count: template.usage_count + 1
          });
        }

        return result;
      } catch (error) {
        console.error('Error using message template:', error);
        return false;
      }
    }, [state.messageTemplates, sendMessage, sendQuickReplies]),
    refreshAnalytics,
    exportConversations: useCallback(() => {
      const dataToExport = {
        conversations: state.conversations,
        analytics: state.analytics,
        exported_at: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `instagram_conversations_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, [state.conversations, state.analytics])
  };

  // Load conversations from webhook handler
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh analytics periodically
  useEffect(() => {
    if (state.isConnected) {
      refreshAnalytics();
      const interval = setInterval(refreshAnalytics, 5 * 60 * 1000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, [state.isConnected, refreshAnalytics]);

  return [state, actions];
};

// Webhook processing function for external use
export const processInstagramWebhook = async (webhookData: InstagramWebhook): Promise<void> => {
  // This would be called by your webhook endpoint
  const config: WebhookHandlerConfig = {
    autoReply: true,
    autoReplyRules: [],
    onMessage: (event) => console.log('Webhook message:', event),
    onPostback: (event) => console.log('Webhook postback:', event)
  };
  
  const handler = new InstagramWebhookHandler(config);
  await handler.processWebhook(webhookData);
};
