import React, { useState, useEffect } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { Gift, Star, Crown, Users, Award, CreditCard, ShoppingBag, TrendingUp, Search, Loader2, Plus, DollarSign, UserPlus } from 'lucide-react';
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
  isLoyaltyMember: boolean;
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

  // Filter customers based on search and tier
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTier = true;
    if (selectedTier === 'non-member') {
      matchesTier = !customer.isLoyaltyMember;
    } else if (selectedTier !== 'all') {
      matchesTier = customer.isLoyaltyMember && customer.tier === selectedTier;
    }
    
    return matchesSearch && matchesTier;
  });

  // Fetch data from database
  useEffect(() => {
    if (isOpen) {
      fetchAllCustomers();
      fetchRewards();
    }
  }, [isOpen]);

  const fetchAllCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      // First get all customers
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, phone, email, created_at')
        .order('name');

      if (customersError) throw customersError;

      // Then get loyalty data
      const { data: loyaltyCustomers, error: loyaltyError } = await supabase
        .from('loyalty_customers')
        .select('*')
        .order('points', { ascending: false });

      if (loyaltyError) throw loyaltyError;

      // Create a map of loyalty data by customer_id
      const loyaltyMap = new Map();
      (loyaltyCustomers || []).forEach((loyalty: any) => {
        loyaltyMap.set(loyalty.customer_id, loyalty);
      });

      // Combine all customers with their loyalty data
      const formattedCustomers: Customer[] = (allCustomers || []).map((customer: any) => {
        const loyaltyData = loyaltyMap.get(customer.id);
        
        return {
          id: customer.id,
          name: customer.name || 'Unknown Customer',
          phone: customer.phone || '',
          email: customer.email || '',
          points: loyaltyData?.points || 0,
          tier: loyaltyData?.tier || 'bronze',
          totalSpent: loyaltyData?.total_spent || 0,
          joinDate: new Date(loyaltyData?.join_date || customer.created_at || Date.now()),
          lastVisit: new Date(loyaltyData?.last_visit || customer.created_at || Date.now()),
          rewardsRedeemed: loyaltyData?.rewards_redeemed || 0,
          isLoyaltyMember: !!loyaltyData
        };
      });

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const addCustomerToLoyalty = async (customerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('loyalty_customers')
        .insert([{
          customer_id: customerId,
          points: 0,
          tier: 'bronze',
          total_spent: 0,
          join_date: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          rewards_redeemed: 0
        }]);

      if (error) throw error;

      // Refresh customer data
      await fetchAllCustomers();
      setError(null);
    } catch (err) {
      console.error('Error adding customer to loyalty:', err);
      setError('Failed to add customer to loyalty program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost');

      if (error) throw error;

      const formattedRewards: Reward[] = (data || []).map((reward: any) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        pointsCost: reward.points_cost,
        discountAmount: reward.discount_amount,
        discountPercentage: reward.discount_percentage,
        category: reward.category,
        isActive: reward.is_active,
        tierRequired: reward.tier_required
      }));

      setRewards(formattedRewards);
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setError('Failed to load rewards. Please run the loyalty tables fix script.');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award size={16} className="text-orange-600" />;
      case 'silver': return <Award size={16} className="text-gray-600" />;
      case 'gold': return <Crown size={16} className="text-yellow-600" />;
      case 'platinum': return <Crown size={16} className="text-purple-600" />;
      default: return <Award size={16} className="text-gray-600" />;
    }
  };

  const getRewardIcon = (category: string) => {
    switch (category) {
      case 'discount': return <CreditCard size={16} className="text-green-600" />;
      case 'free_item': return <Gift size={16} className="text-purple-600" />;
      case 'cashback': return <DollarSign size={16} className="text-blue-600" />;
      case 'upgrade': return <TrendingUp size={16} className="text-orange-600" />;
      default: return <Gift size={16} className="text-gray-600" />;
    }
  };

  const handleRewardRedeem = async (reward: Reward, customer: Customer) => {
    setLoading(true);
    setError(null);
    try {
      // Get reward details
      const { data: rewardData, error: rewardError } = await supabase
        .from('loyalty_rewards')
        .select('points_cost')
        .eq('id', reward.id)
        .single();

      if (rewardError) throw rewardError;

      // Get current customer points
      const { data: customerData, error: customerError } = await supabase
        .from('loyalty_customers')
        .select('points, rewards_redeemed')
        .eq('customer_id', customer.id)
        .single();

      if (customerError) throw customerError;

      // Deduct points from customer
      const { error: updateError } = await supabase
        .from('loyalty_customers')
        .update({ 
          points: Math.max(0, (customerData.points || 0) - rewardData.points_cost),
          rewards_redeemed: (customerData.rewards_redeemed || 0) + 1
        })
        .eq('customer_id', customer.id);

      if (updateError) throw updateError;

      // Refresh customer data
      await fetchAllCustomers();
      
      // Call the parent callback
      onRewardRedeem?.(reward, customer);
      
      setError(null);
    } catch (err) {
      console.error('Error redeeming reward:', err);
      setError('Failed to redeem reward. Please try again.');
    } finally {
      setLoading(false);
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
              <h2 className="text-xl font-semibold text-gray-900">Loyalty Program Management</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchAllCustomers();
                  fetchRewards();
                }}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <Loader2 size={20} className={`text-purple-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            {[
              { id: 'customers', label: 'All Customers', icon: Users },
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
                placeholder="Search customers by name, phone, or email..."
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
                <option value="all">All Customers</option>
                <option value="bronze">Bronze Members</option>
                <option value="silver">Silver Members</option>
                <option value="gold">Gold Members</option>
                <option value="platinum">Platinum Members</option>
                <option value="non-member">Non-Members</option>
              </select>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'customers' && (
            <>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-purple-600" />
                    <span className="text-gray-600">Loading customers...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-red-600 mb-2">⚠️</div>
                  <p className="text-red-700 font-medium">{error}</p>
                  <button
                    onClick={fetchAllCustomers}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCustomers.map((customer) => (
                    <GlassCard
                      key={customer.id}
                      className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                        !customer.isLoyaltyMember ? 'border-2 border-dashed border-gray-300' : ''
                      }`}
                      onClick={() => onCustomerSelect?.(customer)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {customer.isLoyaltyMember ? (
                            <>
                              {getTierIcon(customer.tier)}
                              <span className={`text-xs px-2 py-1 rounded-full border ${getTierColor(customer.tier)}`}>
                                {customer.tier}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                              Non-Member
                            </span>
                          )}
                        </div>
                      </div>

                      {customer.isLoyaltyMember ? (
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
                      ) : (
                        <div className="space-y-2 mb-4">
                          <div className="text-sm text-gray-500 italic">
                            Not enrolled in loyalty program
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mb-3">
                        {customer.isLoyaltyMember 
                          ? `Member since ${customer.joinDate.toLocaleDateString()}`
                          : `Customer since ${customer.joinDate.toLocaleDateString()}`
                        }
                      </div>

                      {!customer.isLoyaltyMember && (
                        <GlassButton
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            addCustomerToLoyalty(customer.id);
                          }}
                        >
                          <UserPlus size={14} />
                          <span className="ml-2">Add to Loyalty</span>
                        </GlassButton>
                      )}
                    </GlassCard>
                  ))}
                </div>
              )}

              {!loading && !error && filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No customers found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'rewards' && (
            <>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-purple-600" />
                    <span className="text-gray-600">Loading rewards...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-red-600 mb-2">⚠️</div>
                  <p className="text-red-700 font-medium">{error}</p>
                  <button
                    onClick={fetchRewards}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && (
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

                      <div className="space-y-2">
                        <GlassButton
                          variant="primary"
                          size="sm"
                          className="w-full"
                          disabled={!reward.isActive}
                          onClick={() => handleRewardRedeem(reward, customers[0])} // For demo, use first customer
                        >
                          {reward.isActive ? 'Redeem Reward' : 'Unavailable'}
                        </GlassButton>
                        <div className="text-xs text-gray-500 text-center">
                          {reward.pointsCost} points required
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <Crown size={24} className="text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-600">Total Members</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {customers.filter(c => c.isLoyaltyMember).length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Star size={24} className="text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-600">Total Points</p>
                  <p className="text-2xl font-bold text-green-700">
                    {customers.filter(c => c.isLoyaltyMember).reduce((sum, c) => sum + c.points, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Gift size={24} className="text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-600">Rewards Redeemed</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {customers.filter(c => c.isLoyaltyMember).reduce((sum, c) => sum + c.rewardsRedeemed, 0)}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <TrendingUp size={24} className="text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-orange-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-orange-700">
                    ₦{customers.filter(c => c.isLoyaltyMember).reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
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
                        {customers.filter(c => c.isLoyaltyMember && c.tier === tier).length}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-Members Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Non-Members</h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-700">
                    {customers.filter(c => !c.isLoyaltyMember).length}
                  </p>
                  <p className="text-sm text-gray-600">Customers not enrolled in loyalty program</p>
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default LoyaltyProgram; 