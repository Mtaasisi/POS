import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  BarChart3, TrendingUp, DollarSign, Users, Package, 
  ArrowUpRight, ArrowDownRight, Target, Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salesAnalyticsService } from '../../lats/lib/salesAnalyticsService';
import { AnalyticsService } from '../../lats/lib/analyticsService';

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
      
      console.log('📊 Loading business analytics for period:', timeRange);
      
      // Fetch data from multiple services
      const [salesData, salesStats, inventoryData, customerData] = await Promise.all([
        salesAnalyticsService.getSalesAnalytics(timeRange),
        salesAnalyticsService.getSalesStats(),
        AnalyticsService.getInventoryAnalytics(),
        AnalyticsService.getCustomerAnalytics()
      ]);
      
      if (!salesData || !salesStats || !inventoryData || !customerData) {
        setError('Failed to load analytics data from one or more services');
        return;
      }
      
      const analyticsData: AnalyticsData = {
        sales: {
          total: salesStats.total_revenue,
          today: salesStats.today_revenue,
          thisWeek: salesData.metrics.totalSales,
          thisMonth: salesStats.this_month_revenue,
          growth: salesData.metrics.growthRate,
          topProducts: salesData.topProducts.map(product => ({
            name: product.name,
            sales: product.quantity,
            revenue: product.sales
          }))
        },
        customers: {
          total: customerData.totalCustomers,
          new: customerData.newCustomers,
          active: customerData.activeCustomers,
          growth: customerData.customerGrowth,
          topCustomers: customerData.topCustomers.map(customer => ({
            name: customer.name,
            purchases: customer.purchases,
            totalSpent: customer.totalSpent
          }))
        },
        inventory: {
          totalItems: inventoryData.totalProducts,
          lowStock: inventoryData.lowStockItems,
          outOfStock: inventoryData.outOfStockItems,
          value: inventoryData.totalValue,
          topCategories: inventoryData.topCategories.map(category => ({
            name: category.name,
            items: category.items,
            value: category.value
          }))
        }
      };
      
      setAnalyticsData(analyticsData);
      console.log('✅ Business analytics data loaded:', analyticsData);
    } catch (error) {
      console.error('❌ Error loading business analytics:', error);
      setError('Failed to load business analytics data. Please try again.');
      toast.error('Failed to load analytics data');
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
