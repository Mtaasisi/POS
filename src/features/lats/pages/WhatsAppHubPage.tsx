import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import { SimpleBackButton as BackButton } from '../../shared/components/ui/SimpleBackButton';
import { toast } from '../../../lib/toastUtils';
import { 
  MessageCircle, 
  Send, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Target,
  FileText,
  Image,
  MapPin,
  User,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Database,
  Calendar,
  TrendingUp,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Play,
  Eye,
  Edit,
  Trash2,
  Smile,
  MoreVertical,
  ChevronRight,
  Star,
  AlertTriangle,
  LogOut,
  Wifi,
  WifiOff,
  Phone,
  Video
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import Modal from '../../shared/components/ui/Modal';
import WhatsAppTemplateManager from '../components/WhatsAppTemplateManager';
import { greenApiService } from '../../../services/greenApiService';

// Import the new page components
import WhatsAppOverviewPage from './WhatsAppOverviewPage';
import WhatsAppMessagingPage from './WhatsAppMessagingPage';
import WhatsAppBulkPage from './WhatsAppBulkPage';
import WhatsAppTemplatesPage from './WhatsAppTemplatesPage';
import WhatsAppAnalyticsPage from './WhatsAppAnalyticsPage';
import WhatsAppChatPage from './WhatsAppChatPage';

// Types
interface WhatsAppInstance {
  id: string;
  instance_id: string;
  api_token: string;
  phone_number: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  is_green_api: boolean;
  created_at: string;
  webhook_url?: string;
  webhook_secret?: string;
  green_api_token?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  is_active: boolean;
}

interface BulkCampaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused';
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_at: string;
}

const WhatsAppHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  
  // State
  const [activeSection, setActiveSection] = useState<'overview' | 'messaging' | 'bulk' | 'templates' | 'analytics' | 'chat'>('chat');
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<BulkCampaign[]>([]);
  const [messages, setMessages] = useState<Array<{
    id: string;
    status: string;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickMessage, setShowQuickMessage] = useState(false);
  const [showBulkCreator, setShowBulkCreator] = useState(false);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<BulkCampaign[]>([]);
  
  // Template management state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    category: 'general',
    is_active: true
  });
  const [templateError, setTemplateError] = useState('');

  // Settings and Instance Management State
  const [showSettings, setShowSettings] = useState(false);
  const [showAddInstance, setShowAddInstance] = useState(false);
  const [showEditInstance, setShowEditInstance] = useState(false);
  const [editingInstance, setEditingInstance] = useState<WhatsAppInstance | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedInstanceForQr, setSelectedInstanceForQr] = useState<WhatsAppInstance | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    autoRefreshInterval: 30,
    defaultMessageType: 'text',
    enableNotifications: true,
    enableSoundAlerts: false,
    maxRetries: 3,
    messageDelay: 1000,
    enableWebhooks: true,
    enableAnalytics: true,
    enableBulkMessaging: true,
    enableTemplateManagement: true,
    greenApiInstanceId: '',
    greenApiToken: '',
    greenApiUrl: 'https://api.green-api.com'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  // Next refresh state (depends on settings)
  const [nextRefresh, setNextRefresh] = useState<Date>(new Date(Date.now() + 30 * 1000)); // Default 30 seconds
  
  // Real-time status updates
  const [statusUpdateInterval, setStatusUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Quick message state
  const [quickMessageData, setQuickMessageData] = useState({
    recipient: '',
    message: '',
    type: 'text' as 'text' | 'image' | 'document' | 'location' | 'contact',
    selectedInstance: ''
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);



  // Update quick message type when settings change
  useEffect(() => {
    setQuickMessageData(prev => ({
      ...prev,
      type: settings.defaultMessageType as 'text' | 'image' | 'document' | 'location' | 'contact'
    }));
  }, [settings.defaultMessageType]);

  // Real-time status updates
  useEffect(() => {
    if (settings.autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        loadData(true, true); // Silent refresh
      }, settings.autoRefreshInterval * 1000);
      
      setStatusUpdateInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        setStatusUpdateInterval(null);
      }
    }
  }, [settings.autoRefreshInterval]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
      }
    };
  }, [statusUpdateInterval]);

  // Redirect non-admin users
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + R to refresh
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        loadData(true);
      }
      
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Ctrl/Cmd + N for new quick message
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        setShowQuickMessage(true);
      }
      
      // Ctrl/Cmd + B for bulk creator
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setShowBulkCreator(true);
      }
      
      // Ctrl/Cmd + M for quick message
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        setShowQuickMessage(true);
      }
      
      // Ctrl/Cmd + T for templates
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault();
        setActiveSection('templates');
      }
      
      // Number keys for quick navigation
      if (event.key >= '1' && event.key <= '5' && !event.ctrlKey && !event.metaKey) {
        const sections = ['chat', 'overview', 'messaging', 'bulk', 'templates', 'analytics'];
        const index = parseInt(event.key) - 1;
        if (index < sections.length) {
          setActiveSection(sections[index] as 'overview' | 'messaging' | 'bulk' | 'templates' | 'analytics' | 'chat');
        }
      }
      
      // Escape to close modals
      if (event.key === 'Escape') {
        setShowQuickMessage(false);
        setShowBulkCreator(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load data
  useEffect(() => {
    console.log('🚀 Component mounted, loading data and settings...');
    console.log('👤 Current user ID:', currentUser?.id);
    loadData();
    loadSettings();
  }, []);

  // Set up real-time updates with dynamic interval
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false, true); // Silent refresh to prevent flickering
    }, settings.autoRefreshInterval * 1000); // Convert seconds to milliseconds
    
    // Update next refresh time
    setNextRefresh(new Date(Date.now() + settings.autoRefreshInterval * 1000));
    
    return () => clearInterval(interval);
  }, [settings.autoRefreshInterval]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to instance changes
    const instancesSubscription = supabase!
      .channel('whatsapp-instances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances'
        },
        (payload) => {
          console.log('Instance change detected:', payload);
          // Refresh instances data silently to prevent flickering
          loadData(true, true);
        }
      )
      .subscribe();

    // Subscribe to message queue changes
    const messagesSubscription = supabase!
      .channel('green-api-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'green_api_message_queue'
        },
        (payload) => {
          console.log('Message change detected:', payload);
          // Refresh messages data silently to prevent flickering
          loadData(true, true);
        }
      )
      .subscribe();

    // Subscribe to campaign changes
    const campaignsSubscription = supabase!
      .channel('green-api-campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'green_api_bulk_campaigns'
        },
        (payload) => {
          console.log('Campaign change detected:', payload);
          // Refresh campaigns data silently to prevent flickering
          loadData(true, true);
        }
      )
      .subscribe();

    return () => {
      instancesSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      campaignsSubscription.unsubscribe();
    };
  }, [currentUser]);

  // Filter data based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTemplates(templates);
      setFilteredCampaigns(campaigns);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      const filteredTemplatesData = templates.filter(template =>
        template.name.toLowerCase().includes(lowerSearchTerm) ||
        template.content.toLowerCase().includes(lowerSearchTerm) ||
        template.category.toLowerCase().includes(lowerSearchTerm)
      );
      
      const filteredCampaignsData = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(lowerSearchTerm) ||
        campaign.status.toLowerCase().includes(lowerSearchTerm)
      );
      
      setFilteredTemplates(filteredTemplatesData);
      setFilteredCampaigns(filteredCampaignsData);
    }
  }, [searchTerm, templates, campaigns]);

    const loadData = async (isRefresh = false, silent = false) => {
    if (isRefresh && !silent) {
      setRefreshing(true);
    } else if (isRefresh && silent) {
      setSilentRefreshing(true);
    } else if (!silent) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Load instances
      const { data: instancesData, error: instancesError } = await supabase!
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (instancesError) throw instancesError;
      setInstances(instancesData || []);

      // Load templates
      const { data: templatesData, error: templatesError } = await supabase!
        .from('green_api_message_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Load campaigns
      const { data: campaignsData, error: campaignsError } = await supabase!
        .from('green_api_bulk_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase!
        .from('green_api_message_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setError(errorMessage);
      if (!silent) {
        toast.error(errorMessage);
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
      if (silent) {
        setSilentRefreshing(false);
      }
      setLastUpdate(new Date());
      if (isRefresh && !silent) {
        toast.success('Data refreshed successfully');
      }
    }
  };

  // Message delivery tracking
  const trackMessageDelivery = async (messageId: string, instanceId: string) => {
    try {
      // Get message status from database
      const { data: messageData, error: fetchError } = await supabase!
        .from('green_api_message_queue')
        .select('*')
        .eq('id', messageId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching message:', fetchError);
        return null;
      }
      
      // Update message status based on queue status
      const queueStatus = await greenApiService.getMessageQueueStatus(instanceId);
      console.log('Message queue status:', queueStatus);
      
      // Find the specific message status
      const messageStatus = queueStatus.find((msg: any) => msg.id === messageId);
      
      if (messageStatus) {
        // Update message status in database
        const { error: updateError } = await supabase!
          .from('green_api_message_queue')
          .update({ 
            status: messageStatus.status,
            delivered_at: messageStatus.status === 'delivered' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', messageId);
        
        if (updateError) {
          console.error('Error updating message status:', updateError);
        }
        
        return messageStatus;
      }
      
      return null;
    } catch (error) {
      console.error('Error tracking message delivery:', error);
      return null;
    }
  };

  const handleQuickMessage = async () => {
    if (!quickMessageData.recipient || !quickMessageData.message || !quickMessageData.selectedInstance) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isSendingMessage) {
      toast.error('Please wait, message is being sent...');
      return;
    }

    // Prevent duplicate sends
    const messageKey = `${quickMessageData.recipient}-${quickMessageData.message}-${quickMessageData.selectedInstance}`;
    const lastSendTime = localStorage.getItem(`lastSend_${messageKey}`);
    const now = Date.now();
    
    if (lastSendTime && (now - parseInt(lastSendTime)) < 5000) {
      toast.error('Please wait 5 seconds before sending the same message again');
      return;
    }
    
    localStorage.setItem(`lastSend_${messageKey}`, now.toString());
    
    setIsSendingMessage(true);
    
    try {
      // Check if instance is connected
      const selectedInstance = instances.find(inst => inst.instance_id === quickMessageData.selectedInstance);
      if (!selectedInstance) {
        toast.error('Selected WhatsApp instance not found');
        return;
      }
      
      if (selectedInstance.status !== 'connected') {
        toast.error(`WhatsApp instance is not connected. Status: ${selectedInstance.status}`);
        return;
      }
      
      // Apply settings: message delay
      if (settings.messageDelay > 0) {
        toast.info(`Applying ${settings.messageDelay}ms delay before sending...`);
        await new Promise(resolve => setTimeout(resolve, settings.messageDelay));
      }
      
      // Apply settings: max retries
      let retryCount = 0;
      const maxRetries = settings.maxRetries;
      
      const sendMessageWithRetry = async (): Promise<boolean> => {
        try {
          console.log('Sending message via Green API:', {
            recipient: quickMessageData.recipient,
            message: quickMessageData.message,
            type: quickMessageData.type,
            instance: quickMessageData.selectedInstance,
            settings: {
              messageDelay: settings.messageDelay,
              maxRetries: settings.maxRetries,
              enableNotifications: settings.enableNotifications,
              enableSoundAlerts: settings.enableSoundAlerts
            }
          });
          
          // Send message via Green API
          const result = await greenApiService.sendMessage({
            instanceId: quickMessageData.selectedInstance,
            chatId: quickMessageData.recipient,
            message: quickMessageData.message,
            messageType: quickMessageData.type as 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'poll'
          });
          
          console.log('Green API response:', result);
          
          // Check message status after sending
          if (result.status === 'pending' || result.status === 'sending') {
            console.log('Message queued successfully with ID:', result.id);
          } else {
            throw new Error(`Message failed to queue. Status: ${result.status}`);
          }
          
          // Apply settings: notifications
          if (settings.enableNotifications) {
            toast.success(`Message sent successfully to ${quickMessageData.recipient}! Message ID: ${result.id}`);
          }
          
          // Apply settings: sound alerts
          if (settings.enableSoundAlerts) {
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {}); // Ignore if sound fails to play
          }
          
          // Reset form
          setQuickMessageData({
            recipient: '',
            message: '',
            type: settings.defaultMessageType as 'text' | 'image' | 'document' | 'location' | 'contact',
            selectedInstance: ''
          });
          setShowQuickMessage(false);
          
          // Refresh messages list to show the new message
          loadData();
          
          return true;
          
        } catch (error: any) {
          // Only retry if the message failed to be queued, not if the actual sending failed
          if (error.message.includes('failed to queue') || error.message.includes('Instance not found') || error.message.includes('not connected')) {
            retryCount++;
            if (retryCount <= maxRetries) {
              toast.warning(`Retry ${retryCount}/${maxRetries} - ${error.message}, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
              return sendMessageWithRetry();
            } else {
              throw new Error(`Failed to send message after ${maxRetries} retries: ${error.message}`);
            }
          } else {
            // For other errors (like API errors), don't retry as the message is already queued
            throw error;
          }
        }
      };
      
      await sendMessageWithRetry();
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send message';
      if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed. Please check your API credentials.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait before sending more messages.';
      } else if (error.message.includes('invalid phone')) {
        errorMessage = 'Invalid phone number format. Please include country code.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleBulkCreator = () => {
    if (!settings.enableBulkMessaging) {
      toast.error('Bulk messaging is disabled in settings');
      return;
    }
    
    setShowBulkCreator(false);
    // Stay on WhatsApp Hub page - bulk messaging will be handled here
    toast.success('Bulk messaging feature coming soon!');
  };

  const handleNavigateToGreenApi = (activeTab?: string, additionalState?: Record<string, unknown>) => {
    // Stay on WhatsApp Hub page - all functionality is now here
    toast.success('WhatsApp Hub is now your central messaging center!');
  };

  const handleTemplateSelection = (template: { template: MessageTemplate }) => {
    setShowBulkCreator(false);
    // Use template in WhatsApp Hub
    setQuickMessageData(prev => ({
      ...prev,
      message: template.template.content
    }));
    toast.success('Template applied to message!');
  };

  // Template management functions
  const openAddTemplate = () => {
    if (!settings.enableTemplateManagement) {
      toast.error('Template management is disabled in settings');
      return;
    }
    
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      content: '',
      category: 'general',
      is_active: true
    });
    setShowTemplateModal(true);
    setTemplateError('');
  };

  const openEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      content: template.content,
      category: template.category,
      is_active: template.is_active
    });
    setShowTemplateModal(true);
    setTemplateError('');
  };

  const handleTemplateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setTemplateForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name || !templateForm.content) {
      setTemplateError('Name and content are required.');
      return;
    }

    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase!
          .from('green_api_message_templates')
          .update({
            name: templateForm.name,
            content: templateForm.content,
            category: templateForm.category,
            is_active: templateForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const { error } = await supabase!
          .from('green_api_message_templates')
          .insert({
            name: templateForm.name,
            content: templateForm.content,
            category: templateForm.category,
            is_active: templateForm.is_active
          });

        if (error) throw error;
        toast.success('Template created successfully');
      }

      setShowTemplateModal(false);
      loadData(true); // Refresh data
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
      setTemplateError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase!
        .from('green_api_message_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      toast.success('Template deleted successfully');
      loadData(true); // Refresh data
    } catch (error) {
      console.error('Error deleting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
      toast.error(errorMessage);
    }
  };

  const handleToggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase!
        .from('green_api_message_templates')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) throw error;
      toast.success(`Template ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadData(true); // Refresh data
    } catch (error) {
      console.error('Error updating template status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template status';
      toast.error(errorMessage);
    }
  };

  // Instance Management Functions
  const handleAddInstance = () => {
    setShowAddInstance(true);
  };

  const handleEditInstance = (instance: WhatsAppInstance) => {
    setEditingInstance(instance);
    setShowEditInstance(true);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm('Are you sure you want to delete this instance? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase!
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;
      toast.success('Instance deleted successfully');
      loadData(true);
    } catch (error) {
      console.error('Error deleting instance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete instance';
      toast.error(errorMessage);
    }
  };

  const generateQrCode = async (instance: WhatsAppInstance) => {
    setQrLoading(true);
    setSelectedInstanceForQr(instance);
    setShowQrModal(true);

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instance.instance_id}/getQrCode/${instance.green_api_token || instance.api_token}`, {
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
        setQrCodeData(data.qrCode);
        toast.success('QR Code generated successfully');
      } else {
        throw new Error('No QR code received from Green API');
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(`Failed to generate QR code: ${error.message}`);
      setQrCodeData(null);
    } finally {
      setQrLoading(false);
    }
  };

  const checkInstanceState = async (instance: WhatsAppInstance) => {
    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instance.instance_id}/getStateInstance/${instance.green_api_token || instance.api_token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data || result;
      
      const newStatus = data.stateInstance === 'authorized' ? 'connected' : 
                       data.stateInstance === 'notAuthorized' ? 'disconnected' : 
                       data.stateInstance === 'blocked' ? 'error' : 'connecting';

      if (newStatus !== instance.status) {
        const { error } = await supabase!
          .from('whatsapp_instances')
          .update({ status: newStatus })
          .eq('id', instance.id);

        if (!error) {
          setInstances(prev => prev.map(i => 
            i.id === instance.id ? { ...i, status: newStatus } : i
          ));
        }
      }

      return data.stateInstance;
    } catch (error: any) {
      console.error('Error checking instance state:', error);
      return null;
    }
  };

  const logoutInstance = async (instance: WhatsAppInstance) => {
    if (!confirm('Are you sure you want to logout this instance? This will disconnect the WhatsApp device.')) {
      return;
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instance.instance_id}/logout/${instance.green_api_token || instance.api_token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { error } = await supabase!
        .from('whatsapp_instances')
        .update({ status: 'disconnected' })
        .eq('id', instance.id);

      if (!error) {
        setInstances(prev => prev.map(i => 
          i.id === instance.id ? { ...i, status: 'disconnected' } : i
        ));
        toast.success('Instance logged out successfully');
      }
    } catch (error: any) {
      console.error('Error logging out instance:', error);
      toast.error(`Failed to logout instance: ${error.message}`);
    }
  };

  // Settings Management Functions
  const loadSettings = async () => {
    try {
      console.log('🔧 Loading settings for user:', currentUser?.id);
      
      const { data, error } = await supabase!
        .from('whatsapp_hub_settings')
        .select('*')
        .eq('user_id', currentUser?.id)
        .single();

      if (error) {
        // If table doesn't exist or no settings found, use default settings
        if (error.code === 'PGRST116') {
          console.log('📋 No settings found for user, using defaults');
        } else {
          console.log('❌ Settings table not available, using defaults:', error.message);
          console.log('🔍 Error details:', error);
        }
        return;
      }

      if (data) {
        console.log('✅ Settings loaded from database:', data);
        const newSettings = {
          autoRefreshInterval: data.auto_refresh_interval || 30,
          defaultMessageType: data.default_message_type || 'text',
          enableNotifications: data.enable_notifications ?? true,
          enableSoundAlerts: data.enable_sound_alerts ?? false,
          maxRetries: data.max_retries || 3,
          messageDelay: data.message_delay || 1000,
          enableWebhooks: data.enable_webhooks ?? true,
          enableAnalytics: data.enable_analytics ?? true,
          enableBulkMessaging: data.enable_bulk_messaging ?? true,
          enableTemplateManagement: data.enable_template_management ?? true,
          greenApiInstanceId: data.green_api_instance_id || '',
          greenApiToken: data.green_api_token || '',
          greenApiUrl: data.green_api_url || 'https://api.green-api.com'
        };
        console.log('🔧 Applied settings:', newSettings);
        setSettings(newSettings);
        // Update next refresh time based on loaded settings
        setNextRefresh(new Date(Date.now() + newSettings.autoRefreshInterval * 1000));
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    // Validate settings before saving
    if (!validateSettings()) {
      return;
    }
    
    setSettingsLoading(true);
    try {
      console.log('💾 Saving settings for user:', currentUser?.id);
      console.log('📊 Settings to save:', settings);
      
      // First check if settings exist for this user
      const { data: existingSettings } = await supabase!
        .from('whatsapp_hub_settings')
        .select('id')
        .eq('user_id', currentUser?.id)
        .single();

      console.log('🔍 Existing settings check:', existingSettings ? 'Found' : 'Not found');

      const settingsData = {
        user_id: currentUser?.id,
        auto_refresh_interval: settings.autoRefreshInterval,
        default_message_type: settings.defaultMessageType,
        enable_notifications: settings.enableNotifications,
        enable_sound_alerts: settings.enableSoundAlerts,
        max_retries: settings.maxRetries,
        message_delay: settings.messageDelay,
        enable_webhooks: settings.enableWebhooks,
        enable_analytics: settings.enableAnalytics,
        enable_bulk_messaging: settings.enableBulkMessaging,
        enable_template_management: settings.enableTemplateManagement,
        green_api_instance_id: settings.greenApiInstanceId,
        green_api_token: settings.greenApiToken,
        green_api_url: settings.greenApiUrl,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Settings data to save:', settingsData);

      let error;
      if (existingSettings) {
        // Update existing settings
        console.log('🔄 Updating existing settings...');
        const { error: updateError } = await supabase!
          .from('whatsapp_hub_settings')
          .update(settingsData)
          .eq('user_id', currentUser?.id);
        error = updateError;
      } else {
        // Insert new settings
        console.log('➕ Inserting new settings...');
        const { error: insertError } = await supabase!
          .from('whatsapp_hub_settings')
          .insert(settingsData);
        error = insertError;
      }

      if (error) {
        console.error('❌ Database error:', error);
        // If table doesn't exist, show a helpful message
        if (error.code === 'PGRST301' || error.message.includes('does not exist')) {
          toast.error('Settings table not available. Please contact administrator to set up the database.');
        } else {
          throw error;
        }
        return;
      }
      
      console.log('✅ Settings saved successfully');
      toast.success('Settings saved successfully');
      
      // Show refresh interval update message
      const refreshMinutes = Math.round(settings.autoRefreshInterval / 60);
      if (refreshMinutes >= 1) {
        toast.success(`Auto refresh updated to ${refreshMinutes} minute${refreshMinutes > 1 ? 's' : ''}`);
      } else {
        toast.success(`Auto refresh updated to ${settings.autoRefreshInterval} seconds`);
      }
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings = {
        autoRefreshInterval: 30,
        defaultMessageType: 'text',
        enableNotifications: true,
        enableSoundAlerts: false,
        maxRetries: 3,
        messageDelay: 1000,
        enableWebhooks: true,
        enableAnalytics: true,
        enableBulkMessaging: true,
        enableTemplateManagement: true,
        greenApiInstanceId: '',
        greenApiToken: '',
        greenApiUrl: 'https://api.green-api.com'
      };
      setSettings(defaultSettings);
      
      // Update next refresh time
      setNextRefresh(new Date(Date.now() + defaultSettings.autoRefreshInterval * 1000));
      
      // Update quick message type
      setQuickMessageData(prev => ({
        ...prev,
        type: defaultSettings.defaultMessageType as 'text' | 'image' | 'document' | 'location' | 'contact'
      }));
      
      toast.success('Settings reset to defaults');
    }
  };

  // Validate and apply settings
  const validateSettings = () => {
    const issues = [];
    
    if (settings.autoRefreshInterval < 10 || settings.autoRefreshInterval > 3600) {
      issues.push('Auto refresh interval must be between 10 seconds and 1 hour');
    }
    
    if (settings.messageDelay < 500 || settings.messageDelay > 10000) {
      issues.push('Message delay must be between 500ms and 10 seconds');
    }
    
    if (settings.maxRetries < 1 || settings.maxRetries > 10) {
      issues.push('Max retries must be between 1 and 10');
    }
    
    if (issues.length > 0) {
      toast.error(`Settings validation failed: ${issues.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const getTemplateColorClasses = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      case 'indigo': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'connecting': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate delivery metrics
  const calculateDeliveryMetrics = () => {
    const totalMessages = messages.length;
    const deliveredMessages = messages.filter(m => ['sent', 'delivered', 'read'].includes(m.status)).length;
    const failedMessages = messages.filter(m => ['failed', 'rate_limited'].includes(m.status)).length;
    const deliveryRate = totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0;
    const successRate = totalMessages > 0 ? Math.round(((totalMessages - failedMessages) / totalMessages) * 100) : 0;

    return {
      totalMessages,
      deliveredMessages,
      failedMessages,
      deliveryRate,
      successRate
    };
  };

  // Calculate campaign metrics
  const calculateCampaignMetrics = () => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'sending').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const failedCampaigns = campaigns.filter(c => c.status === 'failed').length;
    
    const totalRecipients = campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
    const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered_count || 0), 0);
    
    const campaignSuccessRate = totalRecipients > 0 ? Math.round((totalDelivered / totalRecipients) * 100) : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      failedCampaigns,
      totalRecipients,
      totalSent,
      totalDelivered,
      campaignSuccessRate
    };
  };

  const metrics = calculateDeliveryMetrics();
  const campaignMetrics = calculateCampaignMetrics();

  // Auto-select instance if only one is connected
  useEffect(() => {
    const connectedInstances = instances.filter(i => i.status === 'connected');
    if (connectedInstances.length === 1 && !quickMessageData.selectedInstance) {
      setQuickMessageData(prev => ({
        ...prev,
        selectedInstance: connectedInstances[0].instance_id
      }));
    }
  }, [instances, quickMessageData.selectedInstance]);

  // Phone number formatting function
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // Remove duplicate + signs
    cleaned = cleaned.replace(/\+{2,}/g, '+');
    
    return cleaned;
  };

  // Handle phone number input with auto-formatting
  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setQuickMessageData(prev => ({ ...prev, recipient: formatted }));
  };





  if (loading) {
    return (
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-6xl mx-auto">
          <GlassCard className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3">
                <RefreshCw size={20} className="animate-spin text-green-600" />
                <span className="text-gray-600">Loading WhatsApp Hub...</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header - Hidden when in chat tab */}
          {activeSection !== 'chat' && (
            <GlassCard className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-green-500 to-green-600'} text-white`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <BackButton className="text-white hover:bg-white/20" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">WhatsApp Hub</h1>
                <p className="text-green-100 text-sm sm:text-base">Centralized WhatsApp messaging and management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                <MessageCircle size={16} />
                <span className="text-sm font-medium">
                  {instances.filter(i => i.status === 'connected').length} Connected
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                <Clock size={16} />
                <span className="text-sm font-medium">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                <RefreshCw size={16} className={silentRefreshing ? 'animate-spin text-green-400' : ''} />
                <span className="text-sm font-medium">
                  Auto-refresh: {settings.autoRefreshInterval >= 60 
                    ? `${Math.round(settings.autoRefreshInterval / 60)}m` 
                    : `${settings.autoRefreshInterval}s`}
                  {silentRefreshing && <span className="text-green-400 ml-1">•</span>}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                <Settings size={16} />
                <span className="text-sm font-medium">
                  Default: {settings.defaultMessageType.charAt(0).toUpperCase() + settings.defaultMessageType.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                <Bell size={16} />
                <span className="text-sm font-medium">
                  {settings.enableNotifications ? 'Notifications: ON' : 'Notifications: OFF'}
                </span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className={`p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors ${
                  refreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={`Next auto-refresh: ${nextRefresh.toLocaleTimeString()}`}
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

                                    {/* Search Bar */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <div className="flex-1 relative">
                              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200" />
                              <input
                                type="text"
                                placeholder="Search messages, campaigns, templates... (Ctrl+K)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 transition-all duration-200"
                  />
                            </div>
                            <button 
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className={`px-6 py-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-all duration-200 flex items-center gap-2 ${
                    refreshing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  <span className="font-medium">Refresh</span>
                            </button>
                          </div>
                                </GlassCard>
          )}

                        {/* Search Results Indicator */}
                        {searchTerm && (
                          <GlassCard className="p-4 bg-blue-50 border border-blue-200">
                            <div className="flex items-center gap-3">
                              <Search size={20} className="text-blue-600" />
                              <div>
                                <h3 className="text-blue-800 font-medium">Search Results</h3>
                                <p className="text-blue-600 text-sm">
                                  Found {filteredTemplates.length} templates and {filteredCampaigns.length} campaigns matching "{searchTerm}"
                                </p>
                              </div>
                              <button
                                onClick={() => setSearchTerm('')}
                                className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                              >
                                Clear Search
                              </button>
                            </div>
                          </GlassCard>
                        )}

                        {/* Error Display */}
                        {error && (
                          <GlassCard className="p-4 bg-red-50 border border-red-200">
                            <div className="flex items-center gap-3">
                              <AlertTriangle size={20} className="text-red-600" />
                              <div>
                                <h3 className="text-red-800 font-medium">Error Loading Data</h3>
                                <p className="text-red-600 text-sm">{error}</p>
                              </div>
                              <button
                                onClick={() => loadData(true)}
                                className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                              >
                                Retry
                              </button>
                            </div>
                          </GlassCard>
                        )}

                        {/* Navigation Tabs */}
            <GlassCard className="p-2 rounded-2xl">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'chat', label: 'Chat', icon: MessageCircle, color: 'teal' },
                  { id: 'overview', label: 'Overview', icon: BarChart3, color: 'green' },
                  { id: 'messaging', label: 'Messaging', icon: MessageCircle, color: 'blue' },
                  { id: 'bulk', label: 'Bulk Campaigns', icon: Send, color: 'purple' },
                  { id: 'templates', label: 'Templates', icon: FileText, color: 'orange' },
                  { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'indigo' }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
            <button
                      key={tab.id}
                      onClick={() => setActiveSection(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        activeSection === tab.id
                          ? `bg-${tab.color}-500 text-white shadow-lg`
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
            </button>
                  );
                })}
          </div>
        </GlassCard>

        {/* Content Area */}
        {activeSection === 'chat' ? (
          <WhatsAppChatPage
            instances={instances}
            isDark={isDark}
          />
        ) : (
          <GlassCard className="p-6 rounded-2xl">
          {activeSection === 'overview' && (
            <WhatsAppOverviewPage
              instances={instances}
              campaigns={campaigns}
              templates={templates}
              filteredTemplates={filteredTemplates}
              filteredCampaigns={filteredCampaigns}
              searchTerm={searchTerm}
              lastUpdate={lastUpdate}
              settings={settings}
              silentRefreshing={silentRefreshing}
              nextRefresh={nextRefresh}
              onShowQuickMessage={() => setShowQuickMessage(true)}
              onShowBulkCreator={() => setShowBulkCreator(true)}
              onShowTemplateManager={() => setShowTemplateManager(true)}
              onShowSettings={() => setShowSettings(true)}
              onLoadData={loadData}
                onSetActiveSection={(section: string) => setActiveSection(section as 'overview' | 'messaging' | 'bulk' | 'templates' | 'analytics' | 'chat')}
              isDark={isDark}
            />
          )}

          {activeSection === 'messaging' && (
            <WhatsAppMessagingPage
              instances={instances}
              messages={messages}
              searchTerm={searchTerm}
              onShowQuickMessage={() => setShowQuickMessage(true)}
              onSetQuickMessageData={setQuickMessageData}
              isDark={isDark}
            />
          )}

          {activeSection === 'bulk' && (
            <WhatsAppBulkPage
              campaigns={campaigns}
              filteredCampaigns={filteredCampaigns}
              searchTerm={searchTerm}
              onShowBulkCreator={() => setShowBulkCreator(true)}
              onNavigateToGreenApi={handleNavigateToGreenApi}
              isDark={isDark}
            />
          )}

          {activeSection === 'templates' && (
            <WhatsAppTemplatesPage
              templates={templates}
              filteredTemplates={filteredTemplates}
              searchTerm={searchTerm}
              onShowTemplateManager={() => setShowTemplateManager(true)}
              onOpenAddTemplate={openAddTemplate}
              onSetSearchTerm={setSearchTerm}
              isDark={isDark}
            />
          )}

          {activeSection === 'analytics' && (
            <WhatsAppAnalyticsPage
              campaigns={campaigns}
              messages={messages}
              metrics={metrics}
              campaignMetrics={campaignMetrics}
              onNavigateToGreenApi={handleNavigateToGreenApi}
              isDark={isDark}
            />
          )}
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default WhatsAppHubPage;