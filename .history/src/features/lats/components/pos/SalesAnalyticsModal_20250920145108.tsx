import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, Package, Download, X, RefreshCw } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { salesAnalyticsService, SalesAnalyticsData } from '../../lib/salesAnalyticsService';
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock';

interface SalesAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SalesAnalyticsModal: React.FC<SalesAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'1d' | '7d' | '30d' | '90d'>('1d');
  const [analyticsData, setAnalyticsData] = useState<SalesAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load analytics data when modal opens or period changes
  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, analyticsPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading sales analytics for period:', analyticsPeriod);
      const data = await salesAnalyticsService.getSalesAnalytics(analyticsPeriod);
      
      if (data) {
        setAnalyticsData(data);
        console.log('✅ Sales analytics data loaded:', data);
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

  // Export analytics data
  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const csvContent = `Period,Total Sales,Total Transactions,Average Transaction\n${analyticsPeriod},${analyticsData.metrics.totalSales},${analyticsData.metrics.totalTransactions},${analyticsData.metrics.averageTransaction}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-analytics-${analyticsPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Prevent body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Sales Analytics</h2>
              <p className="text-base text-gray-600">Comprehensive sales performance insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalyticsData}
              disabled={loading}
              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <div className="flex gap-2">
              {(['1d', '7d', '30d', '90d'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setAnalyticsPeriod(period)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    analyticsPeriod === period
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                  }`}
                >
                  {period === '1d' ? 'Today' : 
                   period === '7d' ? '7 Days' : 
                   period === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sales analytics...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 text-2xl mb-4">⚠️</div>
              <div className="text-gray-600 mb-4">{error}</div>
              <button 
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {!loading && !error && analyticsData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Total Sales</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{formatMoney(analyticsData.metrics.totalSales)}</div>
                <div className="text-sm text-blue-600">{analyticsData.metrics.totalTransactions} transactions</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Transactions</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{analyticsData.metrics.totalTransactions}</div>
                <div className="text-sm text-green-600">Total orders</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Average Order</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{formatMoney(analyticsData.metrics.averageTransaction)}</div>
                <div className="text-sm text-purple-600">Per transaction</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Growth Rate</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{analyticsData.metrics.growthRate.toFixed(1)}%</div>
                <div className="text-sm text-orange-600">Period growth</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Products */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Top Products
                </h3>
                <div className="space-y-3">
                  {analyticsData.topProducts.length > 0 ? (
                    analyticsData.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.quantity} units sold</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{formatMoney(product.sales)}</div>
                          <div className="text-xs text-gray-500">{product.percentage}% of total</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No product sales data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Methods
                </h3>
                <div className="space-y-3">
                  {analyticsData.paymentMethods.length > 0 ? (
                    analyticsData.paymentMethods.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 capitalize">{method.method}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">{formatMoney(method.amount)}</div>
                          <div className="text-xs text-gray-500">{method.percentage}% of total</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No payment method data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Sales by Day */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Sales by Day
                </h3>
                <div className="space-y-2">
                  {analyticsData.dailySales.length > 0 ? (
                    analyticsData.dailySales.map((dayData, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="font-medium text-gray-900">{dayData.date}</div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{formatMoney(dayData.sales)}</div>
                          <div className="text-sm text-gray-600">{dayData.transactions} transactions</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No daily sales data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Segments */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Segments
                </h3>
                <div className="space-y-3">
                  {analyticsData.customerSegments.length > 0 ? (
                    analyticsData.customerSegments.map((segment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{segment.segment}</div>
                          <div className="text-sm text-gray-600">{segment.customers} customers</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-purple-600">{formatMoney(segment.sales)}</div>
                          <div className="text-xs text-gray-500">{segment.percentage}% of total</div>
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
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                className="flex-1 py-4 text-lg font-semibold"
              >
                Close
              </GlassButton>
              <GlassButton
                onClick={exportAnalytics}
                className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export Analytics
              </GlassButton>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && !analyticsData && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-gray-600 mb-4">No sales data available for the selected period</p>
              <button 
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default SalesAnalyticsModal;
