import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  Users, UserPlus, Crown, DollarSign, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Target, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnalyticsService } from '../../lats/lib/analyticsService';

interface CustomerAnalyticsTabProps {
  isActive: boolean;
  timeRange: string;
}

interface CustomerData {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  averageCustomerValue: number;
  customerGrowth: number;
  topCustomers: Array<{
    name: string;
    purchases: number;
    totalSpent: number;
    lastPurchase: string;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageValue: number;
  }>;
  customerActivity: Array<{
    date: string;
    newCustomers: number;
    activeCustomers: number;
  }>;
}

const CustomerAnalyticsTab: React.FC<CustomerAnalyticsTabProps> = ({ isActive, timeRange }) => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      loadCustomerData();
    }
  }, [isActive, timeRange]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading customer analytics for period:', timeRange);
      
      const customerData = await AnalyticsService.getCustomerAnalytics();
      
      if (!customerData) {
        setError('Failed to load customer analytics data');
        return;
      }
      
      const customerAnalyticsData: CustomerData = {
        totalCustomers: customerData.totalCustomers,
        newCustomers: customerData.newCustomers,
        activeCustomers: customerData.activeCustomers,
        averageCustomerValue: customerData.averageCustomerValue,
        customerGrowth: customerData.customerGrowth,
        topCustomers: customerData.topCustomers.map(customer => ({
          name: customer.name,
          purchases: customer.purchases,
          totalSpent: customer.totalSpent,
          lastPurchase: customer.lastPurchase || 'N/A'
        })),
        customerSegments: customerData.customerSegments.map(segment => ({
          segment: segment.segment,
          count: segment.count,
          percentage: segment.percentage,
          averageValue: segment.averageValue
        })),
        customerActivity: customerData.customerActivity.map(activity => ({
          date: activity.date,
          newCustomers: activity.newCustomers,
          activeCustomers: activity.activeCustomers
        }))
      };
      
      setCustomerData(customerAnalyticsData);
      console.log('✅ Customer analytics data loaded:', customerAnalyticsData);
    } catch (error) {
      console.error('❌ Error loading customer analytics:', error);
      setError('Failed to load customer analytics data. Please try again.');
      toast.error('Failed to load customer data');
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-gray-600">Loading customer analytics...</span>
      </div>
    );
  }

  if (!customerData) return null;

  return (
    <div className="space-y-6">
      {/* Key Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(customerData.totalCustomers)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{customerData.customerGrowth}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {customerData.newCustomers}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+12.5%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(customerData.activeCustomers)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+5.2%</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Crown className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Customer Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(customerData.averageCustomerValue)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8.7%</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Top Customers */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
        <div className="space-y-3">
          {customerData.topCustomers.map((customer, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-sm font-semibold text-orange-600">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.purchases} purchases</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatMoney(customer.totalSpent)}</p>
                <p className="text-sm text-gray-600">Last: {customer.lastPurchase}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Customer Segments */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
        <div className="space-y-4">
          {customerData.customerSegments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <div>
                  <p className="font-medium text-gray-900">{segment.segment}</p>
                  <p className="text-sm text-gray-600">{segment.count} customers</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatMoney(segment.averageValue)}</p>
                <p className="text-sm text-gray-600">{segment.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Customer Activity */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Activity</h3>
        <div className="grid grid-cols-7 gap-2">
          {customerData.customerActivity.map((day, index) => (
            <div key={index} className="text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{day.date}</p>
                <p className="text-lg font-bold text-orange-600">{day.activeCustomers}</p>
                <p className="text-xs text-gray-600">+{day.newCustomers} new</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default CustomerAnalyticsTab;
