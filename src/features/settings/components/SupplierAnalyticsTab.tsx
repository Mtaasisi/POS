import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  BarChart3, TrendingUp, Activity, Zap, Users, Building, 
  MapPin, CreditCard, Wallet, Globe, ArrowUpRight, ArrowDownRight,
  Star, DollarSign, Package, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupplierAnalyticsTabProps {
  isActive: boolean;
  suppliers: any[];
}

interface SupplierAnalytics {
  overview: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  byCountry: Array<{
    country: string;
    count: number;
    percentage: number;
    trend: number;
  }>;
  byPaymentType: Array<{
    type: string;
    count: number;
    percentage: number;
    trend: number;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  trends: Array<{
    month: string;
    suppliers: number;
    active: number;
    new: number;
  }>;
}

const SupplierAnalyticsTab: React.FC<SupplierAnalyticsTabProps> = ({ isActive, suppliers }) => {
  const [analytics, setAnalytics] = useState<SupplierAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (isActive) {
      loadSupplierAnalytics();
    }
  }, [isActive, timeRange, suppliers]);

  const loadSupplierAnalytics = async () => {
    setLoading(true);
    try {
      // Mock supplier analytics
      const mockAnalytics: SupplierAnalytics = {
        overview: {
          total: 24,
          active: 22,
          newThisMonth: 3,
          growth: 12.5
        },
        byCountry: [
          { country: 'China', count: 8, percentage: 33.3, trend: 15.2 },
          { country: 'Tanzania', count: 6, percentage: 25.0, trend: 8.7 },
          { country: 'Dubai (UAE)', count: 4, percentage: 16.7, trend: 12.3 },
          { country: 'Kenya', count: 3, percentage: 12.5, trend: -2.1 },
          { country: 'United States', count: 2, percentage: 8.3, trend: 5.6 },
          { country: 'Other', count: 1, percentage: 4.2, trend: -1.5 }
        ],
        byPaymentType: [
          { type: 'Mobile Money', count: 12, percentage: 50.0, trend: 18.5 },
          { type: 'Bank Account', count: 8, percentage: 33.3, trend: 12.3 },
          { type: 'Other', count: 4, percentage: 16.7, trend: -5.2 }
        ],
        byCategory: [
          { category: 'Electronics', count: 10, revenue: 2500000, percentage: 41.7 },
          { category: 'Mobile Phones', count: 8, revenue: 1800000, percentage: 33.3 },
          { category: 'Accessories', count: 4, revenue: 800000, percentage: 16.7 },
          { category: 'Other', count: 2, revenue: 400000, percentage: 8.3 }
        ],
        trends: [
          { month: 'Jan', suppliers: 20, active: 18, new: 2 },
          { month: 'Feb', suppliers: 22, active: 20, new: 2 },
          { month: 'Mar', suppliers: 21, active: 19, new: 1 },
          { month: 'Apr', suppliers: 23, active: 21, new: 2 },
          { month: 'May', suppliers: 24, active: 22, new: 1 },
          { month: 'Jun', suppliers: 24, active: 22, new: 3 }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading supplier analytics:', error);
      toast.error('Failed to load supplier analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Loading supplier analytics...</span>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics.overview.total)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{analytics.overview.growth}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.active}
              </p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">
                  {Math.round((analytics.overview.active / analytics.overview.total) * 100)}% active rate
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.newThisMonth}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{analytics.overview.newThisMonth}</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                +{analytics.overview.growth}%
              </p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Country Distribution */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suppliers by Country</h3>
        <div className="space-y-3">
          {analytics.byCountry.map((country, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Globe className="w-4 h-4 text-blue-500 mr-3" />
                <span className="font-medium text-gray-900">{country.country}</span>
                <span className="ml-3 text-sm text-gray-600">{country.count} suppliers</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{country.percentage}%</p>
                <div className="flex items-center">
                  {country.trend > 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ml-1 ${country.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {country.trend > 0 ? '+' : ''}{country.trend}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Payment Type Distribution */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-3">
          {analytics.byPaymentType.map((payment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {payment.type === 'Mobile Money' ? (
                  <Wallet className="w-4 h-4 text-green-500 mr-3" />
                ) : payment.type === 'Bank Account' ? (
                  <CreditCard className="w-4 h-4 text-blue-500 mr-3" />
                ) : (
                  <Building className="w-4 h-4 text-gray-500 mr-3" />
                )}
                <span className="font-medium text-gray-900">{payment.type}</span>
                <span className="ml-3 text-sm text-gray-600">{payment.count} suppliers</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{payment.percentage}%</p>
                <div className="flex items-center">
                  {payment.trend > 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ml-1 ${payment.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {payment.trend > 0 ? '+' : ''}{payment.trend}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Category Analysis */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suppliers by Category</h3>
        <div className="space-y-3">
          {analytics.byCategory.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Package className="w-4 h-4 text-purple-500 mr-3" />
                <span className="font-medium text-gray-900">{category.category}</span>
                <span className="ml-3 text-sm text-gray-600">{category.count} suppliers</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatMoney(category.revenue)}</p>
                <p className="text-sm text-gray-600">{category.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Monthly Trends */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="grid grid-cols-6 gap-2">
          {analytics.trends.map((trend, index) => (
            <div key={index} className="text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{trend.month}</p>
                <p className="text-lg font-bold text-blue-600">{trend.suppliers}</p>
                <div className="text-xs text-gray-600">
                  <p className="text-green-600">{trend.active} active</p>
                  <p className="text-purple-600">{trend.new} new</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default SupplierAnalyticsTab;
