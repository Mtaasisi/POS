import React, { useState, useEffect } from 'react';
import { X, Users, Star, Gift, TrendingUp, MessageCircle, Phone, Mail, Send, BarChart3, Crown, Award, Clock, Filter, Download, Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle, Search, Megaphone } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  customerLoyaltyService, 
  LoyaltyCustomer, 
  LoyaltyMetrics, 
  LoyaltyTier, 
  LoyaltyReward, 
  PointTransaction 
} from '../../../../lib/customerLoyaltyService';
import { whatsappService } from '../../../../services/whatsappService';
import { smsService } from '../../../../services/smsService';
import { toast } from 'react-hot-toast';

// Import sub-modals
import PointsManagementModal from './PointsManagementModal';
import CommunicationModal from './CommunicationModal';
import RewardRedemptionModal from './RewardRedemptionModal';
import CustomerAnalyticsModal from './CustomerAnalyticsModal';
import CampaignsModal from './CampaignsModal';

interface CustomerLoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerLoyaltyModal: React.FC<CustomerLoyaltyModalProps> = ({ isOpen, onClose }) => {
  // Main state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [metrics, setMetrics] = useState<LoyaltyMetrics>({
    totalCustomers: 0,
    totalPoints: 0,
    vipCustomers: 0,
    activeCustomers: 0,
    totalSpent: 0,
    averagePoints: 0
  });
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);

  // Communication state
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedCustomerForCommunication, setSelectedCustomerForCommunication] = useState<LoyaltyCustomer | null>(null);
  const [communicationMessage, setCommunicationMessage] = useState('');
  const [communicationType, setCommunicationType] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [sendingCommunication, setSendingCommunication] = useState(false);

  // Points management state
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [selectedCustomerForPoints, setSelectedCustomerForPoints] = useState<LoyaltyCustomer | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  // Reward redemption state
  const [showRewardRedemption, setShowRewardRedemption] = useState(false);
  const [selectedCustomerForRedemption, setSelectedCustomerForRedemption] = useState<LoyaltyCustomer | null>(null);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [redemptionLoading, setRedemptionLoading] = useState(false);

  // Analytics state
  const [showCustomerAnalytics, setShowCustomerAnalytics] = useState(false);
  const [selectedCustomerForAnalytics, setSelectedCustomerForAnalytics] = useState<LoyaltyCustomer | null>(null);
  const [customerAnalyticsData, setCustomerAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Campaigns state
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPoints, setMinPoints] = useState('');
  const [maxPoints, setMaxPoints] = useState('');
  const [minSpent, setMinSpent] = useState('');
  const [maxSpent, setMaxSpent] = useState('');
  const [sortBy, setSortBy] = useState('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk operations state
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'points' | 'communication' | 'tier'>('points');
  const [bulkPointsAmount, setBulkPointsAmount] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLoyaltyData();
    }
  }, [isOpen]);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const [customersData, metricsData, tiersData, rewardsData] = await Promise.all([
        customerLoyaltyService.getCustomers(),
        customerLoyaltyService.getMetrics(),
        customerLoyaltyService.getTiers(),
        customerLoyaltyService.getRewards()
      ]);

      setCustomers(customersData);
      setMetrics(metricsData);
      setTiers(tiersData);
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error loading loyalty data:', error);
      toast.error('Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'all' || customer.tier === selectedTier;
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    
    // Advanced filters
    const matchesMinPoints = !minPoints || customer.points >= parseInt(minPoints);
    const matchesMaxPoints = !maxPoints || customer.points <= parseInt(maxPoints);
    const matchesMinSpent = !minSpent || customer.totalSpent >= parseInt(minSpent);
    const matchesMaxSpent = !maxSpent || customer.totalSpent <= parseInt(maxSpent);
    
    return matchesSearch && matchesTier && matchesStatus && 
           matchesMinPoints && matchesMaxPoints && matchesMinSpent && matchesMaxSpent;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'points':
        comparison = a.points - b.points;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'totalSpent':
        comparison = a.totalSpent - b.totalSpent;
        break;
      case 'joinDate':
        comparison = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        break;
      default:
        comparison = a.points - b.points;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-6xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Customer Loyalty</h2>
                <p className="text-sm text-gray-600">Manage customer loyalty program</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading loyalty data...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Metrics Cards */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Total Customers</p>
                        <p className="text-2xl font-bold">{metrics.totalCustomers.toLocaleString()}</p>
                      </div>
                      <Users className="w-8 h-8 opacity-80" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Total Points</p>
                        <p className="text-2xl font-bold">{metrics.totalPoints.toLocaleString()}</p>
                      </div>
                      <Star className="w-8 h-8 opacity-80" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">VIP Customers</p>
                        <p className="text-2xl font-bold">{metrics.vipCustomers.toLocaleString()}</p>
                      </div>
                      <Crown className="w-8 h-8 opacity-80" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Total Spent</p>
                        <p className="text-2xl font-bold">TZS {metrics.totalSpent.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 opacity-80" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="lg:col-span-3">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search customers by name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>
                  
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Tiers</option>
                    {tiers.map(tier => (
                      <option key={tier.id} value={tier.name}>{tier.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <GlassButton
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    variant="secondary"
                    className="px-4 py-3"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced
                  </GlassButton>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
                        <input
                          type="number"
                          value={minPoints}
                          onChange={(e) => setMinPoints(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Points</label>
                        <input
                          type="number"
                          value={maxPoints}
                          onChange={(e) => setMaxPoints(e.target.value)}
                          placeholder="10000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Spent</label>
                        <input
                          type="number"
                          value={minSpent}
                          onChange={(e) => setMinSpent(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Spent</label>
                        <input
                          type="number"
                          value={maxSpent}
                          onChange={(e) => setMaxSpent(e.target.value)}
                          placeholder="1000000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="points">Points</option>
                          <option value="name">Name</option>
                          <option value="totalSpent">Total Spent</option>
                          <option value="joinDate">Join Date</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="desc">Descending</option>
                          <option value="asc">Ascending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Customers ({filteredCustomers.length})</h3>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No customers found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredCustomers.map(customer => (
                          <div key={customer.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold">
                                      {customer.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                                    <p className="text-sm text-gray-600">{customer.phone}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(customer.tier)}`}>
                                  {customer.tier}
                                </span>
                                <span className="text-sm font-semibold text-blue-600">
                                  {customer.points} pts
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <GlassButton
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCustomerForPoints(customer);
                                    setShowPointsHistory(true);
                                  }}
                                  className="text-xs"
                                >
                                  <Star className="w-4 h-4" />
                                </GlassButton>
                                
                                <GlassButton
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedCustomerForCommunication(customer);
                                    setShowCommunicationModal(true);
                                  }}
                                  className="text-xs"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </GlassButton>
                                
                                <GlassButton
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedCustomerForAnalytics(customer);
                                    setShowCustomerAnalytics(true);
                                  }}
                                  className="text-xs"
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
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <GlassButton
                      onClick={() => {
                        // Add points to selected customer
                        if (selectedCustomerForPoints) {
                          setShowPointsHistory(true);
                        } else {
                          toast.error('Please select a customer first');
                        }
                      }}
                      className="w-full justify-start"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Add Points
                    </GlassButton>
                    
                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        setShowRewardRedemption(true);
                      }}
                      className="w-full justify-start"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem Rewards
                    </GlassButton>
                    
                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        setShowCommunicationModal(true);
                      }}
                      className="w-full justify-start"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </GlassButton>
                    
                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        setShowCustomerAnalytics(true);
                      }}
                      className="w-full justify-start"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </GlassButton>

                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        setShowCampaignsModal(true);
                      }}
                      className="w-full justify-start"
                    >
                      <Megaphone className="w-4 h-4 mr-2" />
                      Campaigns
                    </GlassButton>

                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        setShowBulkOperations(true);
                      }}
                      className="w-full justify-start"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Bulk Operations
                    </GlassButton>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">New customer registered</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Points added to VIP customer</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Reward redeemed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-modals */}
          <PointsManagementModal
            isOpen={showPointsHistory}
            onClose={() => setShowPointsHistory(false)}
            customer={selectedCustomerForPoints}
            onPointsUpdated={loadLoyaltyData}
          />

          <CommunicationModal
            isOpen={showCommunicationModal}
            onClose={() => setShowCommunicationModal(false)}
            customer={selectedCustomerForCommunication}
          />

          <RewardRedemptionModal
            isOpen={showRewardRedemption}
            onClose={() => setShowRewardRedemption(false)}
            customer={selectedCustomerForRedemption}
            onRedemptionComplete={loadLoyaltyData}
          />

          <CustomerAnalyticsModal
            isOpen={showCustomerAnalytics}
            onClose={() => setShowCustomerAnalytics(false)}
            customer={selectedCustomerForAnalytics}
          />

          <CampaignsModal
            isOpen={showCampaignsModal}
            onClose={() => setShowCampaignsModal(false)}
          />
        </div>
      </GlassCard>
    </div>
  );
};

export default CustomerLoyaltyModal;
