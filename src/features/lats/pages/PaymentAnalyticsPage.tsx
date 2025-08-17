import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassBadge } from '../components/ui';
import { PaymentTrackingService } from '../payments/PaymentTrackingService';
import type { PaymentStats, PaymentAnalytics } from '../payments/types';
import { format } from '../lib/format';

const PaymentAnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [analytics, setAnalytics] = useState<PaymentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [statsData, analyticsData] = await Promise.all([
        PaymentTrackingService.getPaymentStats(Number(dateRange)),
        PaymentTrackingService.getAnalyticsByDateRange(
          new Date(Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString()
        )
      ]);
      
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
    
    // Remove trailing .00 and .0
    return formatted.replace(/\.00$/, '').replace(/\.0$/, '');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Analytics</h1>
        <p className="text-gray-600">Comprehensive payment performance insights</p>
      </div>

      {/* Date Range Filter */}
      <GlassCard className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <GlassButton onClick={loadAnalytics} size="sm">
            Refresh
          </GlassButton>
        </div>
      </GlassCard>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Today: <span className="font-medium text-gray-900">{stats.todayTransactions}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <span className="text-2xl">📈</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Today: <span className="font-medium text-gray-900">{formatCurrency(stats.todayAmount)}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(() => {
                  const formatted = stats.successRate.toFixed(1);
                  return formatted.replace(/\.0$/, '');
                })()}%</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Avg: <span className="font-medium text-gray-900">{formatCurrency(stats.averageAmount)}</span>
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingTransactions}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Failed: <span className="font-medium text-red-600">{stats.failedTransactions}</span>
              </p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Analytics Chart */}
      <GlassCard className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Payment Trends</h2>
        {analytics.length > 0 ? (
          <div className="space-y-4">
            {analytics.map((day) => (
              <div key={day.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Transactions:</span>
                    <span className="font-medium">{day.total_transactions}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(day.total_amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.successful_transactions} successful
                    </div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${day.total_transactions > 0 ? (day.successful_transactions / day.total_transactions) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No analytics data available for the selected period</p>
          </div>
        )}
      </GlassCard>

      {/* Provider Breakdown */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">Provider Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['zenopay', 'stripe', 'paypal', 'flutterwave', 'mock'].map((provider) => {
            const providerData = analytics.filter(a => a.provider === provider);
            const totalAmount = providerData.reduce((sum, a) => sum + a.total_amount, 0);
            const totalTransactions = providerData.reduce((sum, a) => sum + a.total_transactions, 0);
            const successfulTransactions = providerData.reduce((sum, a) => sum + a.successful_transactions, 0);
            
            return (
              <div key={provider} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {provider === 'zenopay' ? '📱' : 
                     provider === 'stripe' ? '💳' : 
                     provider === 'paypal' ? '🔵' : 
                     provider === 'flutterwave' ? '🌊' : '🧪'}
                  </span>
                  <span className="font-medium text-gray-900 capitalize">{provider}</span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    Amount: <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Transactions: <span className="font-medium">{totalTransactions}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Success Rate: <span className="font-medium">
                      {(() => {
                  const percentage = totalTransactions > 0 ? ((successfulTransactions / totalTransactions) * 100).toFixed(1) : '0';
                  return percentage.replace(/\.0$/, '');
                })()}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};

export default PaymentAnalyticsPage;
