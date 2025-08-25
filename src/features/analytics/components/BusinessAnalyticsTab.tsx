import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  BarChart3, TrendingUp, DollarSign, Users, Package, 
  ArrowUpRight, ArrowDownRight, Target, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BusinessAnalyticsTabProps {
  isActive: boolean;
  timeRange: string;
}

interface AnalyticsData {
  sales: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
    topProducts: Array<{
      name: string;
      sales: number;
      revenue: number;
    }>;
  };
  customers: {
    total: number;
    new: number;
    active: number;
    growth: number;
    topCustomers: Array<{
      name: string;
      purchases: number;
      totalSpent: number;
    }>;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    outOfStock: number;
    value: number;
    topCategories: Array<{
      name: string;
      items: number;
      value: number;
    }>;
  };
}

const BusinessAnalyticsTab: React.FC<BusinessAnalyticsTabProps> = ({ isActive, timeRange }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data
  useEffect(() => {
    if (isActive) {
      loadAnalyticsData();
    }
  }, [isActive, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        sales: {
          total: 12500000,
          today: 450000,
          thisWeek: 3200000,
          thisMonth: 12500000,
          growth: 12.5,
          topProducts: [
            { name: 'iPhone Screen Replacement', sales: 45, revenue: 3600000 },
            { name: 'Laptop Diagnostics', sales: 32, revenue: 480000 },
            { name: 'Windows Installation', sales: 28, revenue: 700000 },
            { name: 'Data Recovery', sales: 15, revenue: 1125000 },
            { name: 'Virus Removal', sales: 42, revenue: 840000 }
          ]
        },
        customers: {
          total: 1250,
          new: 45,
          active: 890,
          growth: 8.3,
          topCustomers: [
            { name: 'John Doe', purchases: 12, totalSpent: 850000 },
            { name: 'Sarah Smith', purchases: 8, totalSpent: 620000 },
            { name: 'Mike Johnson', purchases: 15, totalSpent: 1100000 },
            { name: 'Lisa Brown', purchases: 6, totalSpent: 480000 },
            { name: 'Alex Wilson', purchases: 10, totalSpent: 750000 }
          ]
        },
        inventory: {
          totalItems: 1247,
          lowStock: 23,
          outOfStock: 5,
          value: 8500000,
          topCategories: [
            { name: 'Electronics', items: 456, value: 3200000 },
            { name: 'Accessories', items: 234, value: 1200000 },
            { name: 'Tools', items: 189, value: 950000 },
            { name: 'Software', items: 156, value: 780000 },
            { name: 'Parts', items: 212, value: 1370000 }
          ]
        }
      };
      
      setAnalyticsData(mockData);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format numbers with K/M
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading business analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <GlassButton onClick={loadAnalyticsData}>Retry</GlassButton>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(analyticsData.sales.total)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{analyticsData.sales.growth}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData.customers.active)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{analyticsData.customers.growth}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData.inventory.totalItems)}
              </p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-red-600">
                  {analyticsData.inventory.lowStock} low stock
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(analyticsData.inventory.value)}
              </p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">
                  {analyticsData.inventory.outOfStock} out of stock
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {analyticsData.sales.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.sales} sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatMoney(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Customers */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {analyticsData.customers.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.purchases} purchases</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatMoney(customer.totalSpent)}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Inventory Categories */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.inventory.topCategories.map((category, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                <span className="text-sm text-gray-600">{category.items} items</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  {formatMoney(category.value)}
                </span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(category.value / analyticsData.inventory.value) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default BusinessAnalyticsTab;
