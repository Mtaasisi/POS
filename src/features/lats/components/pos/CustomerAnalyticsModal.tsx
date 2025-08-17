import React, { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Calendar, DollarSign, ShoppingBag, Clock, Star, Crown, Activity, RefreshCw } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  LoyaltyCustomer 
} from '../../../../lib/customerLoyaltyService';
import { toast } from 'react-hot-toast';

interface CustomerAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: LoyaltyCustomer | null;
}

interface CustomerAnalytics {
  purchaseHistory: Array<{
    date: string;
    amount: number;
    items: number;
    orderId: string;
  }>;
  pointsHistory: Array<{
    date: string;
    points: number;
    type: string;
    reason: string;
  }>;
  visitPattern: Array<{
    day: string;
    visits: number;
    averageSpend: number;
  }>;
  productPreferences: Array<{
    category: string;
    count: number;
    totalSpent: number;
  }>;
  lifetimeValue: number;
  averageOrderValue: number;
  totalOrders: number;
  daysSinceLastPurchase: number;
  pointsEarned: number;
  pointsRedeemed: number;
  tierUpgrades: number;
}

const CustomerAnalyticsModal: React.FC<CustomerAnalyticsModalProps> = ({ 
  isOpen, 
  onClose, 
  customer 
}) => {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  useEffect(() => {
    if (isOpen && customer) {
      loadCustomerAnalytics();
    }
  }, [isOpen, customer, selectedPeriod]);

  const loadCustomerAnalytics = async () => {
    if (!customer) return;
    
    try {
      setLoading(true);
      
      // Simulate API call - in real implementation, this would fetch from your analytics service
      const mockAnalytics: CustomerAnalytics = {
        purchaseHistory: [
          { date: '2024-01-15', amount: 150000, items: 2, orderId: 'ORD001' },
          { date: '2024-01-20', amount: 89000, items: 1, orderId: 'ORD002' },
          { date: '2024-02-05', amount: 250000, items: 3, orderId: 'ORD003' },
          { date: '2024-02-18', amount: 120000, items: 1, orderId: 'ORD004' },
          { date: '2024-03-01', amount: 180000, items: 2, orderId: 'ORD005' }
        ],
        pointsHistory: [
          { date: '2024-01-15', points: 150, type: 'earned', reason: 'Purchase' },
          { date: '2024-01-20', points: 89, type: 'earned', reason: 'Purchase' },
          { date: '2024-02-05', points: 250, type: 'earned', reason: 'Purchase' },
          { date: '2024-02-18', points: -100, type: 'redeemed', reason: 'Reward redemption' },
          { date: '2024-03-01', points: 180, type: 'earned', reason: 'Purchase' }
        ],
        visitPattern: [
          { day: 'Monday', visits: 2, averageSpend: 120000 },
          { day: 'Tuesday', visits: 1, averageSpend: 89000 },
          { day: 'Wednesday', visits: 3, averageSpend: 180000 },
          { day: 'Thursday', visits: 0, averageSpend: 0 },
          { day: 'Friday', visits: 2, averageSpend: 150000 },
          { day: 'Saturday', visits: 4, averageSpend: 200000 },
          { day: 'Sunday', visits: 1, averageSpend: 95000 }
        ],
        productPreferences: [
          { category: 'Smartphones', count: 3, totalSpent: 450000 },
          { category: 'Accessories', count: 2, totalSpent: 120000 },
          { category: 'Laptops', count: 1, totalSpent: 180000 },
          { category: 'Tablets', count: 1, totalSpent: 89000 }
        ],
        lifetimeValue: 839000,
        averageOrderValue: 167800,
        totalOrders: 5,
        daysSinceLastPurchase: 15,
        pointsEarned: 669,
        pointsRedeemed: 100,
        tierUpgrades: 1
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading customer analytics:', error);
      toast.error('Failed to load customer analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `TZS ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-6xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Customer Analytics</h2>
                <p className="text-sm text-gray-600">{customer.name} - Detailed Insights</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Period Selector */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Time Period:</span>
              <div className="flex gap-1">
                {(['7d', '30d', '90d', '1y', 'all'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedPeriod === period
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading analytics...</span>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Lifetime Value</p>
                      <p className="text-xl font-bold">{formatCurrency(analytics.lifetimeValue)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 opacity-80" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Orders</p>
                      <p className="text-xl font-bold">{analytics.totalOrders}</p>
                    </div>
                    <ShoppingBag className="w-8 h-8 opacity-80" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Avg Order Value</p>
                      <p className="text-xl font-bold">{formatCurrency(analytics.averageOrderValue)}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 opacity-80" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Days Since Last</p>
                      <p className="text-xl font-bold">{analytics.daysSinceLastPurchase}</p>
                    </div>
                    <Clock className="w-8 h-8 opacity-80" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Purchase History */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analytics.purchaseHistory.map((purchase, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{purchase.orderId}</p>
                          <p className="text-sm text-gray-600">{formatDate(purchase.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(purchase.amount)}</p>
                          <p className="text-sm text-gray-600">{purchase.items} items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Points History */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Points Activity</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {analytics.pointsHistory.map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{point.reason}</p>
                          <p className="text-sm text-gray-600">{formatDate(point.date)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${
                            point.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {point.points > 0 ? '+' : ''}{point.points}
                          </span>
                          <p className="text-sm text-gray-600 capitalize">{point.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visit Pattern */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Pattern</h3>
                  <div className="space-y-3">
                    {analytics.visitPattern.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{day.day}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{day.visits} visits</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {day.averageSpend > 0 ? formatCurrency(day.averageSpend) : 'No visits'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Preferences */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Preferences</h3>
                  <div className="space-y-3">
                    {analytics.productPreferences.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{category.category}</p>
                          <p className="text-sm text-gray-600">{category.count} purchases</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(category.totalSpent)}</p>
                          <p className="text-sm text-gray-600">
                            {((category.totalSpent / analytics.lifetimeValue) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Insights */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">Points Earned</p>
                    <p className="text-2xl font-bold text-blue-600">{analytics.pointsEarned}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">Tier Upgrades</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.tierUpgrades}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600">Engagement Score</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((analytics.totalOrders / Math.max(analytics.daysSinceLastPurchase, 1)) * 100)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No analytics data available for this customer</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default CustomerAnalyticsModal;
