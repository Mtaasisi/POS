import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { whatsappService } from '../../../services/whatsappService';
import { getSettings } from '../../../lib/settingsApi';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import WhatsAppConfigModal from '../components/WhatsAppConfigModal';
import WhatsAppBusinessConfigModal from '../components/WhatsAppBusinessConfigModal';
import WhatsAppHealthMonitor from '../../../components/WhatsAppHealthMonitor';
import WhatsAppRateLimitMonitor from '../../../components/WhatsAppRateLimitMonitor';
import { MessageCircle, Send, Search, MoreVertical, Check, CheckCheck, Users, Settings, Bell, Shield, HelpCircle, Info, Phone, Mail, BarChart3, Megaphone, Clock, Target, TrendingUp, FileText, Calendar, Zap, UserCheck, Archive, User as UserIcon, CheckCircle, Smile, Paperclip, Mic, Image, File, Video, Music, MapPin, UserPlus, Tag, Filter, Download, Upload, RefreshCw, AlertTriangle, PlusCircle, X } from 'lucide-react';

interface Chat {
  id: string;
  customer_id: string;
  customer_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
  profile_image?: string;
  phone?: string;
  whatsapp?: string;
  status?: string;
  tags?: string[];
  assigned_to?: string;
}

interface Message {
  id: string;
  chat_id: string;
  content: string;
  sent_at: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';
  media_url?: string;
  media_name?: string;
  media_size?: number;
  media_mime_type?: string;
  error_message?: string;
}

interface ScheduledMessage {
  id: string;
  chat_id: string;
  content: string;
  message_type: string;
  media_url?: string;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  error_message?: string;
  created_by: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  profile_image?: string;
  created_at: string;
}

interface WhatsAppChat {
  id: string;
  name: string;
  phone: string;
  lastMessage?: string;
  timestamp?: string;
}

const WhatsAppWebPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'more'>('chats');
  const [contacts, setContacts] = useState<any[]>([]);
  
  // Advanced features state
  const [mainTab, setMainTab] = useState<'chat' | 'bulk' | 'analytics' | 'campaigns' | 'autoresponder' | 'assignment' | 'scheduled'>('chat');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Bulk messaging states
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [bulkMessage, setBulkMessage] = useState('');
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0, failed: 0 });
  
  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    totalMessages: 0,
    messagesThisWeek: 0,
    responseRate: 0,
    activeChats: 0,
    avgResponseTime: '0 min'
  });
  
  // Campaign states
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    scheduled_date: '',
    target_audience: 'all'
  });
  
  // Autoresponder states
  const [autoresponders, setAutoresponders] = useState<any[]>([]);
  const [showCreateAutoresponder, setShowCreateAutoresponder] = useState(false);
  const [newAutoresponder, setNewAutoresponder] = useState({
    keyword: '',
    response: '',
    is_active: true,
    match_type: 'exact'
  });

  // Assignment/Tagging states
  const [users, setUsers] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterUser, setFilterUser] = useState('');

  // Scheduled Messages states
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [showCreateScheduled, setShowCreateScheduled] = useState(false);
  const [newScheduled, setNewScheduled] = useState({
    chat_id: '',
    content: '',
    type: 'text',
    media_url: '',
    scheduled_for: ''
  });

  // Error and status states
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showBusinessConfigModal, setShowBusinessConfigModal] = useState(false);
  
  // Debug states
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Display limits
  const [chatsDisplayLimit, setChatsDisplayLimit] = useState(13);
  const [contactsDisplayLimit, setContactsDisplayLimit] = useState(13);
  
  // Message auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Initialize real-time updates
  useEffect(() => {
    let isInitializing = false;
    
    const initializeRealtime = async () => {
      if (isInitializing) {
        console.log('🔄 WhatsApp real-time initialization already in progress, skipping...');
        return;
      }
      
      isInitializing = true;
      try {
        console.log('🔄 Starting WhatsApp real-time initialization...');
        await whatsappService.initializeRealtime();
        console.log('✅ WhatsApp real-time initialization completed');
      } catch (error) {
        console.error('❌ WhatsApp real-time initialization failed:', error);
      } finally {
        isInitializing = false;
      }
    };
    
    initializeRealtime();
    requestNotificationPermission();
    
    // Listen for WhatsApp status changes
    const handleWhatsAppStatusChange = (event: CustomEvent) => {
      const { type, status } = event.detail;
      if (type === 'subscription') {
        console.log('📡 WhatsApp subscription status changed:', status);
        
        // Update debug info
        setDebugInfo({
          connectionStatus: status,
          serviceStatus: whatsappService.getConnectionStatus(),
          timestamp: new Date().toISOString()
        });
        
        switch (status) {
          case 'connected':
            setConnectionStatus('connected');
            setError(null);
            break;
          case 'disconnected':
            setConnectionStatus('disconnected');
            setError('WhatsApp real-time connection lost. Attempting to reconnect...');
            break;
          case 'error':
            setConnectionStatus('disconnected');
            setError('WhatsApp real-time connection error. Attempting to reconnect...');
            break;
          case 'timeout':
            setConnectionStatus('disconnected');
            setError('WhatsApp real-time connection timed out. Attempting to reconnect...');
            break;
          case 'max_attempts_reached':
            setConnectionStatus('disconnected');
            setError('WhatsApp real-time connection failed after multiple attempts. Please try manual reconnection.');
            break;
        }
      }
    };

    // Add event listener for WhatsApp status changes
    window.addEventListener('whatsapp-status-change', handleWhatsAppStatusChange as EventListener);
    
    return () => {
      whatsappService.unsubscribe();
      window.removeEventListener('whatsapp-status-change', handleWhatsAppStatusChange as EventListener);
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        } else {
          console.log('❌ Notification permission denied');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  // Check for new messages periodically
  useEffect(() => {
    const checkForNewMessages = async () => {
      if (selectedChat && !selectedChat.id.startsWith('temp_')) {
        try {
          // Fetch latest messages to check for new ones
          const { data: latestMessages, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('chat_id', selectedChat.id)
            .eq('direction', 'inbound')
            .gte('sent_at', new Date(Date.now() - 30000).toISOString()) // Last 30 seconds
            .order('sent_at', { ascending: false });

          if (!error && latestMessages && latestMessages.length > 0) {
            // Check if we have new messages
            const currentMessageIds = new Set(messages.map(m => m.id));
            const newMessages = latestMessages.filter(msg => !currentMessageIds.has(msg.id));
            
            if (newMessages.length > 0) {
              console.log(`📨 Found ${newMessages.length} new messages`);
              
              // Add new messages to the chat
              const formattedNewMessages: Message[] = newMessages.map((msg: any) => ({
                id: msg.id,
                chat_id: msg.chat_id,
                content: msg.content || '',
                sent_at: msg.sent_at || msg.created_at || new Date().toISOString(),
                direction: msg.direction || 'inbound',
                status: msg.status || 'delivered',
                message_type: msg.message_type || 'text',
                media_url: msg.media_url,
                media_name: msg.media_name,
                media_size: msg.media_size,
                media_mime_type: msg.media_mime_type,
                error_message: msg.error_message
              }));

              setMessages(prev => [...prev, ...formattedNewMessages]);
              
              // Mark messages as read
              await whatsappService.markMessagesAsRead(selectedChat.id);
            }
          }
        } catch (error) {
          console.error('Error checking for new messages:', error);
        }
      }
    };

    // Check for new messages every 10 seconds
    const interval = setInterval(checkForNewMessages, 10000);
    
    return () => clearInterval(interval);
  }, [selectedChat, messages]);

  // Listen for incoming messages
  useEffect(() => {
    const handleIncomingMessage = (message: any) => {
      console.log('📨 Incoming message received:', message);
      
      // Process the incoming message
      handleIncomingMessage(message);
    };

    const handleMessageStatus = (status: any) => {
      console.log('📊 Message status update:', status);
      
      // Update message status in current chat
      if (selectedChat) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === status.id ? { ...msg, status: status.status } : msg
          )
        );
      }
    };

    // Subscribe to real-time updates
    whatsappService.onMessage(handleIncomingMessage);
    whatsappService.onStatusUpdate(handleMessageStatus);

    return () => {
      // Cleanup subscriptions
      whatsappService.unsubscribe();
    };
  }, [selectedChat]);

  useEffect(() => {
    fetchChats();
    fetchContacts();
    fetchAnalyticsData();
    fetchCampaigns();
    fetchAutoresponders();
    fetchUsers();
    fetchScheduledMessages();
    checkConnection();
  }, []);

  // Enhanced connection check with better rate limiting and health monitoring
  const [lastConnectionCheck, setLastConnectionCheck] = useState(0);
  const [connectionHealth, setConnectionHealth] = useState<'healthy' | 'unhealthy' | 'unknown'>('unknown');
  const CONNECTION_CHECK_COOLDOWN = 900000; // Increased to 15 minutes to prevent rate limiting
  const HEALTHY_CHECK_INTERVAL = 3600000; // 60 minutes for healthy connections
  const RATE_LIMIT_COOLDOWN = 1800000; // 30 minutes for rate limit errors

  const checkConnection = async () => {
    try {
      const now = Date.now();
      const timeSinceLastCheck = now - lastConnectionCheck;
      
      // Skip if we checked recently
      if (timeSinceLastCheck < CONNECTION_CHECK_COOLDOWN) {
        console.log(`⏳ Skipping connection check (${Math.round(timeSinceLastCheck / 1000)}s since last check)`);
        return;
      }

      // If connection is healthy, check much less frequently
      if (connectionHealth === 'healthy' && timeSinceLastCheck < HEALTHY_CHECK_INTERVAL) {
        console.log('✅ Connection healthy, skipping frequent checks');
        return;
      }

      // If we had a recent rate limit error, extend the cooldown significantly
      if (error?.includes('rate limit') || error?.includes('429')) {
        if (timeSinceLastCheck < RATE_LIMIT_COOLDOWN) {
          console.log('🚫 Rate limit detected, extending cooldown period');
          return;
        }
      }

      console.log('🔍 Performing connection health check...');
      
      const testResult = await whatsappService.performConnectionCheck();
      
      if (testResult) {
        setLastConnectionCheck(now);
        setIsConnected(testResult.success);
        
        if (testResult.success) {
          setConnectionHealth('healthy');
          setError(null);
          console.log('✅ Connection check successful');
        } else {
          setConnectionHealth('unhealthy');
          if (testResult.error?.includes('Rate limit') || testResult.error?.includes('rate limit') || testResult.error?.includes('429')) {
            setError('WhatsApp API rate limit exceeded. Please wait 30 minutes before trying again.');
            // Set a longer cooldown for rate limit errors - 30 minutes
            setLastConnectionCheck(now - CONNECTION_CHECK_COOLDOWN + RATE_LIMIT_COOLDOWN);
          } else {
            setError(`WhatsApp connection failed: ${testResult.error}`);
          }
        }
      } else {
        setIsConnected(false);
        setError('WhatsApp credentials not configured. Please set up your Green API credentials.');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
      setError('Failed to check WhatsApp connection. Please verify your settings.');
    }
  };

  const handleConfigSaved = () => {
    checkConnection();
    fetchChats();
  };

  // Save message to database
  const saveMessageToDatabase = async (chatId: string, content: string, messageId?: string) => {
    try {
      console.log('💾 Saving message to database:', { chatId, content, messageId });
      
      const { error } = await supabase
        .from('whatsapp_messages')
        .insert({
          id: messageId || `temp_${Date.now()}`,
          chat_id: chatId,
          content: content,
          message_type: 'text',
          direction: 'outbound',
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving message to database:', error);
        throw error;
      }

      console.log('✅ Message saved to database successfully');
    } catch (error) {
      console.error('Failed to save message to database:', error);
      throw error;
    }
  };

  // Update chat's last message
  const updateChatLastMessage = async (chatId: string, lastMessage: string) => {
    try {
      console.log('🔄 Updating chat last message:', { chatId, lastMessage });
      
      const { error } = await supabase
        .from('whatsapp_chats')
        .update({
          last_message: lastMessage,
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error updating chat last message:', error);
        throw error;
      }

      console.log('✅ Chat last message updated successfully');
    } catch (error) {
      console.error('Failed to update chat last message:', error);
      throw error;
    }
  };

  // Create new chat in database
  const createChatInDatabase = async (customerId: string, phoneNumber: string, customerName: string) => {
    try {
      console.log('🆕 Creating new chat in database:', { customerId, phoneNumber, customerName });
      
      const { data: newChat, error } = await supabase
        .from('whatsapp_chats')
        .insert({
          customer_id: customerId,
          phone_number: phoneNumber,
          customer_name: customerName,
          last_message: 'Chat started',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat in database:', error);
        throw error;
      }

      console.log('✅ New chat created in database:', newChat.id);
      return newChat;
    } catch (error) {
      console.error('Failed to create chat in database:', error);
      throw error;
    }
  };

  // Sync all chats to database with improved batching and rate limiting
  const syncAllChatsToDatabase = async () => {
    try {
      console.log('🔄 Syncing all chats to database...');
      
      // Get all customers with WhatsApp numbers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, whatsapp, profile_image, created_at')
        .not('whatsapp', 'is', null)
        .not('whatsapp', 'eq', '');

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        return;
      }

      console.log(`📞 Found ${customers?.length || 0} customers with WhatsApp numbers`);

      // Get existing chats
      const { data: existingChats, error: chatsError } = await supabase
        .from('whatsapp_chats')
        .select('customer_id, phone_number');

      if (chatsError) {
        console.error('Error fetching existing chats:', chatsError);
        return;
      }

      const existingCustomerIds = new Set(existingChats?.map(chat => chat.customer_id).filter(Boolean));
      const existingPhoneNumbers = new Set(existingChats?.map(chat => chat.phone_number).filter(Boolean));

      let createdCount = 0;
      let skippedCount = 0;
      const chatsToCreate: any[] = [];

      // Prepare chats for customers who don't have them
      for (const customer of customers || []) {
        const phoneNumber = customer.whatsapp || customer.phone;
        
        if (!phoneNumber) continue;

        // Check if chat already exists
        if (existingCustomerIds.has(customer.id) || existingPhoneNumbers.has(phoneNumber)) {
          skippedCount++;
          continue;
        }

        // Prepare chat data for batch insert
        chatsToCreate.push({
          customer_id: customer.id,
          phone_number: phoneNumber,
          customer_name: customer.name || customer.phone || customer.whatsapp || 'Unknown Customer',
          last_message: 'Chat started',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Batch insert chats in chunks to prevent overwhelming the database
      const BATCH_SIZE = 50; // Process 50 chats at a time
      for (let i = 0; i < chatsToCreate.length; i += BATCH_SIZE) {
        const batch = chatsToCreate.slice(i, i + BATCH_SIZE);
        
        try {
          const { data: newChats, error: batchError } = await supabase
            .from('whatsapp_chats')
            .insert(batch)
            .select();

          if (batchError) {
            console.error(`Error creating batch ${Math.floor(i / BATCH_SIZE) + 1}:`, batchError);
            // Continue with next batch instead of failing completely
            continue;
          }

          createdCount += newChats?.length || 0;
          console.log(`✅ Created batch ${Math.floor(i / BATCH_SIZE) + 1}: ${newChats?.length || 0} chats`);

          // Add small delay between batches to prevent rate limiting
          if (i + BATCH_SIZE < chatsToCreate.length) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
        } catch (error) {
          console.error(`Failed to create batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
        }
      }

      console.log(`✅ Chat sync completed: ${createdCount} created, ${skippedCount} skipped`);
      
      // Refresh chats after sync
      await fetchChats();
      
      return { created: createdCount, skipped: skippedCount };
    } catch (error) {
      console.error('Error syncing chats to database:', error);
      throw error;
    }
  };

  // Save all messages for a chat
  const saveAllMessagesForChat = async (chatId: string, messages: Message[]) => {
    try {
      console.log(`💾 Saving ${messages.length} messages for chat ${chatId}`);
      
      const messagesToSave = messages
        .filter(msg => !msg.id.startsWith('temp_')) // Skip temporary messages
        .map(msg => ({
          id: msg.id,
          chat_id: chatId,
          content: msg.content,
          message_type: msg.message_type || 'text',
          direction: msg.direction || 'outbound',
          status: msg.status || 'sent',
          media_url: msg.media_url,
          media_name: msg.media_name,
          media_size: msg.media_size,
          media_mime_type: msg.media_mime_type,
          sent_at: msg.sent_at,
          error_message: msg.error_message
        }));

      if (messagesToSave.length === 0) {
        console.log('No messages to save');
        return;
      }

      const { error } = await supabase
        .from('whatsapp_messages')
        .upsert(messagesToSave, { onConflict: 'id' });

      if (error) {
        console.error('Error saving messages:', error);
        throw error;
      }

      console.log(`✅ Successfully saved ${messagesToSave.length} messages`);
    } catch (error) {
      console.error('Failed to save messages:', error);
      throw error;
    }
  };

  // Handle incoming message
  const handleIncomingMessage = async (messageData: any) => {
    try {
      console.log('📨 Processing incoming message:', messageData);
      
      const { chatId, content, messageType, mediaUrl, timestamp } = messageData;
      
      // Create new message object
      const newMessage: Message = {
        id: `temp_${Date.now()}`,
        chat_id: chatId,
        content: content,
        sent_at: timestamp || new Date().toISOString(),
        direction: 'inbound',
        status: 'delivered',
        message_type: messageType || 'text',
        media_url: mediaUrl
      };

      // Add message to current chat if it matches
      if (selectedChat && selectedChat.id === chatId) {
        setMessages(prev => [...prev, newMessage as Message]);
      }

      // Update chat list to show new message
      await fetchChats();
      
      // Show notification for new message
      if (selectedChat?.id !== chatId) {
        showNewMessageNotification(chatId, content);
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  };

  // Show notification for new message
  const showNewMessageNotification = (chatId: string, content: string) => {
    // Find chat name
    const chat = chats.find(c => c.id === chatId);
    const chatName = chat?.customer_name || 'Unknown Contact';
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New WhatsApp Message from ${chatName}`, {
        body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        icon: '/favicon.svg'
      });
    }
    
    // Show toast notification
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast.success(`New message from ${chatName}`);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      setDatabaseError(null);
      
      console.log('🔄 Fetching WhatsApp chats...');
      
      // Check if WhatsApp tables exist by trying to query them directly
      try {
        const { data: testQuery, error: testError } = await supabase
          .from('whatsapp_chats')
          .select('id')
          .limit(1);
        
        if (testError && testError.code === '42P01') {
          setDatabaseError('WhatsApp database tables not found. Please run the setup script first.');
          setChats([]);
          setLoading(false);
          return;
        }
      } catch (error) {
        setDatabaseError('WhatsApp database tables not found. Please run the setup script first.');
        setChats([]);
        setLoading(false);
        return;
      }

      // Fetch all WhatsApp chats with customer information
      const { data: whatsappChats, error: chatsError } = await supabase
        .from('whatsapp_chats')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            whatsapp,
            profile_image,
            created_at
          )
        `)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      console.log(`📱 Found ${whatsappChats?.length || 0} WhatsApp chats`);

      // Transform the data to match our Chat interface
      const transformedChats: Chat[] = (whatsappChats || []).map((chat: any) => {
        const customer = chat.customers;
        
        return {
          id: chat.id,
          customer_id: chat.customer_id || customer?.id,
          customer_name: chat.customer_name || customer?.name || customer?.phone || customer?.whatsapp || 'Unknown Customer',
          last_message: chat.last_message || 'Start a conversation',
          last_message_time: chat.last_message_time || chat.updated_at || customer?.created_at,
          unread_count: chat.unread_count || 0,
          is_online: chat.is_online || Math.random() > 0.7,
          profile_image: customer?.profile_image || chat.profile_image,
          phone: customer?.phone || chat.phone_number,
          whatsapp: customer?.whatsapp || chat.phone_number,
          status: chat.status || 'active',
          tags: chat.tags || [],
          assigned_to: chat.assigned_to
        };
      });

      // Also fetch customers who have WhatsApp numbers but no chats yet
      // Use the optimized method to avoid long URLs
      const existingCustomerIds = transformedChats.map(chat => chat.customer_id).filter(Boolean);
      
      let customersWithoutChats: any[] = [];
      
      try {
        // Use the optimized service method
        customersWithoutChats = await whatsappService.fetchCustomersOptimized(existingCustomerIds, 1000);
      } catch (error) {
        console.warn('Error fetching customers without chats:', error);
      }

      if (customersWithoutChats.length > 0) {
        console.log(`📞 Found ${customersWithoutChats.length} customers with WhatsApp numbers but no chats`);
        
        // Add potential chats for customers with WhatsApp numbers
        const potentialChats: Chat[] = customersWithoutChats.map((customer: any) => ({
          id: `temp_${customer.id}`,
          customer_id: customer.id,
          customer_name: customer.name || customer.phone || customer.whatsapp || 'Unknown Customer',
          last_message: 'Start a conversation',
          last_message_time: customer.created_at,
          unread_count: 0,
          is_online: Math.random() > 0.7,
          profile_image: customer.profile_image,
          phone: customer.phone,
          whatsapp: customer.whatsapp,
          status: 'active',
          tags: [],
          assigned_to: undefined
        }));

        transformedChats.push(...potentialChats);
      }

      console.log(`✅ Total chats loaded: ${transformedChats.length}`);
      setChats(transformedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats. Please try again.');
      setDatabaseError('Database connection error. Please check your setup.');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, whatsapp, profile_image, created_at')
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const analytics = await whatsappService.getAnalytics(7); // Last 7 days
      setAnalyticsData({
        totalMessages: analytics.total,
        messagesThisWeek: analytics.total,
        responseRate: analytics.responseRate,
        activeChats: chats.length,
        avgResponseTime: `${Math.round(analytics.avgResponseTime)} min`
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchAutoresponders = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_autoresponders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error;
      setAutoresponders(data || []);
    } catch (error) {
      console.error('Error fetching autoresponders:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, name, role')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchScheduledMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_whatsapp_messages')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (error && error.code !== 'PGRST116') throw error;
      setScheduledMessages(data || []);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
    }
  };

  // Add message fetching cache to prevent duplicate requests
  const messageFetchCache = useRef<Map<string, { messages: Message[]; timestamp: number }>>(new Map());
  const MESSAGE_CACHE_TTL = 30000; // 30 seconds cache

  const fetchMessages = async (chatId: string) => {
    try {
      if (chatId.startsWith('temp_')) {
        setMessages([]);
        return;
      }

      // Check cache first
      const cached = messageFetchCache.current.get(chatId);
      const now = Date.now();
      if (cached && (now - cached.timestamp) < MESSAGE_CACHE_TTL) {
        console.log('📋 Using cached messages for chat:', chatId);
        setMessages(cached.messages);
        return;
      }
        
      console.log('📥 Fetching messages for chat:', chatId);
        
      const { data: messagesData, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
        return;
      }

      const formattedMessages: Message[] = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        chat_id: msg.chat_id,
        content: msg.content || '',
        sent_at: msg.sent_at || msg.created_at || new Date().toISOString(),
        direction: msg.direction || 'outbound',
        status: msg.status || 'sent',
        message_type: msg.message_type || 'text',
        media_url: msg.media_url,
        media_name: msg.media_name,
        media_size: msg.media_size,
        media_mime_type: msg.media_mime_type,
        error_message: msg.error_message
      }));

      // Cache the messages
      messageFetchCache.current.set(chatId, {
        messages: formattedMessages,
        timestamp: now
      });

      console.log(`✅ Loaded ${formattedMessages.length} messages for chat ${chatId}`);
      setMessages(formattedMessages);
      
      // Mark messages as read (but don't block the UI)
      if (selectedChat) {
        whatsappService.markMessagesAsRead(chatId).catch(error => {
          console.error('Failed to mark messages as read:', error);
        });
        console.log('✅ Messages marked as read');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat?.id]); // Only depend on selectedChat.id, not the entire selectedChat object

  // Separate effect for saving messages to prevent conflicts
  useEffect(() => {
    if (selectedChat && messages.length > 0 && !selectedChat.id.startsWith('temp_')) {
      // Debounce the save operation to prevent excessive database writes
      const timeoutId = setTimeout(() => {
        saveAllMessagesForChat(selectedChat.id, messages).catch(error => {
          console.error('Failed to save messages for chat:', error);
        });
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [messages, selectedChat?.id]);

  const formatTime = (sent_at: string) => {
    try {
      const date = new Date(sent_at);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      return 'Invalid time';
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage.trim();
    const timestamp = new Date().toISOString();
    
    setNewMessage('');

    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      chat_id: selectedChat.id,
      content: messageContent,
      sent_at: timestamp,
      direction: 'outbound',
      status: 'sent',
      message_type: 'text'
    };
      
    setMessages(prev => [...prev, optimisticMessage]);
      
    setChats(prev => 
      prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, last_message: messageContent, last_message_time: timestamp }
          : chat
      )
    );

    try {
      let chatId = selectedChat.id;
      
      if (chatId.startsWith('temp_')) {
        try {
          const phoneNumber = selectedChat.whatsapp || selectedChat.phone;
          const customerName = selectedChat.customer_name;
          
          if (!phoneNumber) {
            throw new Error('No phone number available for this contact');
          }

          const newChat = await createChatInDatabase(
            selectedChat.customer_id,
            phoneNumber,
            customerName
          );
          
          chatId = newChat.id;
          setSelectedChat(prev => prev ? { ...prev, id: chatId } : null);
          
          // Refresh chats to show the new chat
          await fetchChats();
        } catch (error) {
          console.error('Failed to create chat:', error);
          // Continue with temp chat ID
        }
      }

      // Send via WhatsApp service
      try {
        // Use phone number instead of chatId for WhatsApp API
        const phoneNumber = selectedChat.whatsapp || selectedChat.phone;
        if (!phoneNumber) {
          throw new Error('No phone number available for this contact');
        }
        
        const result = await whatsappService.sendMessage(phoneNumber, messageContent);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send message');
        }

        // Save message to database
        await saveMessageToDatabase(chatId, messageContent, result.messageId);

        // Update optimistic message with real ID
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...msg, id: result.messageId || msg.id }
              : msg
          )
        );

        // Update chat's last message
        await updateChatLastMessage(chatId, messageContent);
      } catch (error) {
        console.error('WhatsApp service error:', error);
        // Keep optimistic message but mark as failed
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...msg, status: 'failed', error_message: 'Failed to send via WhatsApp' }
              : msg
          )
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      
      const result = await whatsappService.uploadMedia(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      // Send media message
      if (selectedChat && result.url) {
        const messageContent = `Media: ${file.name}`;
        const phoneNumber = selectedChat.whatsapp || selectedChat.phone;
        if (phoneNumber) {
          await whatsappService.sendMessage(phoneNumber, messageContent, 'media', result.url);
        }
      }
      
      setSelectedFile(null);
      setFilePreview(null);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkSend = async () => {
    if (!bulkMessage.trim() || selectedContacts.length === 0) return;
    
    setIsSendingBulk(true);
    setBulkProgress({ sent: 0, total: selectedContacts.length, failed: 0 });
    
    try {
      // Use phone numbers instead of chat IDs for WhatsApp API
      const phoneNumbers = selectedContacts
        .map(contact => contact.whatsapp || contact.phone)
        .filter(phone => phone); // Filter out contacts without phone numbers
      
      if (phoneNumbers.length === 0) {
        setError('No valid phone numbers found in selected contacts');
        return;
      }
      
      const result = await whatsappService.sendBulk(
        phoneNumbers, 
        bulkMessage, 
        (progress) => setBulkProgress(progress)
      );
      
      if (result.success) {
        setBulkMessage('');
        setSelectedContacts([]);
        alert('Bulk messages sent successfully!');
      } else {
        setError('Some messages failed to send. Please check the results.');
      }
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      setError('Failed to send bulk messages. Please try again.');
    } finally {
      setIsSendingBulk(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.whatsapp?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enhanced error handling and diagnostics for WhatsApp sending failures
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const runWhatsAppDiagnostics = async () => {
    setShowDiagnostics(true);
    setDiagnosticInfo(null);
    
    try {
      const diagnostics = {
        timestamp: new Date().toISOString(),
        connection: await whatsappService.performHealthCheck(),
        settings: await getSettings(),
        rateLimitInfo: {
          lastError: localStorage.getItem('whatsapp_last_error'),
          errorCount: localStorage.getItem('whatsapp_error_count'),
          lastCheck: localStorage.getItem('whatsapp_last_check'),
          rateLimitBackoff: localStorage.getItem('whatsapp_rate_limit_backoff')
        }
      };
      
      setDiagnosticInfo(diagnostics);
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setDiagnosticInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const getErrorMessage = (error: any) => {
    if (!error) return 'Unknown error occurred';
    
    const errorStr = error.toString().toLowerCase();
    
    if (errorStr.includes('rate limit') || errorStr.includes('429')) {
      return 'WhatsApp API rate limit exceeded. Please wait a few minutes before trying again.';
    }
    
    if (errorStr.includes('not authorized') || errorStr.includes('unauthorized')) {
      return 'WhatsApp not authorized. Please check your Green API credentials and scan the QR code.';
    }
    
    if (errorStr.includes('invalid phone number') || errorStr.includes('phone')) {
      return 'Invalid phone number format. Please use international format (e.g., 254700000000).';
    }
    
    if (errorStr.includes('credentials not set') || errorStr.includes('not configured')) {
      return 'WhatsApp credentials not configured. Please set up your Green API credentials first.';
    }
    
    if (errorStr.includes('network') || errorStr.includes('connection')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    return error.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WhatsApp...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden">
        {/* Status Bar - Fixed at top */}
        {(error || databaseError || !isConnected) && (
          <div className="fixed top-0 left-0 right-0 z-50 p-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-2 shadow-lg">
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 flex-shrink-0" size={20} />
                  <span className="font-medium">WhatsApp Error:</span>
                  <span className="ml-2">{getErrorMessage(error)}</span>
                </div>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={runWhatsAppDiagnostics}
                    className="text-xs bg-red-200 text-red-800 px-3 py-1 rounded hover:bg-red-300 transition-colors"
                  >
                    Run Diagnostics
                  </button>
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="text-xs bg-blue-200 text-blue-800 px-3 py-1 rounded hover:bg-blue-300 transition-colors"
                  >
                    Check Settings
                  </button>
                  {error.includes('multiple attempts') && (
                    <button
                      onClick={async () => {
                        try {
                          console.log('🔄 Manual reset and reconnect initiated...');
                          whatsappService.resetReconnectionAttempts();
                          setError(null);
                          // Use a small delay to ensure proper cleanup
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          await whatsappService.initializeRealtime();
                        } catch (error) {
                          console.error('Failed to reset and reconnect:', error);
                        }
                      }}
                      className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded hover:bg-green-300 transition-colors"
                    >
                      Reset & Reconnect
                    </button>
                  )}
                </div>
              </div>
            )}
            {databaseError && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-2 shadow-lg">
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 flex-shrink-0" size={20} />
                  <span className="font-medium">Database Issue:</span>
                  <span className="ml-2">{databaseError}</span>
                </div>
              </div>
            )}
            {!isConnected && !error && (
              <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg mb-2 shadow-lg">
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 flex-shrink-0" size={20} />
                  <span className="font-medium">Connection Status:</span>
                  <span className="ml-2">WhatsApp not connected. Please check your settings.</span>
                </div>
              </div>
            )}

            {/* Debug Information */}
            {showDebugInfo && debugInfo && (
              <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg mb-2 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">WhatsApp Debug Info</span>
                  <button
                    onClick={() => setShowDebugInfo(false)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Connection Status:</strong> {debugInfo.connectionStatus || 'Unknown'}
                  </div>
                  
                  <div>
                    <strong>Service Status:</strong>
                    <div className="ml-2">
                      <div>Initializing: {debugInfo.serviceStatus?.isInitializing ? 'Yes' : 'No'}</div>
                      <div>Reconnection Attempts: {debugInfo.serviceStatus?.reconnectionAttempts || '0'}/{debugInfo.serviceStatus?.maxAttempts || '5'}</div>
                      <div>Last Attempt: {debugInfo.serviceStatus?.lastAttempt ? new Date(debugInfo.serviceStatus.lastAttempt).toLocaleTimeString() : 'Never'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <strong>Last Update:</strong> {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic Information */}
            {showDiagnostics && diagnosticInfo && (
              <div className="bg-gray-50 border border-gray-300 text-gray-800 px-4 py-3 rounded-lg mb-2 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">WhatsApp Diagnostics</span>
                  <button
                    onClick={() => setShowDiagnostics(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Connection Status:</strong> {diagnosticInfo.connection?.status || 'Unknown'}
                    {diagnosticInfo.connection?.error && (
                      <div className="text-red-600 ml-2">Error: {diagnosticInfo.connection.error}</div>
                    )}
                  </div>
                  
                  <div>
                    <strong>Settings:</strong>
                    <div className="ml-2">
                      <div>Instance ID: {diagnosticInfo.settings?.whatsapp_instance_id ? '✓ Set' : '✗ Not set'}</div>
                      <div>API Key: {diagnosticInfo.settings?.whatsapp_green_api_key ? '✓ Set' : '✗ Not set'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <strong>Rate Limit Info:</strong>
                    <div className="ml-2">
                      <div>Error Count: {diagnosticInfo.rateLimitInfo?.errorCount || '0'}</div>
                      <div>Last Error: {diagnosticInfo.rateLimitInfo?.lastError || 'None'}</div>
                      {diagnosticInfo.rateLimitInfo?.rateLimitBackoff && (
                        <div className="text-orange-600">
                          Rate limited until: {new Date(parseInt(diagnosticInfo.rateLimitInfo.rateLimitBackoff)).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-1 border-t border-gray-300">
                    <strong>Recommendations:</strong>
                    <ul className="ml-2 mt-1 space-y-1">
                      {!diagnosticInfo.settings?.whatsapp_instance_id && (
                        <li>• Configure WhatsApp Instance ID in settings</li>
                      )}
                      {!diagnosticInfo.settings?.whatsapp_green_api_key && (
                        <li>• Configure WhatsApp API Key in settings</li>
                      )}
                      {diagnosticInfo.connection?.status === 'not_authorized' && (
                        <li>• Scan QR code to authorize WhatsApp</li>
                      )}
                      {diagnosticInfo.rateLimitInfo?.rateLimitBackoff && (
                        <li>• Wait for rate limit to expire before sending more messages</li>
                      )}
                      {diagnosticInfo.connection?.status === 'connection_error' && (
                        <li>• Check internet connection and try again</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Container */}
        <div className="h-full flex flex-col max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex-shrink-0 p-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="mr-2 text-green-600" size={28} />
                  WhatsApp Business
                </h1>
                <p className="text-gray-600 text-sm">Manage your WhatsApp communications</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="capitalize">API {connectionStatus}</span>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                  connectionStatus === 'connected' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="capitalize">Real-time {connectionStatus === 'connected' ? 'Active' : 'Inactive'}</span>
                </div>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                  title="Configure Green API"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setShowBusinessConfigModal(true)}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Configure WhatsApp Business API"
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  onClick={checkConnection}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                  title="Refresh API Connection"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('🔄 Manual real-time reconnection initiated...');
                      // Reset reconnection attempts before manual reconnection
                      whatsappService.resetReconnectionAttempts();
                      // Use a small delay to ensure proper cleanup
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      await whatsappService.initializeRealtime();
                    } catch (error) {
                      console.error('❌ Failed to reconnect real-time subscription:', error);
                    }
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                  title="Reconnect Real-time"
                >
                  <Zap size={20} />
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await syncAllChatsToDatabase();
                      alert('Chats synced successfully!');
                    } catch (error) {
                      console.error('Error syncing chats:', error);
                      alert('Failed to sync chats. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                  title="Sync All Chats"
                >
                  <Upload size={20} />
                </button>
                <button
                  onClick={() => {
                    // Test incoming message functionality
                    if (selectedChat) {
                      const testMessage = {
                        chatId: selectedChat.id,
                        content: 'This is a test incoming message',
                        messageType: 'text',
                        timestamp: new Date().toISOString()
                      };
                      handleIncomingMessage(testMessage);
                      alert('Test message sent! Check the chat.');
                    } else {
                      alert('Please select a chat first to test incoming messages.');
                    }
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                  title="Test Incoming Message"
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                  title="Toggle Debug Info"
                >
                  <HelpCircle size={20} />
                </button>
              </div>
            </div>
            
            {/* Main Navigation Tabs */}
            <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm overflow-x-auto">
              <button
                onClick={() => setMainTab('chat')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  mainTab === 'chat' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <MessageCircle size={18} />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setMainTab('bulk')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  mainTab === 'bulk' 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Megaphone size={18} />
                <span>Bulk Messages</span>
              </button>
              <button
                onClick={() => setMainTab('analytics')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  mainTab === 'analytics' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <BarChart3 size={18} />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => setMainTab('campaigns')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  mainTab === 'campaigns' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Target size={18} />
                <span>Campaigns</span>
              </button>
              <button
                onClick={() => setMainTab('autoresponder')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  mainTab === 'autoresponder' 
                    ? 'bg-indigo-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Zap size={18} />
                <span>Autoresponder</span>
              </button>
              <button
                onClick={() => setMainTab('assignment')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  mainTab === 'assignment' 
                    ? 'bg-pink-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <UserCheck size={18} />
                <span>Assignment</span>
              </button>
              <button
                onClick={() => setMainTab('scheduled')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  mainTab === 'scheduled' 
                    ? 'bg-teal-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Calendar size={18} />
                <span>Scheduled</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-h-0 px-4 pb-4 overflow-hidden">
            {/* Chat Tab */}
            {mainTab === 'chat' && (
              <div className="flex flex-col h-full min-h-0">
                {/* Health Monitor */}
                <div className="mb-4 space-y-3">
                  <WhatsAppHealthMonitor />
                  <WhatsAppRateLimitMonitor />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
                {/* Sidebar */}
                <div className="lg:col-span-1 min-h-0">
                  <GlassCard className="h-full flex flex-col min-h-0">
                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-gray-200">
                      <button
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 px-4 py-3 transition-colors ${
                          activeTab === 'chats'
                            ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <MessageCircle size={18} />
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('contacts')}
                        className={`flex-1 px-4 py-3 transition-colors ${
                          activeTab === 'contacts'
                            ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <Users size={18} />
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('more')}
                        className={`flex-1 px-4 py-3 transition-colors ${
                          activeTab === 'more'
                            ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <MoreVertical size={18} />
                        </div>
                      </button>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search chats..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    {/* Chat/Contact List */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                      {activeTab === 'chats' && (
                        <div className="space-y-1 p-2">
                          {filteredChats.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <MessageCircle size={32} className="mx-auto mb-3 text-gray-400" />
                              <p className="text-sm font-medium">No conversations yet</p>
                              <p className="text-xs text-gray-400 mt-1">Start chatting with customers to see conversations here</p>
                            </div>
                          ) : (
                            <>
                              {filteredChats.slice(0, chatsDisplayLimit).map((chat) => (
                                <div
                                  key={chat.id}
                                  onClick={() => setSelectedChat(chat)}
                                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedChat?.id === chat.id
                                      ? 'bg-green-100 border border-green-300'
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="relative">
                                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        {chat.profile_image ? (
                                          <img
                                            src={chat.profile_image}
                                            alt={chat.customer_name}
                                            className="w-10 h-10 rounded-full object-cover"
                                          />
                                        ) : (
                                          <UserIcon size={20} className="text-gray-600" />
                                        )}
                                      </div>
                                      {chat.is_online && (
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-gray-900 truncate text-sm">
                                          {chat.customer_name}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                          {formatTime(chat.last_message_time)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 truncate">
                                        {chat.last_message}
                                      </p>
                                      {chat.unread_count > 0 && (
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-xs text-gray-500">
                                            {chat.phone || chat.whatsapp}
                                          </span>
                                          <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                            {chat.unread_count}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Show More Button for Chats */}
                              {filteredChats.length > chatsDisplayLimit && (
                                <div className="p-2">
                                  <button
                                    onClick={() => setChatsDisplayLimit(prev => prev + 13)}
                                    className="w-full p-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors font-medium"
                                  >
                                    Show More Chats ({filteredChats.length - chatsDisplayLimit} remaining)
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {activeTab === 'contacts' && (
                        <div className="space-y-1 p-2">
                          {contacts.slice(0, contactsDisplayLimit).map((contact) => (
                            <div
                              key={contact.id}
                              onClick={() => {
                                const chat = chats.find(c => c.customer_id === contact.id);
                                if (chat) {
                                  setSelectedChat(chat);
                                } else {
                                  // Create new chat
                                  const newChat: Chat = {
                                    id: `temp_${contact.id}`,
                                    customer_id: contact.id,
                                    customer_name: contact.name || contact.phone || contact.whatsapp || 'Unknown',
                                    last_message: 'Start a conversation',
                                    last_message_time: new Date().toISOString(),
                                    unread_count: 0,
                                    is_online: false,
                                    phone: contact.phone,
                                    whatsapp: contact.whatsapp,
                                    profile_image: contact.profile_image
                                  };
                                  setSelectedChat(newChat);
                                }
                              }}
                              className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  {contact.profile_image ? (
                                    <img
                                      src={contact.profile_image}
                                      alt={contact.name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <UserIcon size={20} className="text-gray-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate text-sm">
                                    {contact.name || contact.phone || contact.whatsapp}
                                  </h3>
                                  <p className="text-xs text-gray-600 truncate">
                                    {contact.phone || contact.whatsapp}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Show More Button for Contacts */}
                          {contacts.length > contactsDisplayLimit && (
                            <div className="p-2">
                              <button
                                onClick={() => setContactsDisplayLimit(prev => prev + 13)}
                                className="w-full p-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors font-medium"
                              >
                                Show More Contacts ({contacts.length - contactsDisplayLimit} remaining)
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'more' && (
                        <div className="p-4 space-y-3">
                          <div className="space-y-2">
                            <h3 className="font-medium text-gray-900 text-sm">Quick Actions</h3>
                            <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-2">
                                <Archive size={16} className="text-gray-600" />
                                <span className="text-sm">Archived Chats</span>
                              </div>
                            </button>
                            <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-2">
                                <Settings size={16} className="text-gray-600" />
                                <span className="text-sm">Settings</span>
                              </div>
                            </button>
                            <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-2">
                                <HelpCircle size={16} className="text-gray-600" />
                                <span className="text-sm">Help</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-3 min-h-0">
                  <GlassCard className="h-full flex flex-col min-h-0">
                    {selectedChat ? (
                      <>
                        {/* Chat Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/50">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                {selectedChat.profile_image ? (
                                  <img
                                    src={selectedChat.profile_image}
                                    alt={selectedChat.customer_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <UserIcon size={20} className="text-gray-600" />
                                )}
                              </div>
                              {selectedChat.is_online && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div>
                              <h2 className="font-medium text-gray-900 text-sm">
                                {selectedChat.customer_name}
                              </h2>
                              <p className="text-xs text-gray-500">
                                {selectedChat.phone || selectedChat.whatsapp}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                              <Phone size={18} />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 min-h-0">
                          <div className="space-y-3">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                                    message.direction === 'outbound'
                                      ? 'bg-green-500 text-white rounded-br-md'
                                      : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                                  }`}
                                >
                                  {message.message_type === 'text' && (
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                      {message.content || 'Empty message'}
                                    </p>
                                  )}
                                  {message.message_type === 'image' && (
                                    <div>
                                      <img
                                        src={message.media_url}
                                        alt="Image"
                                        className="w-full rounded mb-2"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      {message.content && (
                                        <p className="text-sm">{message.content}</p>
                                      )}
                                    </div>
                                  )}
                                  {message.message_type === 'document' && (
                                    <div className="flex items-center space-x-2">
                                      <File size={16} />
                                      <span className="text-sm">{message.media_name || 'Document'}</span>
                                    </div>
                                  )}
                                  <div className={`flex items-center justify-end mt-1 text-xs ${
                                    message.direction === 'outbound' ? 'text-green-100' : 'text-gray-500'
                                  }`}>
                                    <span>{formatTime(message.sent_at)}</span>
                                    {message.direction === 'outbound' && (
                                      <div className="ml-1">
                                        {message.status === 'sent' && <Check size={12} />}
                                        {message.status === 'delivered' && <CheckCheck size={12} />}
                                        {message.status === 'read' && <CheckCheck size={12} className="text-green-200" />}
                                        {message.status === 'failed' && <AlertTriangle size={12} className="text-red-300" />}
                                      </div>
                                    )}
                                  </div>
                                  {message.error_message && (
                                    <div className="text-xs text-red-300 mt-1">
                                      {message.error_message}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-200 bg-white/50">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowFileUpload(!showFileUpload)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Paperclip size={18} />
                            </button>
                            <button
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Smile size={18} />
                            </button>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }
                                }}
                                placeholder="Type a message..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                disabled={!selectedChat}
                              />
                            </div>
                            <button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim() || !selectedChat}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send size={18} />
                            </button>
                          </div>
                          
                          {/* File Upload */}
                          {showFileUpload && (
                            <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-white">
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => document.getElementById('file-upload')?.click()}
                                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                                >
                                  <Upload size={16} />
                                  <span>Upload File</span>
                                </button>
                                <input
                                  id="file-upload"
                                  type="file"
                                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setSelectedFile(file);
                                      if (file.type.startsWith('image/')) {
                                        const reader = new FileReader();
                                        reader.onload = (e) => setFilePreview(e.target?.result as string);
                                        reader.readAsDataURL(file);
                                      }
                                    }
                                  }}
                                  className="hidden"
                                />
                                {selectedFile && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">{selectedFile.name}</span>
                                    <button
                                      onClick={() => handleFileUpload(selectedFile)}
                                      disabled={isUploading}
                                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
                                    >
                                      {isUploading ? 'Uploading...' : 'Send'}
                                    </button>
                                  </div>
                                )}
                              </div>
                              {filePreview && (
                                <div className="mt-2">
                                  <img src={filePreview} alt="Preview" className="max-w-xs rounded" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <MessageCircle size={48} className="text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
                          <p className="text-gray-600 text-sm">Choose a conversation to start messaging</p>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>
            </div>
            )}

            {/* Other tabs will be added in next chunks */}
            
            {/* Bulk Messages Tab */}
            {mainTab === 'bulk' && (
              <div className="space-y-6 h-full overflow-y-auto">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Megaphone size={24} className="mr-3 text-purple-600" />
                    Bulk Messages
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Contact Selection */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Users size={20} className="mr-2 text-purple-600" />
                        Select Contacts
                      </h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {contacts.map((contact) => (
                          <label key={contact.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedContacts.some(c => c.id === contact.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedContacts(prev => [...prev, contact]);
                                } else {
                                  setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
                                }
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm">{contact.name || 'Unknown'}</span>
                              <span className="text-xs text-gray-500 block">
                                {contact.whatsapp || contact.phone}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        Selected: {selectedContacts.length} contacts
                      </div>
                    </div>

                    {/* Message Composition */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <MessageCircle size={20} className="mr-2 text-purple-600" />
                        Message
                      </h3>
                      <textarea
                        value={bulkMessage}
                        onChange={(e) => setBulkMessage(e.target.value)}
                        placeholder="Enter your bulk message here..."
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                      <div className="mt-2 text-sm text-gray-600">
                        Characters: {bulkMessage.length}
                      </div>

                      <div className="mt-6">
                        <button
                          onClick={handleBulkSend}
                          disabled={selectedContacts.length === 0 || !bulkMessage.trim() || isSendingBulk}
                          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {isSendingBulk ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending... ({bulkProgress.sent}/{bulkProgress.total})
                            </div>
                          ) : (
                            `Send to ${selectedContacts.length} contacts`
                          )}
                        </button>
                      </div>

                      {isSendingBulk && (
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${(bulkProgress.sent / bulkProgress.total) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mt-2">
                            <span>Sent: {bulkProgress.sent}</span>
                            <span>Failed: {bulkProgress.failed}</span>
                            <span>Total: {bulkProgress.total}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Analytics Tab */}
            {mainTab === 'analytics' && (
              <div className="space-y-6 h-full overflow-y-auto">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChart3 size={24} className="mr-3 text-blue-600" />
                    Analytics Dashboard
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Messages</p>
                          <p className="text-3xl font-bold text-blue-900">{analyticsData.totalMessages}</p>
                        </div>
                        <MessageCircle size={24} className="text-blue-600" />
                      </div>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">This Week</p>
                          <p className="text-3xl font-bold text-green-900">{analyticsData.messagesThisWeek}</p>
                        </div>
                        <TrendingUp size={24} className="text-green-600" />
                      </div>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Response Rate</p>
                          <p className="text-3xl font-bold text-purple-900">{analyticsData.responseRate}%</p>
                        </div>
                        <CheckCircle size={24} className="text-purple-600" />
                      </div>
                    </div>

                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Active Chats</p>
                          <p className="text-3xl font-bold text-orange-900">{analyticsData.activeChats}</p>
                        </div>
                        <Users size={24} className="text-orange-600" />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Campaigns Tab */}
            {mainTab === 'campaigns' && (
              <div className="space-y-6 h-full overflow-y-auto">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Target size={24} className="mr-3 text-orange-600" />
                    Campaigns
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Active Campaigns</h3>
                      <button
                        onClick={() => setShowCreateCampaign(true)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-white p-4 rounded-lg shadow-sm">
                          <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                          <p className="text-sm text-gray-600">{campaign.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Scheduled for: {new Date(campaign.scheduled_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Status: {campaign.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Autoresponder Tab */}
            {mainTab === 'autoresponder' && (
              <div className="space-y-6 h-full overflow-y-auto">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Zap size={24} className="mr-3 text-indigo-600" />
                    Autoresponders
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Active Autoresponders</h3>
                      <button
                        onClick={() => setShowCreateAutoresponder(true)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {autoresponders.map((autoresponder) => (
                        <div key={autoresponder.id} className="bg-white p-4 rounded-lg shadow-sm">
                          <h4 className="font-medium text-gray-900">{autoresponder.keyword}</h4>
                          <p className="text-sm text-gray-600">{autoresponder.response}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Match Type: {autoresponder.match_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            Active: {autoresponder.is_active ? 'Yes' : 'No'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Assignment Tab */}
            {mainTab === 'assignment' && (
              <div className="space-y-6 h-full overflow-y-auto">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <UserCheck size={24} className="mr-3 text-pink-600" />
                    User Assignment
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Assign Users to Chats</h3>
                      <button
                        onClick={async () => {
                          const userIds = users.map(user => user.id);
                          const chatIds = chats.map(chat => chat.id);
                          const assigned = await whatsappService.assignUsersToChats(userIds, chatIds);
                          alert(`Users assigned to chats: ${assigned.success ? 'Success' : 'Failed'}`);
                        }}
                        className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        <Users size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {users.map((user) => (
                        <div key={user.id} className="bg-white p-4 rounded-lg shadow-sm">
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">Role: {user.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Scheduled Messages Tab */}
            {mainTab === 'scheduled' && (
              <div className="space-y-6 h-full overflow-y-auto">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Calendar size={24} className="mr-3 text-teal-600" />
                    Scheduled Messages
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Scheduled Messages</h3>
                      <button
                        onClick={() => setShowCreateScheduled(true)}
                        className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scheduledMessages.map((scheduled) => (
                        <div key={scheduled.id} className="bg-white p-4 rounded-lg shadow-sm">
                          <h4 className="font-medium text-gray-900">{scheduled.content}</h4>
                          <p className="text-sm text-gray-600">
                            Type: {scheduled.message_type}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Scheduled for: {new Date(scheduled.scheduled_for).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Status: {scheduled.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Configuration Modals */}
      <WhatsAppConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onConfigSaved={handleConfigSaved}
      />
      <WhatsAppBusinessConfigModal
        isOpen={showBusinessConfigModal}
        onClose={() => setShowBusinessConfigModal(false)}
        onConfigSaved={handleConfigSaved}
      />
    </>
  );
};

export default WhatsAppWebPage;
