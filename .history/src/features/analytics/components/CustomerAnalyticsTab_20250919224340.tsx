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
      
      // Mock customer data
      const mockData: CustomerData = {
        totalCustomers: 1250,
        newCustomers: 45,
        activeCustomers: 890,
        averageCustomerValue: 85000,
        customerGrowth: 8.3,
        topCustomers: [
          { name: 'John Doe', purchases: 12, totalSpent: 850000, lastPurchase: '2024-01-15' },
          { name: 'Sarah Smith', purchases: 8, totalSpent: 620000, lastPurchase: '2024-01-14' },
          { name: 'Mike Johnson', purchases: 15, totalSpent: 1100000, lastPurchase: '2024-01-13' },
          { name: 'Lisa Brown', purchases: 6, totalSpent: 480000, lastPurchase: '2024-01-12' },
          { name: 'Alex Wilson', purchases: 10, totalSpent: 750000, lastPurchase: '2024-01-11' }
        ],
        customerSegments: [
          { segment: 'VIP Customers', count: 125, percentage: 10.0, averageValue: 150000 },
          { segment: 'Regular Customers', count: 450, percentage: 36.0, averageValue: 85000 },
          { segment: 'Occasional Customers', count: 375, percentage: 30.0, averageValue: 45000 },
          { segment: 'New Customers', count: 300, percentage: 24.0, averageValue: 25000 }
        ],
        customerActivity: [
          { date: 'Mon', newCustomers: 8, activeCustomers: 145 },
          { date: 'Tue', newCustomers: 12, activeCustomers: 167 },
          { date: 'Wed', newCustomers: 6, activeCustomers: 134 },
          { date: 'Thu', newCustomers: 15, activeCustomers: 189 },
          { date: 'Fri', newCustomers: 10, activeCustomers: 156 },
          { date: 'Sat', newCustomers: 18, activeCustomers: 203 },
          { date: 'Sun', newCustomers: 7, activeCustomers: 123 }
        ]
      };
      
      setCustomerData(mockData);
    } catch (error) {
      console.error('Error loading customer data:', error);
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
