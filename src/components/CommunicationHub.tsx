import React, { useState, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import Modal from './ui/Modal';
import { Mail, Send, Plus, Edit, Trash2, Users, Calendar, MessageSquare, Bell, Gift, Star, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'promotional' | 'service' | 'reminder' | 'birthday' | 'loyalty';
  isActive: boolean;
  createdAt: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  targetAudience: 'all' | 'vip' | 'inactive' | 'active' | 'custom';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledDate?: string;
  sentCount: number;
  totalCount: number;
  createdAt: string;
}

interface CommunicationHubProps {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  isOpen: boolean;
  onClose: () => void;
}

const CommunicationHub: React.FC<CommunicationHubProps> = ({
  customerId,
  customerName,
  customerEmail,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'history' | 'quick-send'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick send state
  const [quickSendData, setQuickSendData] = useState({
    subject: '',
    content: '',
    recipients: customerId ? [customerId] : [],
    templateId: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadCampaigns();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const handleSaveTemplate = async (template: Omit<EmailTemplate, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update(template)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully!');
      } else {
        // Create new template
        const newTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date().toISOString()
        };

        const { error } = await supabase
          .from('email_templates')
          .insert([newTemplate]);

        if (error) throw error;
        toast.success('Template created successfully!');
      }

      setShowTemplateModal(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (campaign: Omit<EmailCampaign, 'id' | 'createdAt' | 'sentCount' | 'totalCount'>) => {
    setLoading(true);
    try {
      if (editingCampaign) {
        // Update existing campaign
        const { error } = await supabase
          .from('email_campaigns')
          .update(campaign)
          .eq('id', editingCampaign.id);

        if (error) throw error;
        toast.success('Campaign updated successfully!');
      } else {
        // Create new campaign
        const newCampaign = {
          ...campaign,
          id: `campaign-${Date.now()}`,
          sentCount: 0,
          totalCount: 0,
          createdAt: new Date().toISOString()
        };

        const { error } = await supabase
          .from('email_campaigns')
          .insert([newCampaign]);

        if (error) throw error;
        toast.success('Campaign created successfully!');
      }

      setShowCampaignModal(false);
      setEditingCampaign(null);
      await loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSend = async () => {
    if (!quickSendData.subject || !quickSendData.content) {
      toast.error('Please fill in subject and content');
      return;
    }

    setLoading(true);
    try {
      // Here you would integrate with your email service
      // For now, we'll simulate sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Email sent successfully!');
      setQuickSendData({ subject: '', content: '', recipients: [], templateId: '' });
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: EmailTemplate['category']) => {
    switch (category) {
      case 'promotional': return <Gift size={16} />;
      case 'service': return <Smartphone size={16} />;
      case 'reminder': return <Bell size={16} />;
      case 'birthday': return <Calendar size={16} />;
      case 'loyalty': return <Star size={16} />;
      default: return <Mail size={16} />;
    }
  };

  const getStatusColor = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'draft': return 'text-gray-500';
      case 'scheduled': return 'text-blue-500';
      case 'sending': return 'text-yellow-500';
      case 'sent': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Communication Hub" maxWidth="6xl">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'templates', label: 'Email Templates', icon: <Mail size={16} /> },
            { id: 'campaigns', label: 'Campaigns', icon: <Send size={16} /> },
            { id: 'history', label: 'History', icon: <Calendar size={16} /> },
            { id: 'quick-send', label: 'Quick Send', icon: <MessageSquare size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
              <GlassButton
                onClick={() => {
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
                icon={<Plus size={16} />}
              >
                New Template
              </GlassButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <GlassCard key={template.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.category)}
                      <span className="text-sm text-gray-500 capitalize">{template.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateModal(true);
                        }}
                      />
                      <GlassButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={14} />}
                      />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mt-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{template.content}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {template.variables.length} variables
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Email Campaigns</h3>
              <GlassButton
                onClick={() => {
                  setEditingCampaign(null);
                  setShowCampaignModal(true);
                }}
                icon={<Plus size={16} />}
              >
                New Campaign
              </GlassButton>
            </div>

            <div className="space-y-3">
              {campaigns.map(campaign => (
                <GlassCard key={campaign.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${getStatusColor(campaign.status)}`}>
                        {campaign.status === 'sent' && <CheckCircle size={16} />}
                        {campaign.status === 'sending' && <AlertCircle size={16} />}
                        {campaign.status === 'failed' && <AlertCircle size={16} />}
                        {campaign.status === 'draft' && <Mail size={16} />}
                        {campaign.status === 'scheduled' && <Calendar size={16} />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">Template: {campaign.templateName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {campaign.sentCount}/{campaign.totalCount}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{campaign.status}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <span>Target: {campaign.targetAudience}</span>
                    {campaign.scheduledDate && (
                      <span>Scheduled: {new Date(campaign.scheduledDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Mail size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Communication history will be displayed here</p>
              <p className="text-sm text-gray-500 mt-2">Track all emails, SMS, and other communications</p>
            </div>
          </div>
        )}

        {/* Quick Send Tab */}
        {activeTab === 'quick-send' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Send Email</h3>
            
            {customerId && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>To:</strong> {customerName} ({customerEmail})
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={quickSendData.subject}
                  onChange={(e) => setQuickSendData({ ...quickSendData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={quickSendData.content}
                  onChange={(e) => setQuickSendData({ ...quickSendData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email content..."
                />
              </div>

              <div className="flex gap-3">
                <GlassButton
                  onClick={handleQuickSend}
                  disabled={loading || !quickSendData.subject || !quickSendData.content}
                  icon={<Send size={16} />}
                >
                  {loading ? 'Sending...' : 'Send Email'}
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={() => setQuickSendData({ subject: '', content: '', recipients: [], templateId: '' })}
                >
                  Clear
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <TemplateModal
          isOpen={showTemplateModal}
          onClose={() => {
            setShowTemplateModal(false);
            setEditingTemplate(null);
          }}
          template={editingTemplate}
          onSave={handleSaveTemplate}
          loading={loading}
        />
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <CampaignModal
          isOpen={showCampaignModal}
          onClose={() => {
            setShowCampaignModal(false);
            setEditingCampaign(null);
          }}
          campaign={editingCampaign}
          templates={templates}
          onSave={handleSaveCampaign}
          loading={loading}
        />
      )}
    </Modal>
  );
};

// Template Modal Component
interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSave: (template: Omit<EmailTemplate, 'id' | 'createdAt'>) => void;
  loading: boolean;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, template, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    category: template?.category || 'promotional',
    isActive: template?.isActive ?? true,
    variables: template?.variables || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Edit Template' : 'New Template'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="promotional">Promotional</option>
              <option value="service">Service</option>
              <option value="reminder">Reminder</option>
              <option value="birthday">Birthday</option>
              <option value="loyalty">Loyalty</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter email content. Use {{variable}} for dynamic content..."
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active Template</label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <GlassButton variant="secondary" onClick={onClose} type="button">
            Cancel
          </GlassButton>
          <GlassButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </GlassButton>
        </div>
      </form>
    </Modal>
  );
};

// Campaign Modal Component
interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: EmailCampaign | null;
  templates: EmailTemplate[];
  onSave: (campaign: Omit<EmailCampaign, 'id' | 'createdAt' | 'sentCount' | 'totalCount'>) => void;
  loading: boolean;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, campaign, templates, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    templateId: campaign?.templateId || '',
    targetAudience: campaign?.targetAudience || 'all',
    status: campaign?.status || 'draft',
    scheduledDate: campaign?.scheduledDate || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTemplate = templates.find(t => t.id === formData.templateId);
    onSave({
      ...formData,
      templateName: selectedTemplate?.name || ''
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={campaign ? 'Edit Campaign' : 'New Campaign'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
          <select
            value={formData.templateId}
            onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a template</option>
            {templates.filter(t => t.isActive).map(template => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <select
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Customers</option>
            <option value="vip">VIP Customers</option>
            <option value="inactive">Inactive Customers</option>
            <option value="active">Active Customers</option>
            <option value="custom">Custom Selection</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {formData.status === 'scheduled' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date</label>
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <GlassButton variant="secondary" onClick={onClose} type="button">
            Cancel
          </GlassButton>
          <GlassButton type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Campaign'}
          </GlassButton>
        </div>
      </form>
    </Modal>
  );
};

export default CommunicationHub; 