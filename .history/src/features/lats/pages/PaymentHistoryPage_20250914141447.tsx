import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassBadge } from '../components/ui';
import { PaymentTrackingService } from '../payments/PaymentTrackingService';
import type { PaymentTransaction } from '../payments/types';
import { format } from '../lib/format';

const PaymentHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    provider: 'all',
    dateRange: '30'
  });

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await PaymentTrackingService.getRecentTransactions(100);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'zenopay':
        return '📱';
      case 'stripe':
        return '💳';
      case 'paypal':
        return '🔵';
      case 'flutterwave':
        return '🌊';
      case 'mock':
        return '🧪';
      default:
        return '💰';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter.status !== 'all' && transaction.status.toLowerCase() !== filter.status) {
      return false;
    }
    if (filter.provider !== 'all' && transaction.provider !== filter.provider) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment History</h1>
        <p className="text-gray-600">Track all payment transactions and their status</p>
      </div>

      {/* Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={filter.provider}
              onChange={(e) => setFilter(prev => ({ ...prev, provider: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Providers</option>
              <option value="zenopay">ZenoPay</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="flutterwave">Flutterwave</option>
              <option value="mock">Mock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Transactions List */}
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Transactions ({filteredTransactions.length})</h2>
          <GlassButton onClick={loadTransactions} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </GlassButton>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Provider</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Currency</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm text-gray-900">
                        {transaction.order_id.slice(-8)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getProviderIcon(transaction.provider)}</span>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {transaction.provider}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">
                        {format.money(transaction.amount)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <GlassBadge variant={getStatusBadgeVariant(transaction.status)} size="sm">
                        {transaction.status}
                      </GlassBadge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{transaction.customer_name || 'N/A'}</div>
                        <div className="text-gray-500">{transaction.customer_email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 font-mono">
                        {transaction.reference || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default PaymentHistoryPage;
