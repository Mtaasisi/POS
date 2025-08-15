import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import PageHeader from '../components/ui/PageHeader';
import { salesAnalyticsService, SalesAnalyticsData } from '../lib/salesAnalyticsService';

const SalesAnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('sales');
  const [analyticsData, setAnalyticsData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data on component mount and when period changes
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading sales analytics for period:', selectedPeriod);
      const data = await salesAnalyticsService.getSalesAnalytics(selectedPeriod);
      
      if (data) {
        console.log('✅ Sales analytics data loaded:', data);
        setAnalyticsData(data);
      } else {
        setError('No sales data available for the selected period');
      }
    } catch (err) {
      console.error('❌ Error loading sales analytics:', err);
      setError('Failed to load sales analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Generate simple bar chart
  const generateBarChart = (data: any[], key: string, valueKey: string, maxBars = 7) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <div>No data available for this period</div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item[valueKey]));
    return (
      <div className="space-y-2">
        {data.slice(0, maxBars).map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600 truncate">
              {item[key]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-20 text-sm font-medium text-gray-900 text-right">
              {formatMoney(item[valueKey])}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageHeader
          title="Sales Analytics"
          subtitle="Track sales performance and business insights"
          className="mb-6"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading sales analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageHeader
          title="Sales Analytics"
          subtitle="Track sales performance and business insights"
          className="mb-6"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-4">⚠️</div>
            <div className="text-gray-600 mb-4">{error || 'Failed to load analytics data'}</div>
            <button 
              onClick={loadAnalyticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, dailySales, topProducts, paymentMethods, customerSegments } = analyticsData;

  // Check if we have any meaningful data
  const hasData = metrics.totalSales > 0 || metrics.totalTransactions > 0;

  if (!hasData) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageHeader
          title="Sales Analytics"
          subtitle="Track sales performance and business insights"
          className="mb-6"
        />

        {/* Period Selector */}
        <div className="mb-6">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {['1d', '7d', '30d', '90d'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period === '1d' ? 'Today' : period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* No Data State */}
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sales Data Available</h3>
            <p className="text-gray-600 mb-6">
              There are no sales transactions for the selected period ({selectedPeriod === '1d' ? 'Today' : selectedPeriod === '7d' ? 'Last 7 Days' : selectedPeriod === '30d' ? 'Last 30 Days' : 'Last 90 Days'}).
            </p>
            <div className="space-y-3 text-sm text-gray-500">
              <p>• Start making sales through the POS system</p>
              <p>• Try selecting a different time period</p>
              <p>• Check if sales data has been properly recorded</p>
            </div>
            <div className="mt-6">
              <button 
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        title="Sales Analytics"
        subtitle="Track sales performance and business insights"
        className="mb-6"
      />

      {/* Period Selector */}
      <div className="mb-6">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {['1d', '7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === '1d' ? 'Today' : period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(metrics.totalSales)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-sm ${metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.growthRate >= 0 ? '↗' : '↘'} {Math.abs(metrics.growthRate).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-600 ml-1">vs last period</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalTransactions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Total orders processed</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(metrics.averageTransaction)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-purple-600 text-xl">📈</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Per transaction</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-orange-600 text-xl">🎯</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Cart to purchase</span>
          </div>
        </GlassCard>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Sales Trend */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales Trend</h3>
          {dailySales.length > 0 ? (
            <div className="space-y-3">
              {dailySales.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-600">{day.transactions} transactions</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(day.sales)}</div>
                    <div className="text-sm text-gray-600">
                      {day.transactions > 0 ? formatMoney(day.sales / day.transactions) : formatMoney(0)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <div>No sales data available for this period</div>
            </div>
          )}
        </GlassCard>

        {/* Top Products */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
          {generateBarChart(topProducts, 'name', 'sales', 5)}
        </GlassCard>
      </div>

      {/* Payment Methods and Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">
                        {method.method === 'M-Pesa' ? '📱' : method.method === 'Cash' ? '💵' : method.method === 'Card' ? '💳' : '🏦'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{method.method}</div>
                      <div className="text-sm text-gray-600">{method.percentage}% of total</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(method.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">💳</div>
              <div>No payment data available</div>
            </div>
          )}
        </GlassCard>

        {/* Customer Segments */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Segments</h3>
          {customerSegments.length > 0 ? (
            <div className="space-y-4">
              {customerSegments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-medium">
                        {segment.segment === 'VIP Customers' ? '👑' : segment.segment === 'Regular Customers' ? '👥' : '🚶'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{segment.segment}</div>
                      <div className="text-sm text-gray-600">{segment.customers} customers</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(segment.sales)}</div>
                    <div className="text-sm text-gray-600">{segment.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">👥</div>
              <div>No customer data available</div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Export Report</div>
              <div className="text-sm text-gray-600">Download detailed analytics</div>
            </button>
            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-green-600 text-2xl mb-2">📈</div>
              <div className="font-medium text-gray-900">Set Goals</div>
              <div className="text-sm text-gray-600">Configure sales targets</div>
            </button>
            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-purple-600 text-2xl mb-2">🔔</div>
              <div className="font-medium text-gray-900">Alerts</div>
              <div className="text-sm text-gray-600">Manage notifications</div>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SalesAnalyticsPage;
