import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  TrendingUp, DollarSign, ShoppingCart, BarChart3, 
  ArrowUpRight, ArrowDownRight, Calendar, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salesAnalyticsService, SalesAnalyticsData } from '../../lats/lib/salesAnalyticsService';

interface SalesAnalyticsTabProps {
  isActive: boolean;
  timeRange: string;
}

// Using SalesAnalyticsData from the service

const SalesAnalyticsTab: React.FC<SalesAnalyticsTabProps> = ({ isActive, timeRange }) => {
  const [salesData, setSalesData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) {
      loadSalesData();
    }
  }, [isActive, timeRange]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading sales analytics for period:', timeRange);
      const data = await salesAnalyticsService.getSalesAnalytics(timeRange);
      
      if (data) {
        setSalesData(data);
        console.log('✅ Sales analytics data loaded:', data);
      } else {
        setError('No sales data available for the selected period');
      }
    } catch (err) {
      console.error('❌ Error loading sales analytics:', err);
      setError('Failed to load sales analytics data. Please try again.');
      toast.error('Failed to load sales data');
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
        <span className="ml-3 text-gray-600">Loading sales analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <GlassButton 
            onClick={loadSalesData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </GlassButton>
        </div>
      </div>
    );
  }

  if (!salesData) return null;

  return (
    <div className="space-y-6">
      {/* Key Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(salesData.metrics.totalSales)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{salesData.metrics.growthRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(salesData.metrics.totalTransactions)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">
                  +{salesData.metrics.growthRate.toFixed(1)}%
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
              <p className="text-sm text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(salesData.metrics.averageTransaction)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+{salesData.metrics.growthRate.toFixed(1)}%</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                +{salesData.metrics.growthRate.toFixed(1)}%
              </p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Top Selling Products */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
        <div className="space-y-3">
          {salesData.topProducts.length > 0 ? (
            salesData.topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.quantity} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatMoney(product.sales)}</p>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500">{product.percentage}% of total</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No product sales data available</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Sales by Day */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Day</h3>
        <div className="grid grid-cols-7 gap-2">
          {salesData.dailySales.length > 0 ? (
            salesData.dailySales.map((day, index) => (
              <div key={index} className="text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-lg font-bold text-blue-600">{day.transactions}</p>
                  <p className="text-xs text-gray-600">{formatMoney(day.sales)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-7 text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No daily sales data available</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Customer Segments */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
        <div className="space-y-4">
          {salesData.customerSegments.length > 0 ? (
            salesData.customerSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">{segment.segment}</p>
                    <p className="text-sm text-gray-600">{segment.customers} customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatMoney(segment.sales)}</p>
                  <p className="text-sm text-gray-600">{segment.percentage}% of total</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No customer segment data available</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default SalesAnalyticsTab;
