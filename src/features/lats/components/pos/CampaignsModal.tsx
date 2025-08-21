import React, { useState, useEffect } from 'react';
import { X, Megaphone, Users, Calendar, Send, RefreshCw, CheckCircle, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  customerLoyaltyService, 
  LoyaltyCustomer 
} from '../../../../lib/customerLoyaltyService';
import { toast } from '../../../../lib/toastUtils';

interface Campaign {
  id: string;
  name: string;
  message: string;
  targetTier: string;
  targetStatus: string;
  scheduledDate: string;
  type: 'whatsapp' | 'sms' | 'email';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipients: number;
  sent: number;
  failed: number;
  createdAt: string;
}

interface CampaignsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CampaignsModal: React.FC<CampaignsModalProps> = ({ isOpen, onClose }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignLoading, setCampaignLoading] = useState(false);
  
  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    targetTier: 'all',
    targetStatus: 'all',
    scheduledDate: '',
    type: 'whatsapp' as 'whatsapp' | 'sms' | 'email'
  });

  // Campaign templates
  const campaignTemplates = {
    welcome: {
      name: 'Welcome Campaign',
      message: '🎉 Welcome to our loyalty program! You\'ve earned {points} points on your first purchase. Thank you for choosing us!',
      targetTier: 'all',
      type: 'whatsapp'
    },
    pointsUpdate: {
      name: 'Points Update',
      message: '⭐ Great news! You\'ve earned {points} points on your recent purchase. Your total balance is now {totalPoints} points.',
      targetTier: 'all',
      type: 'whatsapp'
    },
    tierUpgrade: {
      name: 'Tier Upgrade',
      message: '👑 Congratulations! You\'ve been upgraded to {tier} tier! Enjoy exclusive benefits and rewards.',
      targetTier: 'all',
      type: 'whatsapp'
    },
    rewardAvailable: {
      name: 'Reward Available',
      message: '🎁 You have {points} points available for redemption! Visit us to claim your rewards.',
      targetTier: 'all',
      type: 'whatsapp'
    },
    birthday: {
      name: 'Birthday Wishes',
      message: '🎂 Happy Birthday! Enjoy {discount}% off on your special day. Valid until {expiryDate}.',
      targetTier: 'all',
      type: 'whatsapp'
    },
    anniversary: {
      name: 'Anniversary Celebration',
      message: '🎉 Happy Anniversary! Thank you for being a loyal customer. Enjoy double points on your next purchase!',
      targetTier: 'all',
      type: 'whatsapp'
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCampaigns();
    }
  }, [isOpen]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // Simulate API call - in real implementation, this would fetch from your campaigns service
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Welcome Campaign',
          message: 'Welcome to our loyalty program!',
          targetTier: 'all',
          targetStatus: 'active',
          scheduledDate: '2024-01-15T10:00:00',
          type: 'whatsapp',
          status: 'sent',
          recipients: 150,
          sent: 145,
          failed: 5,
          createdAt: '2024-01-15T09:00:00'
        },
        {
          id: '2',
          name: 'Points Update',
          message: 'Great news! You\'ve earned points!',
          targetTier: 'gold',
          targetStatus: 'active',
          scheduledDate: '2024-02-01T14:00:00',
          type: 'sms',
          status: 'scheduled',
          recipients: 75,
          sent: 0,
          failed: 0,
          createdAt: '2024-01-30T16:00:00'
        },
        {
          id: '3',
          name: 'Birthday Wishes',
          message: 'Happy Birthday! Enjoy your special discount!',
          targetTier: 'all',
          targetStatus: 'active',
          scheduledDate: '2024-03-01T09:00:00',
          type: 'whatsapp',
          status: 'draft',
          recipients: 25,
          sent: 0,
          failed: 0,
          createdAt: '2024-02-28T11:00:00'
        }
      ];
      
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = campaignTemplates[templateKey as keyof typeof campaignTemplates];
    setNewCampaign({
      ...newCampaign,
      name: template.name,
      message: template.message,
      targetTier: template.targetTier,
      type: template.type
    });
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCampaignLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const campaign: Campaign = {
        id: Date.now().toString(),
        ...newCampaign,
        targetStatus: 'active',
        status: 'draft',
        recipients: 0,
        sent: 0,
        failed: 0,
        createdAt: new Date().toISOString()
      };
      
      setCampaigns(prev => [campaign, ...prev]);
      setShowNewCampaign(false);
      setNewCampaign({
        name: '',
        message: '',
        targetTier: 'all',
        targetStatus: 'all',
        scheduledDate: '',
        type: 'whatsapp'
      });
      
      toast.success('Campaign created successfully');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
    } finally {
      setCampaignLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      setCampaignLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: 'sent', sent: campaign.recipients, failed: 0 }
          : campaign
      ));
      
      toast.success('Campaign sent successfully');
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Failed to send campaign');
    } finally {
      setCampaignLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <Megaphone className="w-4 h-4" />;
      case 'sms': return <Send className="w-4 h-4" />;
      case 'email': return <Send className="w-4 h-4" />;
      default: return <Megaphone className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-6xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Megaphone className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Campaigns Management</h2>
                <p className="text-sm text-gray-600">Create and manage customer campaigns</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <GlassButton
              onClick={() => setShowNewCampaign(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              Create Campaign
            </GlassButton>
            
            <button
              onClick={loadCampaigns}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {showNewCampaign ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaign Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter campaign name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Tier
                    </label>
                    <select
                      value={newCampaign.targetTier}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, targetTier: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Tiers</option>
                      <option value="bronze">Bronze</option>
                      <option value="silver">Silver</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Communication Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['whatsapp', 'sms', 'email'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setNewCampaign(prev => ({ ...prev, type }))}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors ${
                            newCampaign.type === type
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {getTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={newCampaign.scheduledDate}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Message and Templates */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Templates
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(campaignTemplates).map(([key, template]) => (
                        <button
                          key={key}
                          onClick={() => handleTemplateSelect(key)}
                          className="text-left p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {template.message.substring(0, 40)}...
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newCampaign.message}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your campaign message..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {newCampaign.message.length} characters
                      </span>
                      {newCampaign.type === 'sms' && (
                        <span className="text-xs text-gray-500">
                          {Math.ceil(newCampaign.message.length / 160)} SMS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <GlassButton
                  onClick={() => setShowNewCampaign(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={handleCreateCampaign}
                  disabled={campaignLoading || !newCampaign.name || !newCampaign.message}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                >
                  {campaignLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Create Campaign
                </GlassButton>
              </div>
            </div>
          ) : null}

          {/* Campaigns List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Campaigns ({campaigns.length})</h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">Loading campaigns...</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No campaigns found</p>
                <p className="text-sm">Create your first campaign to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(campaign.type)}
                            <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{campaign.message.substring(0, 100)}...</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Target: {campaign.targetTier}</span>
                          <span>Recipients: {campaign.recipients}</span>
                          <span>Sent: {campaign.sent}</span>
                          <span>Failed: {campaign.failed}</span>
                          <span>Created: {formatDate(campaign.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {campaign.status === 'draft' && (
                          <GlassButton
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            disabled={campaignLoading}
                            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                          >
                            {campaignLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </GlassButton>
                        )}
                        
                        <GlassButton
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            // View campaign details
                            toast.info('Campaign details feature coming soon');
                          }}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CampaignsModal;
