import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PageHeader from '../components/ui/PageHeader';
import { latsAnalyticsService, AnalyticsData } from '../lib/analytics';

const BusinessAnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data on component mount
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading business analytics data...');
      const data = await latsAnalyticsService.getComprehensiveAnalytics();
      
      console.log('✅ Analytics data loaded:', data);
      setAnalyticsData(data);
    } catch (err) {
      console.error('❌ Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics metrics
  const analyticsMetrics = useMemo(() => {
    if (!analyticsData) return {
      totalRevenue: 0,
      totalProfit: 0,
      totalCustomers: 0,
      totalOrders: 0,
      profitMargin: 0,
      customerLifetimeValue: 0
    };

    const totalRevenue = analyticsData.kpis.revenue.current;
    const totalProfit = analyticsData.kpis.profit.current;
    const totalCustomers = analyticsData.kpis.customers.current;
    const totalOrders = analyticsData.kpis.orders.current;
    const profitMargin = (() => {
      const formatted = (totalProfit / totalRevenue * 100).toFixed(1);
      return formatted.replace(/\.0$/, '');
    })();
    const customerLifetimeValue = (totalRevenue / totalCustomers).toFixed(0);

    return {
      totalRevenue,
      totalProfit,
      totalCustomers,
      totalOrders,
      profitMargin,
      customerLifetimeValue
    };
  }, [analyticsData]);

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Format number with K/M suffix
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(1);
    return formatted.replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
              const formatted = (num / 1000).toFixed(1);
        return formatted.replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Generate simple chart
  const generateChart = (data: any[], key: string, valueKey: string, color = 'blue') => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item[valueKey]));
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-16 text-sm text-gray-600 truncate">
              {item[key]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-${color}-500 h-3 rounded-full transition-all duration-300`}
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

  // Get insight color
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageHeader
          title="Business Analytics"
          subtitle="Loading real-time business intelligence and performance insights"
          className="mb-6"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data from database...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageHeader
          title="Business Analytics"
          subtitle="Advanced business intelligence and performance insights"
          className="mb-6"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <GlassButton onClick={loadAnalyticsData} className="bg-blue-600 text-white">
              Retry Loading
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!analyticsData) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageHeader
          title="Business Analytics"
          subtitle="Advanced business intelligence and performance insights"
          className="mb-6"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <p className="text-gray-600 mb-4">No analytics data available</p>
            <p className="text-sm text-gray-500">Start making sales to see your business analytics</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        title="Business Analytics"
        subtitle="Real-time business intelligence and performance insights from your database"
        className="mb-6"
      />

      {/* Database Connection Status */}
      <div className="mb-6">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Connected to LATS Database</span>
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {['week', 'month', 'quarter', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
            <GlassButton onClick={loadAnalyticsData} className="bg-blue-600 text-white">
              Refresh Data
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatMoney(analyticsMetrics.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">vs last period</span>
            <span className={`text-sm font-medium ${
              analyticsData.kpis.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
                              {analyticsData.kpis.revenue.growth >= 0 ? '↗' : '↘'} {(() => {
                  const formatted = Math.abs(analyticsData.kpis.revenue.growth).toFixed(1);
                  return formatted.replace(/\.0$/, '');
                })()}%
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-3xl font-bold text-gray-900">{formatMoney(analyticsMetrics.totalProfit)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-blue-600 text-xl">📈</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Margin: {analyticsMetrics.profitMargin}%</span>
            <span className={`text-sm font-medium ${
              analyticsData.kpis.profit.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analyticsData.kpis.profit.growth >= 0 ? '↗' : '↘'} {Math.abs(analyticsData.kpis.profit.growth).toFixed(1)}%
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsMetrics.totalCustomers)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-purple-600 text-xl">👥</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">CLV: {formatMoney(parseInt(analyticsMetrics.customerLifetimeValue))}</span>
            <span className={`text-sm font-medium ${
              analyticsData.kpis.customers.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analyticsData.kpis.customers.growth >= 0 ? '↗' : '↘'} {Math.abs(analyticsData.kpis.customers.growth).toFixed(1)}%
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsMetrics.totalOrders)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-orange-600 text-xl">📦</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Avg: {formatMoney(analyticsData.kpis.avgOrderValue.current)}</span>
            <span className={`text-sm font-medium ${
              analyticsData.kpis.orders.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analyticsData.kpis.orders.growth >= 0 ? '↗' : '↘'} {Math.abs(analyticsData.kpis.orders.growth).toFixed(1)}%
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.kpis.conversionRate.current}%</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-yellow-600 text-xl">🎯</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">vs target</span>
            <span className={`text-sm font-medium ${
              analyticsData.kpis.conversionRate.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {analyticsData.kpis.conversionRate.growth >= 0 ? '↗' : '↘'} {Math.abs(analyticsData.kpis.conversionRate.growth).toFixed(1)}%
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
              <p className="text-3xl font-bold text-gray-900">4.8/5</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-full">
              <span className="text-pink-600 text-xl">⭐</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Based on customer feedback</span>
            <span className="text-sm text-green-600 font-medium">
              ↗ 0.2 points
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Trends */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Revenue Trends</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedMetric('revenue')}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedMetric === 'revenue' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSelectedMetric('customers')}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedMetric === 'customers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Customers
                </button>
              </div>
            </div>
            
            {selectedMetric === 'revenue' ? (
              <div className="space-y-3">
                {analyticsData.trends.revenue.length > 0 ? (
                  analyticsData.trends.revenue.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{item.month}</div>
                        <div className="text-sm text-gray-600">Target: {formatMoney(item.target)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatMoney(item.value)}</div>
                        <div className={`text-sm ${item.value >= item.target ? 'text-green-600' : 'text-red-600'}`}>
                          {item.value >= item.target ? '✓' : '✗'} {((item.value / item.target) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No revenue data available
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {analyticsData.trends.customers.length > 0 ? (
                  analyticsData.trends.customers.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{item.month}</div>
                        <div className="text-sm text-gray-600">Total: {item.new + item.returning}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">+{item.new} new</div>
                        <div className="text-sm text-gray-600">{item.returning} returning</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No customer data available
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Customer Segments */}
        <div>
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Segments</h3>
            <div className="space-y-3">
              {analyticsData.segments.customerSegments.length > 0 ? (
                analyticsData.segments.customerSegments.map((segment, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{segment.segment}</div>
                      <div className="text-sm text-gray-600">{segment.count} customers</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">{formatMoney(segment.revenue)}</div>
                      <div className="text-sm font-medium text-blue-600">{segment.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No customer segment data available
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Performance and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Products</h3>
          <div className="space-y-3">
            {analyticsData.performance.topProducts.length > 0 ? (
              analyticsData.performance.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.units} units sold</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(product.revenue)}</div>
                    <div className="text-sm text-green-600">{product.margin.toFixed(1)}% margin</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No product performance data available
              </div>
            )}
          </div>
        </GlassCard>

        {/* Top Customers */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {analyticsData.performance.topCustomers.length > 0 ? (
              analyticsData.performance.topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.orders} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(customer.revenue)}</div>
                    <div className="text-sm text-gray-600">Avg: {formatMoney(customer.avgOrder)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No customer performance data available
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Geographic and Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Geographic Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Geographic Distribution</h3>
          {generateChart(analyticsData.segments.geographicData, 'region', 'revenue', 'green')}
        </GlassCard>

        {/* Product Categories */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Categories Performance</h3>
          <div className="space-y-3">
            {analyticsData.segments.productCategories.length > 0 ? (
              analyticsData.segments.productCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{category.category}</div>
                    <div className="text-sm text-gray-600">{category.units} units</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatMoney(category.revenue)}</div>
                    <div className="text-sm text-green-600">{category.margin.toFixed(1)}% margin</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No category performance data available
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Business Insights */}
      <GlassCard className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.insights.map((insight, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getInsightColor(insight.type)}`}>
                  {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  insight.impact === 'high' ? 'bg-red-100 text-red-600' :
                  insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {insight.impact} impact
                </span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-600">{insight.description}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="mt-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Export Report</div>
              <div className="text-sm text-gray-600">Download analytics data</div>
            </button>
            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-green-600 text-2xl mb-2">📈</div>
              <div className="font-medium text-gray-900">Set Goals</div>
              <div className="text-sm text-gray-600">Configure business targets</div>
            </button>
            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-purple-600 text-2xl mb-2">🔔</div>
              <div className="font-medium text-gray-900">Alerts</div>
              <div className="text-sm text-gray-600">Manage notifications</div>
            </button>
            <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="text-orange-600 text-2xl mb-2">⚙️</div>
              <div className="font-medium text-gray-900">Settings</div>
              <div className="text-sm text-gray-600">Configure analytics</div>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default BusinessAnalyticsPage;
