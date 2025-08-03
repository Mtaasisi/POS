import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Gift, Star, Crown, Users, Award, CreditCard, ShoppingBag, TrendingUp, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  joinDate: Date;
  lastVisit: Date;
  rewardsRedeemed: number;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountAmount?: number;
  discountPercentage?: number;
  category: 'discount' | 'free_item' | 'cashback' | 'upgrade';
  isActive: boolean;
  tierRequired: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface LoyaltyProgramProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelect?: (customer: Customer) => void;
  onRewardRedeem?: (reward: Reward, customer: Customer) => void;
}

const LoyaltyProgram: React.FC<LoyaltyProgramProps> = ({ 
  isOpen, 
  onClose, 
  onCustomerSelect,
  onRewardRedeem 
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'rewards' | 'analytics'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from database
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchRewards();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('loyalty_customers')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            email
          )
        `)
        .order('points', { ascending: false });

      if (error) throw error;

      const formattedCustomers: Customer[] = (data || []).map((loyaltyCustomer: any) => ({
        id: loyaltyCustomer.customer_id,
        name: loyaltyCustomer.customers?.name || 'Unknown Customer',
        phone: loyaltyCustomer.customers?.phone || '',
        email: loyaltyCustomer.customers?.email || '',
        points: loyaltyCustomer.points || 0,
        tier: loyaltyCustomer.tier || 'bronze',
        totalSpent: loyaltyCustomer.total_spent || 0,
        joinDate: new Date(loyaltyCustomer.join_date || Date.now()),
        lastVisit: new Date(loyaltyCustomer.last_visit || Date.now()),
        rewardsRedeemed: loyaltyCustomer.rewards_redeemed || 0
      }));

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (error) throw error;

      const formattedRewards: Reward[] = (data || []).map((reward: any) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description || '',
        pointsCost: reward.points_cost,
        discountAmount: reward.discount_amount,
        discountPercentage: reward.discount_percentage,
        category: reward.category || 'discount',
        isActive: reward.is_active,
        tierRequired: reward.tier_required || 'bronze'
      }));

      setRewards(formattedRewards);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError('Failed to load rewards');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return <Star size={16} className="text-orange-500" />;
      case 'silver':
        return <Star size={16} className="text-gray-500" />;
      case 'gold':
        return <Star size={16} className="text-yellow-500 fill-current" />;
      case 'platinum':
        return <Crown size={16} className="text-purple-500" />;
      default:
        return <Star size={16} className="text-gray-500" />;
    }
  };

  const getRewardIcon = (category: string) => {
    switch (category) {
      case 'discount':
        return <CreditCard size={16} className="text-green-500" />;
      case 'free_item':
        return <Gift size={16} className="text-blue-500" />;
      case 'cashback':
        return <TrendingUp size={16} className="text-purple-500" />;
      case 'upgrade':
        return <Award size={16} className="text-orange-500" />;
      default:
        return <Gift size={16} className="text-gray-500" />;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'all' || customer.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const handleRewardRedeem = (reward: Reward, customer: Customer) => {
    if (customer.points >= reward.pointsCost) {
      onRewardRedeem?.(reward, customer);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="max-w-6xl w-full mx-4">
        <GlassCard className="bg-white/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Crown size={24} className="text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Loyalty Program</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            {[
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'rewards', label: 'Rewards', icon: Gift },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search customers or rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            
            {activeTab === 'customers' && (
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <GlassCard
                  key={customer.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                  onClick={() => onCustomerSelect?.(customer)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTierIcon(customer.tier)}
                      <span className={`text-xs px-2 py-1 rounded-full border ${getTierColor(customer.tier)}`}>
                        {customer.tier}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Points:</span>
                      <span className="font-semibold text-purple-600">{customer.points.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-medium">₦{customer.totalSpent.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Rewards Redeemed:</span>
                      <span className="font-medium">{customer.rewardsRedeemed}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Member since {customer.joinDate.toLocaleDateString()}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <GlassCard
                  key={reward.id}
                  className="transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getRewardIcon(reward.category)}
                      <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getTierColor(reward.tierRequired)}`}>
                      {reward.tierRequired}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{reward.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Points Cost:</span>
                    <span className="font-semibold text-purple-600">{reward.pointsCost}</span>
                  </div>

                  <GlassButton
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={!reward.isActive}
                  >
                    {reward.isActive ? 'Available' : 'Unavailable'}
                  </GlassButton>
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <Crown size={24} className="text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-600">Total Members</p>
                  <p className="text-2xl font-bold text-purple-700">{customers.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Star size={24} className="text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-600">Total Points</p>
                  <p className="text-2xl font-bold text-green-700">
                    {customers.reduce((sum, c) => sum + c.points, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Gift size={24} className="text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-600">Rewards Redeemed</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {customers.reduce((sum, c) => sum + c.rewardsRedeemed, 0)}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <TrendingUp size={24} className="text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-orange-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-orange-700">
                    ₦{customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Tier Distribution */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Tier Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
                    <div key={tier} className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {getTierIcon(tier)}
                        <span className="capitalize font-medium">{tier}</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-700">
                        {customers.filter(c => c.tier === tier).length}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {filteredCustomers.length === 0 && activeTab === 'customers' && (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No customers found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default LoyaltyProgram; 