import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCustomers } from '../../../context/CustomersContext';
import { smsService } from '../../../services/smsService';
import { supabase } from '../../../lib/supabaseClient';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassInput from '../../../features/shared/components/ui/EnhancedInput';
import Modal from '../../../features/shared/components/ui/Modal';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import { 
  Send, 
  FileText, 
  Clock, 
  Settings, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowLeft,
  Users,
  Crown,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Smartphone,
  Wrench,
  Award,
  Tag,
  DollarSign,
  Calendar,
  Filter,
  Zap,
  Play,
  MessageSquare,
  Brain
} from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { Customer, LoyaltyLevel, CustomerTag } from '../../../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import SMSLogDetailsModal from '../components/SMSLogDetailsModal';
// WhatsApp component import removed
import { DeviceStatus } from '../../../types';

// Type definitions
interface SMSLog {
  id: string;
  phone_number: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  error_message?: string;
  sent_at?: string;
  sent_by?: string;
  created_at: string;
}

interface SMSTemplate {
  id: string;
  title: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SMSTrigger {
  id: string;
  name: string;
  status: DeviceStatus;
  template_id: string;
  created_at?: string;
  condition?: any;
}

interface SMSTriggerLog {
  id: string;
  created_at: string;
  trigger_id: string;
  device_id: string;
  customer_id: string;
  status: string;
  template_id: string;
  recipient: string;
  result: string;
  error: string | null;
}

const DEFAULT_SETTINGS = {
  sms_price: 15,
  sms_provider_api_key: '',
  sms_provider_username: '',
  sms_provider_password: '',
  sms_sender_id: '',
  sms_api_url: '',
  sms_default_template: '',
  sms_enable_auto: true,
  sms_enable_bulk: true,
  sms_test_mode: false,
  sms_daily_limit: 500,
  sms_monthly_limit: 10000,
  sms_log_retention_days: 365,
  sms_default_language: 'en',
  sms_custom_variables: '{}',
  sms_notification_email: '',
};

const TAB_LIST = [
  { key: 'send', label: 'Send SMS', icon: <Send size={16} /> },
  { key: 'templates', label: 'Templates', icon: <FileText size={16} /> },
  { key: 'triggers', label: 'Triggers', icon: <Zap size={16} /> },
];

const SMSControlCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { customers } = useCustomers();
  const [activeTab, setActiveTab] = useState('send');
  const [selectedTab, setSelectedTab] = useState('send');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [triggers, setTriggers] = useState<SMSTrigger[]>([]);
  const [scheduledSMS, setScheduledSMS] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendLater, setSendLater] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSendResult, setCsvSendResult] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ title: '', content: '', variables: [] as string[] });
  const [templateError, setTemplateError] = useState('');
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<SMSTrigger | null>(null);
  const [triggerForm, setTriggerForm] = useState({ name: '', status: '', template_id: '', brand: '', customerTag: '' });
  const [triggerError, setTriggerError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({ sms_price: 0 });
  const [smsPrice, setSmsPrice] = useState<number>(15);
  const [smsPriceLoading, setSmsPriceLoading] = useState(false);
  const [smsPriceSaving, setSmsPriceSaving] = useState(false);
  const [smsPriceError, setSmsPriceError] = useState<string | null>(null);
  const [smsPriceSuccess, setSmsPriceSuccess] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState<string | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SMSLog | null>(null);
  const [customerSmsResult, setCustomerSmsResult] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Missing state variables
  const [triggerLogs, setTriggerLogs] = useState<SMSTriggerLog[]>([]);
  const [triggerLogSearch, setTriggerLogSearch] = useState('');
  const [triggerLogResultFilter, setTriggerLogResultFilter] = useState('');
  const [triggerSearch, setTriggerSearch] = useState('');
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [analytics, setAnalytics] = useState<{ total: number; sent: number; failed: number; pending: number; delivered: number; totalCost: number }>({ total: 0, sent: 0, failed: 0, pending: 0, delivered: 0, totalCost: 0 });
  
  // Modal state variables
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTrigger, setPreviewTrigger] = useState<SMSTrigger | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTrigger, setTestTrigger] = useState<SMSTrigger | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showDeleteTriggerModal, setShowDeleteTriggerModal] = useState(false);
  const [triggerToDelete, setTriggerToDelete] = useState<SMSTrigger | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; open: boolean }>({ message: '', type: 'success', open: false });
  
  // Enhanced bulk SMS state
  const [selectedSegment, setSelectedSegment] = useState<string>('allCustomers');
  const [customFilters, setCustomFilters] = useState({
    loyaltyLevel: '',
    colorTag: '',
    minSpent: '',
    maxSpent: '',
    hasDevices: false,
    hasActiveRepairs: false,
    lastVisitDays: ''
  });
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [bulkSmsMode, setBulkSmsMode] = useState<'manual' | 'segmented' | 'csv'>('manual');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  
  // WhatsApp integration removed
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Enhanced customer segmentation for bulk SMS
  const getCustomerSegments = () => {
    const allCustomers = customers || [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    return {
      // Value-based segments
      highValue: allCustomers.filter(c => c.totalSpent > 1000),
      mediumValue: allCustomers.filter(c => c.totalSpent >= 500 && c.totalSpent <= 1000),
      lowValue: allCustomers.filter(c => c.totalSpent < 500),
      
      // Activity-based segments
      recentVisitors: allCustomers.filter(c => {
        if (!c.lastVisit) return false;
        const lastVisit = new Date(c.lastVisit);
        return lastVisit > thirtyDaysAgo;
      }),
      inactiveCustomers: allCustomers.filter(c => {
        if (!c.lastVisit) return false;
        const lastVisit = new Date(c.lastVisit);
        return lastVisit < ninetyDaysAgo;
      }),
      
      // Device-based segments
      deviceOwners: allCustomers.filter(c => c.devices && c.devices.length > 0),
      repairCustomers: allCustomers.filter(c => 
        c.devices && c.devices.some(d => 
          d.status === 'in-repair' || d.status === 'diagnosis-started'
        )
      ),
      completedRepairs: allCustomers.filter(c => 
        c.devices && c.devices.some(d => d.status === 'done')
      ),
      
      // Loyalty-based segments
      platinumCustomers: allCustomers.filter(c => c.loyaltyLevel === 'platinum'),
      goldCustomers: allCustomers.filter(c => c.loyaltyLevel === 'gold'),
      silverCustomers: allCustomers.filter(c => c.loyaltyLevel === 'silver'),
      bronzeCustomers: allCustomers.filter(c => c.loyaltyLevel === 'bronze'),
      
      // Tag-based segments
      vipCustomers: allCustomers.filter(c => c.colorTag === 'vip'),
      newCustomers: allCustomers.filter(c => c.colorTag === 'new'),
      complainers: allCustomers.filter(c => c.colorTag === 'complainer'),
      
      // Behavioral segments
      highSpenders: allCustomers.filter(c => c.totalSpent > 2000),
      frequentVisitors: allCustomers.filter(c => {
        if (!c.lastVisit) return false;
        const lastVisit = new Date(c.lastVisit);
        return lastVisit > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }),
      pointsEarners: allCustomers.filter(c => c.points > 100),
      
      // All customers
      allCustomers: allCustomers
    };
  };

  const customerSegments = getCustomerSegments();

  // Fetch sms_price from DB when modal opens
  useEffect(() => {
    if (showSettingsModal) {
      setSmsPriceLoading(true);
      setSmsPriceError(null);
      setSmsPriceSuccess(null);
      supabase
        .from('settings')
        .select('value')
        .eq('key', 'sms_price')
        .single()
        .then(({ data, error }) => {
          if (error) {
            setSmsPriceError('Failed to load price from database');
          } else if (data && data.value) {
            setSmsPrice(parseFloat(data.value));
          }
          setSmsPriceLoading(false);
        });
    }
  }, [showSettingsModal]);

  // Save price to DB
  const handleSaveSmsPrice = async () => {
    setSmsPriceSaving(true);
    setSmsPriceError(null);
    setSmsPriceSuccess(null);
    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'sms_price', value: smsPrice.toString() }, { onConflict: 'key' });
    if (error) {
      setSmsPriceError('Failed to save price');
    } else {
      setSmsPriceSuccess('Price saved!');
    }
    setSmsPriceSaving(false);
  };

  const handleSmsPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSmsPrice(parseFloat(e.target.value));
    setSmsPriceSuccess(null);
    setSmsPriceError(null);
  };

  // Fetch SMS logs
  useEffect(() => {
    setLoading(true);
    smsService.getSMSLogs(search ? { search } : undefined).then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, [search]);

  // Fetch templates
  useEffect(() => {
    smsService.getTemplates().then(setTemplates);
  }, [showTemplateModal]);

  // Fetch analytics
  useEffect(() => {
    smsService.getSMSStats().then(setAnalytics);
  }, [logs]);

  // Fetch triggers
  useEffect(() => {
    supabase.from('sms_triggers').select('*').then(({ data }) => {
      setTriggers(data || []);
    });
  }, [showTriggerModal]);

  // Fetch trigger logs
  useEffect(() => {
    let query = supabase.from('sms_trigger_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (triggerLogResultFilter) query = query.eq('result', triggerLogResultFilter);
    if (triggerLogSearch) query = query.or(`recipient.ilike.%${triggerLogSearch}%,error.ilike.%${triggerLogSearch}%,status.ilike.%${triggerLogSearch}%`);
    query.then(({ data }) => setTriggerLogs(data || []));
  }, [triggerLogSearch, triggerLogResultFilter]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch scheduled SMS for current user
  useEffect(() => {
    if (!currentUser) return;
    setLoadingScheduled(true);
    supabase
      .from('scheduled_sms')
      .select('*')
      .eq('created_by', currentUser.id)
      .order('scheduled_for', { ascending: true })
      .then(({ data }) => {
        setScheduledSMS(data || []);
        setLoadingScheduled(false);
      });
  }, [currentUser, sendResult]);

  // Enhanced bulk SMS handler with customer segmentation
  const handleEnhancedBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendResult(null);
    
    let targetCustomers: Customer[] = [];
    
    // Get customers based on selected mode
    if (bulkSmsMode === 'segmented') {
      // Use customer segments
      if (selectedSegment && customerSegments[selectedSegment as keyof typeof customerSegments]) {
        targetCustomers = customerSegments[selectedSegment as keyof typeof customerSegments];
      }
    } else if (bulkSmsMode === 'manual') {
      // Use manually selected customers
      targetCustomers = customers.filter(c => selectedCustomers.includes(c.id));
    } else {
      // CSV mode - use existing logic
      return handleSendBulkSMS(e);
    }
    
    if (targetCustomers.length === 0) {
      setSendResult('No customers selected for bulk SMS.');
      return;
    }
    
    // Apply custom filters if any
    if (customFilters.loyaltyLevel) {
      targetCustomers = targetCustomers.filter(c => c.loyaltyLevel === customFilters.loyaltyLevel);
    }
    if (customFilters.colorTag) {
      targetCustomers = targetCustomers.filter(c => c.colorTag === customFilters.colorTag);
    }
    if (customFilters.minSpent) {
      targetCustomers = targetCustomers.filter(c => c.totalSpent >= parseFloat(customFilters.minSpent));
    }
    if (customFilters.maxSpent) {
      targetCustomers = targetCustomers.filter(c => c.totalSpent <= parseFloat(customFilters.maxSpent));
    }
    if (customFilters.hasDevices) {
      targetCustomers = targetCustomers.filter(c => c.devices && c.devices.length > 0);
    }
    if (customFilters.hasActiveRepairs) {
      targetCustomers = targetCustomers.filter(c => 
        c.devices && c.devices.some(d => 
          d.status === 'in-repair' || d.status === 'diagnosis-started'
        )
      );
    }
    if (customFilters.lastVisitDays) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(customFilters.lastVisitDays));
      targetCustomers = targetCustomers.filter(c => {
        if (!c.lastVisit) return false;
        return new Date(c.lastVisit) > daysAgo;
      });
    }
    
    const phoneNumbers = targetCustomers.map(c => c.phone).filter(Boolean);
    
    if (phoneNumbers.length === 0) {
      setSendResult('No valid phone numbers found in selected customers.');
      return;
    }
    
    // Send SMS using existing logic
    if (selectedTemplateId) {
      // Use template
      const template = templates.find(t => String(t.id) === selectedTemplateId);
      if (!template) {
        setSendResult('Template not found.');
        return;
      }
      
      setSendResult('Sending segmented SMS...');
      let successCount = 0;
      
      for (const customer of targetCustomers) {
        if (!customer.phone) continue;
        
        // Personalize message with customer data
        let personalizedMessage = template.content;
        personalizedMessage = personalizedMessage.replace(/{name}/g, customer.name || 'Customer');
        personalizedMessage = personalizedMessage.replace(/{loyaltyLevel}/g, customer.loyaltyLevel || 'bronze');
        personalizedMessage = personalizedMessage.replace(/{totalSpent}/g, customer.totalSpent?.toString() || '0');
        personalizedMessage = personalizedMessage.replace(/{points}/g, customer.points?.toString() || '0');
        
        const result = await smsService.sendSMS(customer.phone, personalizedMessage);
        if (result.success) successCount++;
      }
      
      setSendResult(`Sent personalized SMS to ${successCount} of ${targetCustomers.length} customers.`);
    } else {
      // Free text
      if (!bulkMessage) {
        setSendResult('Please enter a message or select a template.');
        return;
      }
      
      setSendResult('Sending bulk SMS...');
      let successCount = 0;
      
      for (const phone of phoneNumbers) {
        const result = await smsService.sendSMS(phone, bulkMessage);
        if (result.success) successCount++;
      }
      
      setSendResult(`Sent to ${successCount} of ${phoneNumbers.length} customers.`);
    }
    
    // Reset form
    setBulkMessage('');
    setSelectedTemplateId('');
    setSelectedCustomers([]);
    setCustomFilters({
      loyaltyLevel: '',
      colorTag: '',
      minSpent: '',
      maxSpent: '',
      hasDevices: false,
      hasActiveRepairs: false,
      lastVisitDays: ''
    });
  };

  // Original bulk SMS handler for CSV and manual number entry
  const handleSendBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendResult(null);
    const numbers = bulkNumbers.split(',').map(n => n.trim()).filter(Boolean);
    if (!numbers.length) {
      setSendResult('Please enter numbers.');
      return;
    }
    if (sendLater && scheduledDate && currentUser) {
      let message = bulkMessage;
      let templateId: string | null = null;
      let variables: Record<string, string> | null = null;
      if (selectedTemplateId) {
        const template = templates.find(t => String(t.id) === selectedTemplateId);
        if (!template) {
          setSendResult('Template not found.');
          return;
        }
        templateId = template.id;
        // Parse variables from template
        const variableNames = template.variables || [];
        variables = {};
        variableNames.forEach((v: string) => {
          variables![v] = prompt(`Enter value for ${v}:`, '') || '';
        });
        message = template.content;
        Object.entries(variables).forEach(([k, v]) => {
          message = message.replace(new RegExp(`{${k}}`, 'g'), v);
        });
      }
      const result = await smsService.scheduleSMS({
        numbers,
        message,
        templateId,
        variables,
        scheduledFor: scheduledDate,
        createdBy: currentUser.id,
      });
      if (result.success) {
        setSendResult('SMS scheduled for ' + scheduledDate.toLocaleString());
        setBulkNumbers('');
        setBulkMessage('');
        setSelectedTemplateId('');
        setSendLater(false);
        setScheduledDate(null);
      } else {
        setSendResult('Failed to schedule SMS: ' + (result.error || 'Unknown error'));
      }
      return;
    }
    if (selectedTemplateId) {
      // Use template
      const template = templates.find(t => String(t.id) === selectedTemplateId);
      if (!template) {
        setSendResult('Template not found.');
        return;
      }
      // Parse variables from template
      const variableNames = template.variables || [];
      const variables: Record<string, string> = {};
      variableNames.forEach((v: string) => {
        variables[v] = prompt(`Enter value for ${v}:`, '') || '';
      });
      setSendResult('Sending...');
      let successCount = 0;
      for (const phone of numbers) {
        const result = await smsService.sendTemplateSMS(phone, template.id, variables);
        if (result.success) successCount++;
      }
      setSendResult(`Sent using template to ${successCount} of ${numbers.length} numbers.`);
    } else {
      // Free text
      if (!bulkMessage) {
        setSendResult('Please enter a message or select a template.');
        return;
      }
      setSendResult('Sending...');
      let successCount = 0;
      for (const phone of numbers) {
        const result = await smsService.sendSMS(phone, bulkMessage);
        if (result.success) successCount++;
      }
      setSendResult(`Sent to ${successCount} of ${numbers.length} numbers.`);
    }
    setBulkNumbers('');
    setBulkMessage('');
    setSelectedTemplateId('');
  };

  // CSV upload handler
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    setCsvRows([]);
    setCsvSendResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file as any, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        if (!results.data || !Array.isArray(results.data)) {
          setCsvError('Invalid CSV format.');
          return;
        }
        if (results.errors && results.errors.length > 0) {
          setCsvError(results.errors.map(e => e.message).join('; '));
          return;
        }
        setCsvRows(results.data as any[]);
        setCsvPreviewOpen(true);
      }
    });
  };
  // Bulk send from CSV
  const handleSendBulkCsv = async () => {
    if (!selectedTemplateId) { setCsvSendResult('Select a template.'); return; }
    const template = templates.find(t => String(t.id) === String(selectedTemplateId));
    if (!template) { setCsvSendResult('Template not found.'); return; }
    setCsvSending(true);
    let success = 0, fail = 0;
    for (const row of csvRows) {
      const phone = row.phone || row['Phone'] || row['PHONE'];
      if (!phone) { fail++; continue; }
      const variables: Record<string, string> = {};
      if (template.variables && Array.isArray(template.variables)) {
        template.variables.forEach((v: string) => { variables[v] = row[v] || ''; });
      }
      const result = await smsService.sendTemplateSMS(phone, template.id, variables);
      if (result.success) success++; else fail++;
    }
    setCsvSendResult(`Sent to ${success} numbers. Failed: ${fail}`);
    setCsvSending(false);
  };

  // Template modal handlers
  const openAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ title: '', content: '', module: '', variables: '' });
    setShowTemplateModal(true);
    setTemplateError('');
  };
  const openEditTemplate = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      title: template.title,
      content: template.content,
      module: template.module,
      variables: (template.variables || []).join(',')
    });
    setShowTemplateModal(true);
    setTemplateError('');
  };
  const handleTemplateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTemplateForm({ ...templateForm, [e.target.name]: e.target.value });
  };
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.title || !templateForm.content) {
      setTemplateError('Title and content are required.');
      return;
    }
    // Save to supabase
    const variablesArr = templateForm.variables.split(',').map(v => v.trim()).filter(Boolean);
    if (editingTemplate) {
      // Update
      await supabase
        .from('communication_templates')
        .update({
          title: templateForm.title,
          content: templateForm.content,
          template_type: templateForm.module,  // Changed from module to template_type
          variables: variablesArr,
          created_by: currentUser?.id  // Add the current user ID
        })
        .eq('id', editingTemplate.id);
    } else {
      // Insert
      await supabase
        .from('communication_templates')
        .insert({
          title: templateForm.title,
          content: templateForm.content,
          template_type: templateForm.module,  // Changed from module to template_type
          variables: variablesArr,
          is_active: true,
          created_by: currentUser?.id  // Add the current user ID
        });
    }
    setShowTemplateModal(false);
  };
  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    await supabase.from('communication_templates').delete().eq('id', id);
    setTemplates(templates.filter(t => String(t.id) !== id));
  };

  // Trigger modal handlers
  const openAddTrigger = () => {
    setTriggerForm({ name: '', status: '', template_id: '', brand: '', customerTag: '' });
    setEditingTrigger(null);
    setShowTriggerModal(true);
    setTriggerError('');
  };
  const openEditTrigger = (trigger: SMSTrigger) => {
    setTriggerForm({
      name: trigger.name || '',
      status: trigger.status || '',
      template_id: trigger.template_id || '',
      brand: trigger.condition?.brand || '',
      customerTag: trigger.condition?.customerTag || ''
    });
    setEditingTrigger(trigger);
    setShowTriggerModal(true);
    setTriggerError('');
  };
  const handleTriggerFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setTriggerForm({ ...triggerForm, [e.target.name]: e.target.value });
  };
  const handleSaveTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerForm.name || !triggerForm.status || !triggerForm.template_id) {
      setTriggerError('Name, status, and template are required.');
      return;
    }
    const payload = {
      name: triggerForm.name,
      trigger_type: triggerForm.status,  // Changed from trigger_event to trigger_type
      message_template: triggerForm.template_id,
      is_active: true,
      created_by: currentUser?.id  // Add the current user ID
    };
    if (editingTrigger) {
      // Update existing trigger
      await supabase.from('sms_triggers').update(payload).eq('id', editingTrigger.id);
      showToast('Trigger updated successfully!', 'success');
    } else {
      // Create new trigger
      await supabase.from('sms_triggers').insert(payload);
      showToast('Trigger created successfully!', 'success');
    }
    setShowTriggerModal(false);
    setEditingTrigger(null);
  };
  const handleDeleteTrigger = (triggerId: string) => {
    const trigger = triggers.find(t => t.id === triggerId) || null;
    setTriggerToDelete(trigger);
    setShowDeleteTriggerModal(true);
  };
  const confirmDeleteTrigger = async () => {
    if (triggerToDelete) {
      await supabase.from('sms_triggers').delete().eq('id', triggerToDelete.id);
      showToast('Trigger deleted successfully!', 'success');
      setTriggerToDelete(null);
      setShowDeleteTriggerModal(false);
    }
  };

  // Per-log actions
  const handleResend = async (logId: string) => {
    setResendLoading(logId);
    await smsService.resendSMS(logId);
    setResendLoading(null);
    // Refresh logs
    smsService.getSMSLogs(search ? { search } : undefined).then(setLogs);
  };
  const handleViewLog = (log: SMSLog) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  // Preview/Test handlers
  const handlePreviewTrigger = (trigger: SMSTrigger) => {
    setPreviewTrigger(trigger);
    setShowPreviewModal(true);
  };
  const handleTestTrigger = (trigger: SMSTrigger) => {
    setTestTrigger(trigger);
    setTestPhone('');
    setTestResult(null);
    setShowTestModal(true);
  };
  const handleSendTestSMS = async () => {
    if (!testTrigger || !testPhone) return;
    const template = templates.find(t => String(t.id) === String(testTrigger.template_id));
    if (!template) { setTestResult('Template not found.'); return; }
    // Use dummy/sample variables
    const variables: Record<string, string> = {};
    if (template.variables && Array.isArray(template.variables)) {
      template.variables.forEach((v: string) => { variables[v] = v.toUpperCase(); });
    }
    setTestResult('Sending...');
    const result = await smsService.sendTemplateSMS(testPhone, template.id, variables);
    setTestResult(result.success ? 'Test SMS sent!' : `Failed: ${result.error}`);
  };

  const handleCancelScheduled = async (id: string) => {
    await supabase.from('scheduled_sms').update({ status: 'cancelled' }).eq('id', id);
    setScheduledSMS(scheduledSMS.map(sms => sms.id === id ? { ...sms, status: 'cancelled' } : sms));
    setShowCancelModal(false);
    setCancelId(null);
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(s => ({ ...s, [key]: value }));
    setSettingsSuccess(null);
    setSettingsError(null);
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(null);
    // Prepare upsert array
    const upserts = Object.entries(settings).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));
    const { error } = await supabase.from('settings').upsert(upserts, { onConflict: 'key' });
    if (error) {
      setSettingsError('Failed to save settings');
    } else {
      setSettingsSuccess('Settings saved!');
    }
    setSettingsSaving(false);
  };

  // Filter triggers before rendering
  const filteredTriggers = triggers.filter(t => {
    const template = templates.find(temp => String(temp.id) === String(t.template_id));
    const search = triggerSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(search) ||
      (t.status || '').toLowerCase().includes(search) ||
      (template?.title?.toLowerCase() || '').includes(search)
    );
  });

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, open: true });
    setTimeout(() => setToast(t => ({ ...t, open: false })), 3000);
  };

  // Add a function to insert a fake old log and run cleanup
  const insertOldLogAndCleanup = async () => {
    // Insert a fake old log
    const { error } = await supabase.from('sms_logs').insert({
      id: crypto.randomUUID(),
      phone_number: '255700000000',
      message: 'Test old log',
      status: 'sent',
      provider: 'test-provider',
      created_at: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString()
    });
    if (error) {
      showToast('Failed to insert old log: ' + error.message, 'error');
      return;
    }
    // Run cleanup
    await smsService.runCleanupNow();
    showToast('Inserted old log and ran cleanup. Check console for deletion message.', 'success');
  };

  // Add a function to refresh templates
  const refreshTemplates = async () => {
    await smsService.getTemplates().then(setTemplates);
    showToast('Templates refreshed!', 'success');
  };

  // Fetch settings from database when settings tab is selected
  useEffect(() => {
    if (selectedTab === 'settings') {
      setSettingsLoading(true);
      supabase.from('settings').select('key, value').then(({ data, error }) => {
        if (!error && data) {
          const newSettings = { ...DEFAULT_SETTINGS };
          (data as { key: keyof typeof DEFAULT_SETTINGS; value: string }[]).forEach((row) => {
            if (row.key in newSettings) {
              if (typeof newSettings[row.key] === 'boolean') {
                (newSettings as any)[row.key] = row.value === 'true';
              } else if (typeof newSettings[row.key] === 'number') {
                (newSettings as any)[row.key] = parseFloat(row.value);
              } else {
                (newSettings as any)[row.key] = row.value;
              }
            }
          });
          setSettings(newSettings);
        }
        setSettingsLoading(false);
      });
    }
  }, [selectedTab]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {isOffline && (
        <div style={{ background: '#f87171', color: 'white', padding: '8px', textAlign: 'center' }}>
          You are offline. SMS features may be limited.
        </div>
      )}
      
      {/* Header */}
      <PageHeader
        title="LATS System Dashboard - SMS Center"
        subtitle="Customer care SMS management"
        backButton={{
          label: "Back to Dashboard",
          onClick: () => navigate('/dashboard')
        }}
        actions={[
          {
            label: "Simple Logs",
            variant: "secondary",
            onClick: () => navigate('/sms-logs')
          },
          {
            label: "Refresh",
            icon: <RefreshCw size={16} />,
            variant: "secondary",
            onClick: () => window.location.reload()
          }
        ]}
        className="mb-6"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <GlassCard className="p-3 text-center">
          <div className="text-xl font-bold text-blue-600 mb-1">{analytics.sent}</div>
          <div className="text-xs text-gray-600">Sent</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-xl font-bold text-emerald-600 mb-1">{analytics.delivered}</div>
          <div className="text-xs text-gray-600">Delivered</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-xl font-bold text-rose-600 mb-1">{analytics.failed}</div>
          <div className="text-xs text-gray-600">Failed</div>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <div className="text-xl font-bold text-amber-600 mb-1">{analytics.pending}</div>
          <div className="text-xs text-gray-600">Pending</div>
        </GlassCard>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-1 mb-4 pb-2 scrollbar-hide">
        {TAB_LIST.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 flex-shrink-0 min-w-[80px] ${
              selectedTab === tab.key
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white/50 text-gray-700 hover:bg-white/60'
            }`}
          >
            {tab.icon}
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>


              {selectedTab === 'send' && (
          <GlassCard className="mb-4">
            <form onSubmit={handleEnhancedBulkSMS} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Send SMS</h3>
                <div className="flex gap-1">
                  <GlassButton
                    type="button"
                    variant={bulkSmsMode === 'manual' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setBulkSmsMode('manual')}
                  >
                    Manual Numbers
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant={bulkSmsMode === 'segmented' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setBulkSmsMode('segmented')}
                  >
                    Customer Segments
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant={bulkSmsMode === 'csv' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setBulkSmsMode('csv')}
                  >
                    CSV Upload
                  </GlassButton>
                </div>
              </div>

              {/* Manual Numbers Mode */}
              {bulkSmsMode === 'manual' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-medium">Phone Numbers</label>
                    <textarea
                      name="bulkNumbers"
                      value={bulkNumbers}
                      onChange={(e) => setBulkNumbers(e.target.value)}
                      placeholder="Enter phone numbers separated by commas"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Customer Segments Mode */}
              {bulkSmsMode === 'segmented' && (
                <div className="space-y-4">
                  {/* Segment Selection */}
                  <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Customer Segment</label>
                    <select
                      value={selectedSegment}
                      onChange={(e) => setSelectedSegment(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="allCustomers">All Customers ({customerSegments.allCustomers.length})</option>
                      <option value="highValue">High Value Customers ({customerSegments.highValue.length})</option>
                      <option value="mediumValue">Medium Value Customers ({customerSegments.mediumValue.length})</option>
                      <option value="lowValue">Low Value Customers ({customerSegments.lowValue.length})</option>
                      <option value="recentVisitors">Recent Visitors ({customerSegments.recentVisitors.length})</option>
                      <option value="inactiveCustomers">Inactive Customers ({customerSegments.inactiveCustomers.length})</option>
                      <option value="deviceOwners">Device Owners ({customerSegments.deviceOwners.length})</option>
                      <option value="repairCustomers">Customers with Active Repairs ({customerSegments.repairCustomers.length})</option>
                      <option value="completedRepairs">Customers with Completed Repairs ({customerSegments.completedRepairs.length})</option>
                      <option value="platinumCustomers">Platinum Customers ({customerSegments.platinumCustomers.length})</option>
                      <option value="goldCustomers">Gold Customers ({customerSegments.goldCustomers.length})</option>
                      <option value="silverCustomers">Silver Customers ({customerSegments.silverCustomers.length})</option>
                      <option value="bronzeCustomers">Bronze Customers ({customerSegments.bronzeCustomers.length})</option>
                      <option value="vipCustomers">VIP Customers ({customerSegments.vipCustomers.length})</option>
                      <option value="newCustomers">New Customers ({customerSegments.newCustomers.length})</option>
                      <option value="complainers">Complainers ({customerSegments.complainers.length})</option>
                      <option value="highSpenders">High Spenders ({customerSegments.highSpenders.length})</option>
                      <option value="frequentVisitors">Frequent Visitors ({customerSegments.frequentVisitors.length})</option>
                      <option value="pointsEarners">Points Earners ({customerSegments.pointsEarners.length})</option>
                    </select>
                  </div>

                  {/* Custom Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm font-medium">Loyalty Level</label>
                      <select
                        value={customFilters.loyaltyLevel}
                        onChange={(e) => setCustomFilters({...customFilters, loyaltyLevel: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Any Level</option>
                        <option value="platinum">Platinum</option>
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="bronze">Bronze</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm font-medium">Customer Tag</label>
                      <select
                        value={customFilters.colorTag}
                        onChange={(e) => setCustomFilters({...customFilters, colorTag: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Any Tag</option>
                        <option value="vip">VIP</option>
                        <option value="new">New</option>
                        <option value="complainer">Complainer</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm font-medium">Min Spent</label>
                      <input
                        type="number"
                        value={customFilters.minSpent}
                        onChange={(e) => setCustomFilters({...customFilters, minSpent: e.target.value})}
                        placeholder="0"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm font-medium">Max Spent</label>
                      <input
                        type="number"
                        value={customFilters.maxSpent}
                        onChange={(e) => setCustomFilters({...customFilters, maxSpent: e.target.value})}
                        placeholder="No limit"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm font-medium">Last Visit (Days)</label>
                      <input
                        type="number"
                        value={customFilters.lastVisitDays}
                        onChange={(e) => setCustomFilters({...customFilters, lastVisitDays: e.target.value})}
                        placeholder="Any time"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasDevices"
                        checked={customFilters.hasDevices}
                        onChange={(e) => setCustomFilters({...customFilters, hasDevices: e.target.checked})}
                        className="rounded"
                      />
                      <label htmlFor="hasDevices" className="text-sm text-gray-700">Has Devices</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hasActiveRepairs"
                        checked={customFilters.hasActiveRepairs}
                        onChange={(e) => setCustomFilters({...customFilters, hasActiveRepairs: e.target.checked})}
                        className="rounded"
                      />
                      <label htmlFor="hasActiveRepairs" className="text-sm text-gray-700">Has Active Repairs</label>
                    </div>
                  </div>

                  {/* Segment Preview */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Preview:</strong> This will send SMS to approximately{' '}
                      {(() => {
                        let targetCustomers = customerSegments[selectedSegment as keyof typeof customerSegments] || [];
                        // Apply filters
                        if (customFilters.loyaltyLevel) {
                          targetCustomers = targetCustomers.filter(c => c.loyaltyLevel === customFilters.loyaltyLevel);
                        }
                        if (customFilters.colorTag) {
                          targetCustomers = targetCustomers.filter(c => c.colorTag === customFilters.colorTag);
                        }
                        if (customFilters.minSpent) {
                          targetCustomers = targetCustomers.filter(c => c.totalSpent >= parseFloat(customFilters.minSpent));
                        }
                        if (customFilters.maxSpent) {
                          targetCustomers = targetCustomers.filter(c => c.totalSpent <= parseFloat(customFilters.maxSpent));
                        }
                        if (customFilters.hasDevices) {
                          targetCustomers = targetCustomers.filter(c => c.devices && c.devices.length > 0);
                        }
                        if (customFilters.hasActiveRepairs) {
                          targetCustomers = targetCustomers.filter(c => 
                            c.devices && c.devices.some(d => 
                              d.status === 'in-repair' || d.status === 'diagnosis-started'
                            )
                          );
                        }
                        if (customFilters.lastVisitDays) {
                          const daysAgo = new Date();
                          daysAgo.setDate(daysAgo.getDate() - parseInt(customFilters.lastVisitDays));
                          targetCustomers = targetCustomers.filter(c => {
                            if (!c.lastVisit) return false;
                            return new Date(c.lastVisit) > daysAgo;
                          });
                        }
                        return targetCustomers.length;
                      })()} customers
                    </p>
                  </div>
                </div>
              )}

              {/* CSV Upload Mode */}
              {bulkSmsMode === 'csv' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-700 mb-1 text-sm font-medium">Upload CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {csvError && (
                    <div className="text-red-600 text-sm">{csvError}</div>
                  )}
                  {csvRows.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Preview:</strong> {csvRows.length} rows loaded
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Message and Template Selection */}
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-medium">Template (Optional)</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No template (free text)</option>
                    {templates.map(t => (
                      <option key={String(t.id)} value={String(t.id)}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-medium">Message</label>
                  <textarea
                    name="bulkMessage"
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    placeholder="Enter your message here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                  {selectedTemplateId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Template variables: {'{name}'}, {'{loyaltyLevel}'}, {'{totalSpent}'}, {'{points}'}
                    </p>
                  )}
                </div>
              </div>

              {/* Send Options */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sendLater"
                    checked={sendLater}
                    onChange={(e) => setSendLater(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="sendLater" className="text-sm text-gray-700">Schedule for later</label>
                </div>
                {sendLater && (
                  <input
                    type="datetime-local"
                    value={scheduledDate ? scheduledDate.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setScheduledDate(e.target.value ? new Date(e.target.value) : null)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              <GlassButton type="submit" className="w-full" disabled={isOffline}>
                {sendLater ? 'Schedule SMS' : 'Send SMS'}
              </GlassButton>

              {sendResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  sendResult.includes('Sent') || sendResult.includes('scheduled') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {sendResult}
                </div>
              )}
            </form>
          </GlassCard>
        )}
            {selectedTab === 'logs' && (
        <GlassCard className="mb-4">
          <div className="flex flex-col gap-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">SMS Logs</h3>
            <SearchBar onSearch={setSearch} placeholder="Search logs..." />
          </div>
          {loading ? (
            <div className="py-6 text-center text-gray-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-6 text-center text-gray-500">No SMS logs found.</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, idx) => (
                <div key={String(log.id ?? idx)} className="bg-white/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">{log.created_at?.slice(0, 19).replace('T', ' ')}</div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                      log.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                      log.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      log.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{log.phone_number}</div>
                  <p className="text-sm text-gray-600 line-clamp-2">{log.message}</p>
                  {log.error_message && (
                    <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded">
                      Error: {log.error_message}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <GlassButton size="sm" icon={<Eye size={12}/>} variant="secondary" onClick={() => handleViewLog(log)}>View</GlassButton>
                    {log.status === 'failed' && (
                      <GlassButton size="sm" icon={resendLoading === log.id ? <RefreshCw className="animate-spin" size={12}/> : <RefreshCw size={12}/>} variant="primary" onClick={() => handleResend(log.id)} disabled={!!resendLoading}>
                        Resend
                      </GlassButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}
            {selectedTab === 'templates' && (
        <GlassCard className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><FileText size={18}/> Templates</h3>
            <div className="flex gap-1">
              <GlassButton icon={<RefreshCw size={14} />} variant="secondary" onClick={refreshTemplates} size="sm">Refresh</GlassButton>
              <GlassButton icon={<Plus size={14} />} variant="secondary" onClick={openAddTemplate} size="sm">New</GlassButton>
            </div>
          </div>
          {templates.length === 0 && <div className="py-3 text-blue-700 text-sm">No templates found. Click <b>New</b> to create your first template!</div>}
          {templates.length === 0 ? (
            <div className="py-6 text-center text-gray-500">No templates found.</div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <div key={String(t.id)} className="bg-white/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{t.title}</h4>
                    <div className="flex gap-1">
                      <GlassButton size="sm" icon={<Edit size={12}/>} variant="primary" onClick={() => openEditTemplate(t)}>Edit</GlassButton>
                      <GlassButton size="sm" icon={<Trash2 size={12}/>} variant="danger" onClick={() => handleDeleteTemplate(String(t.id))}>Delete</GlassButton>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{t.content}</p>
                  {(t.variables || []).length > 0 && (
                    <div className="text-xs text-gray-500">
                      Variables: {(t.variables || []).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {selectedTab === 'triggers' && (
        <GlassCard className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Zap size={18}/> SMS Triggers</h3>
            <div className="flex gap-1">
              <GlassButton icon={<Plus size={14} />} variant="secondary" onClick={openAddTrigger} size="sm">New Trigger</GlassButton>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-3">
            <SearchBar onSearch={setTriggerSearch} placeholder="Search triggers..." />
          </div>

          {triggers.length === 0 ? (
            <div className="py-6 text-center text-gray-500">No triggers found. Click <b>New Trigger</b> to create your first trigger!</div>
          ) : (
            <div className="space-y-2">
              {filteredTriggers.map(t => {
                const template = templates.find(temp => String(temp.id) === String(t.template_id));
                return (
                  <div key={String(t.id)} className="bg-white/40 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{t.name}</h4>
                      <div className="flex gap-1">
                        <GlassButton size="sm" icon={<Eye size={12}/>} variant="secondary" onClick={() => handlePreviewTrigger(t)}>Preview</GlassButton>
                        <GlassButton size="sm" icon={<Play size={12}/>} variant="primary" onClick={() => handleTestTrigger(t)}>Test</GlassButton>
                        <GlassButton size="sm" icon={<Edit size={12}/>} variant="primary" onClick={() => openEditTrigger(t)}>Edit</GlassButton>
                        <GlassButton size="sm" icon={<Trash2 size={12}/>} variant="danger" onClick={() => handleDeleteTrigger(String(t.id))}>Delete</GlassButton>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Status: <span className="font-medium">{(t.status || '').replace(/-/g, ' ')}</span></div>
                      <div>Template: <span className="font-medium">{template?.title || 'Unknown'}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={editingTemplate ? 'Edit Template' : 'New Template'}
        maxWidth="90vw"
      >
        <form onSubmit={handleSaveTemplate} className="space-y-3">
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={templateForm.title}
              onChange={handleTemplateFormChange}
              className="w-full py-2 px-3 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Content</label>
            <textarea
              name="content"
              value={templateForm.content}
              onChange={handleTemplateFormChange}
              rows={4}
              className="w-full py-2 px-3 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Use {'{variable}'} for variables. Example: Hello {'{name}'}</p>
          </div>
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Variables (comma separated)</label>
            <input
              type="text"
              name="variables"
              value={templateForm.variables}
              onChange={handleTemplateFormChange}
              className="w-full py-2 px-3 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              placeholder="name, code"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Module (optional)</label>
            <input
              type="text"
              name="module"
              value={templateForm.module}
              onChange={handleTemplateFormChange}
              className="w-full py-2 px-3 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              placeholder="device, customer"
            />
          </div>
          {templateError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{templateError}</div>}
          <div className="flex gap-2 pt-2">
            <GlassButton type="submit" variant="primary" className="flex-1">
              {editingTemplate ? 'Update' : 'Create'}
            </GlassButton>
            <GlassButton type="button" variant="secondary" onClick={() => setShowTemplateModal(false)}>
              Cancel
            </GlassButton>
          </div>
        </form>
      </Modal>

      {/* Trigger Modal */}
      <Modal
        isOpen={showTriggerModal}
        onClose={() => { setShowTriggerModal(false); setEditingTrigger(null); }}
        title={editingTrigger ? 'Edit SMS Trigger' : 'New SMS Trigger'}
        maxWidth="500px"
      >
        <form onSubmit={handleSaveTrigger} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={triggerForm.name}
              onChange={handleTriggerFormChange}
              className="w-full py-2 px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-medium">Device Status</label>
            <select
              name="status"
              value={triggerForm.status}
              onChange={handleTriggerFormChange}
              className="w-full py-2 px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            >
              <option value="">-- Select Status --</option>
              {['received','assigned-to-technician','in-repair','repair-complete','ready-for-pickup','done','failed'].map(status => (
                <option key={status} value={status}>{(status || '').replace(/-/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1 font-medium">SMS Template</label>
            <select
              name="template_id"
              value={triggerForm.template_id}
              onChange={handleTriggerFormChange}
              className="w-full py-2 px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            >
              <option value="">-- Select Template --</option>
              {templates.map(t => (
                <option key={String(t.id)} value={String(t.id)}>{t.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1 font-medium">Customer Tag (optional)</label>
            <select
              name="customerTag"
              value={triggerForm.customerTag}
              onChange={handleTriggerFormChange}
              className="w-full py-2 px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">-- Any Tag --</option>
              {['vip','new','complainer'].map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          {triggerError && <div className="text-red-600 text-sm">{triggerError}</div>}
          <div className="flex gap-3 justify-end mt-4">
            <GlassButton type="button" variant="secondary" onClick={() => { setShowTriggerModal(false); setEditingTrigger(null); }}>Cancel</GlassButton>
            <GlassButton type="submit" variant="primary">{editingTrigger ? 'Update' : 'Create'}</GlassButton>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Trigger Preview"
        maxWidth="500px"
      >
        {previewTrigger && (() => {
          const template = templates.find(t => String(t.id) === String(previewTrigger.template_id));
          if (!template) return <div>Template not found.</div>;
                const sampleVars: Record<string, string> = {};
      if (template.variables && Array.isArray(template.variables)) {
        template.variables.forEach((v: string) => { sampleVars[v] = v.toUpperCase(); });
      }
          let previewMsg = template.content;
          Object.entries(sampleVars).forEach(([k, v]) => {
            previewMsg = previewMsg.replace(new RegExp(`{${k}}`, 'g'), v);
          });
          return (
            <div className="space-y-3">
              <div><span className="font-semibold text-gray-700">Template:</span> {template.title}</div>
              <div><span className="font-semibold text-gray-700">Raw Content:</span> <span className="break-words">{template.content}</span></div>
              <div><span className="font-semibold text-gray-700">Sample Message:</span> <span className="break-words">{previewMsg}</span></div>
              <div><span className="font-semibold text-gray-700">Sample Variables:</span> {Object.entries(sampleVars).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
            </div>
          );
        })()}
      </Modal>

      {/* Test Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Test Trigger"
        maxWidth="500px"
      >
        {testTrigger && (() => {
          const template = templates.find(t => String(t.id) === String(testTrigger.template_id));
          if (!template) return <div>Template not found.</div>;
          return (
            <form onSubmit={e => { e.preventDefault(); handleSendTestSMS(); }} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Phone Number</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  className="w-full py-2 px-4 bg-white/30 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. 0712345678"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-medium">Message Preview</label>
                <div className="p-3 bg-white/40 rounded-lg border border-white/20 text-gray-800">
                  {(() => {
                    let msg = template.content;
                    if (template.variables && Array.isArray(template.variables)) {
                      template.variables.forEach((v: string) => { msg = msg.replace(new RegExp(`{${v}}`, 'g'), v.toUpperCase()); });
                    }
                    return msg;
                  })()}
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <GlassButton type="button" variant="secondary" onClick={() => setShowTestModal(false)}>Cancel</GlassButton>
                <GlassButton type="submit" variant="primary">Send Test SMS</GlassButton>
              </div>
              {testResult && <div className="mt-2 text-sm text-gray-700">{testResult}</div>}
            </form>
          );
        })()}
      </Modal>

      {/* Scheduled SMS Section */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Scheduled SMS" maxWidth="400px">
        <div className="text-gray-800 mb-4">Are you sure you want to cancel this scheduled SMS?</div>
        <div className="flex gap-3 justify-end">
          <GlassButton type="button" variant="secondary" onClick={() => setShowCancelModal(false)}>No</GlassButton>
          <GlassButton type="button" variant="danger" onClick={() => cancelId && handleCancelScheduled(cancelId)}>Yes, Cancel</GlassButton>
        </div>
      </Modal>
      {/* Render the SMSLogDetailsModal at the root level */}
      {selectedLog && (
        <SMSLogDetailsModal
          log={selectedLog}
          isOpen={showLogDetails}
          onClose={() => { setShowLogDetails(false); setSelectedLog(null); }}
        />
      )}

      {/* Delete Trigger Confirmation Modal */}
      <Modal
        isOpen={showDeleteTriggerModal}
        onClose={() => { setShowDeleteTriggerModal(false); setTriggerToDelete(null); }}
        title="Delete Trigger"
        maxWidth="400px"
      >
        <div className="text-gray-800 mb-4">Are you sure you want to delete the trigger <b>{triggerToDelete?.name}</b>?</div>
        <div className="flex gap-3 justify-end">
          <GlassButton type="button" variant="secondary" onClick={() => { setShowDeleteTriggerModal(false); setTriggerToDelete(null); }}>Cancel</GlassButton>
          <GlassButton type="button" variant="danger" onClick={confirmDeleteTrigger}>Yes, Delete</GlassButton>
        </div>
      </Modal>

      {/* WhatsApp Bulk Sender Modal - Removed */}

      {/* Toast component */}
      {toast.open && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default SMSControlCenterPage; 