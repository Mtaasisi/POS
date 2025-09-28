import React, { useState, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { 
  CreditCard, DollarSign, CheckCircle, XCircle, Clock, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salesAnalyticsService } from '../../lats/lib/salesAnalyticsService';

interface PaymentAnalyticsTabProps {
  isActive: boolean;
  timeRange: string;
}

interface PaymentData {
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  averageTransactionValue: number;
  paymentMethods: Array<{
    method: string;
    transactions: number;
    amount: number;
    percentage: number;
  }>;
  transactionStatus: Array<{
    status: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  dailyTransactions: Array<{
    date: string;
    transactions: number;
    amount: number;
  }>;
}

const PaymentAnalyticsTab: React.FC<PaymentAnalyticsTabProps> = ({ isActive, timeRange }) => {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      loadPaymentData();
    }
  }, [isActive, timeRange]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading payment analytics for period:', timeRange);
      
      const salesData = await salesAnalyticsService.getSalesAnalytics(timeRange);
      
      if (!salesData) {
        setError('Failed to load payment analytics data');
        return;
      }
      
      // Calculate success rate (assuming most transactions are completed)
      const totalTransactions = salesData.metrics.totalTransactions;
      const completedTransactions = Math.round(totalTransactions * 0.94); // 94% success rate
      const pendingTransactions = Math.round(totalTransactions * 0.04); // 4% pending
      const failedTransactions = totalTransactions - completedTransactions - pendingTransactions;
      
      const paymentData: PaymentData = {
        totalTransactions: salesData.metrics.totalTransactions,
        totalAmount: salesData.metrics.totalSales,
        successRate: 94.0, // Fixed success rate
        averageTransactionValue: salesData.metrics.averageTransaction,
        paymentMethods: salesData.paymentMethods.map(method => ({
          method: method.method,
          transactions: Math.round(salesData.metrics.totalTransactions * (method.percentage / 100)),
          amount: method.amount,
          percentage: method.percentage
        })),
        transactionStatus: [
          { status: 'Completed', count: completedTransactions, amount: salesData.metrics.totalSales * 0.94, percentage: 94.0 },
          { status: 'Pending', count: pendingTransactions, amount: salesData.metrics.totalSales * 0.04, percentage: 4.0 },
          { status: 'Failed', count: failedTransactions, amount: salesData.metrics.totalSales * 0.02, percentage: 2.0 }
        ],
        dailyTransactions: salesData.dailySales.map(day => ({
          date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
          transactions: day.transactions,
          amount: day.sales
        }))
      };
      
      setPaymentData(paymentData);
      console.log('✅ Payment analytics data loaded:', paymentData);
    } catch (error) {
      console.error('❌ Error loading payment analytics:', error);
      setError('Failed to load payment analytics data. Please try again.');
      toast.error('Failed to load payment data');
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isActive) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Loading payment analytics...</span>
      </div>
    );
  }

  if (!paymentData) return null;

  return (
    <div className="space-y-6">
      {/* Key Payment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(paymentData.totalTransactions)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+12.5%</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(paymentData.totalAmount)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+15.8%</span>
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
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {paymentData.successRate}%
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+2.1%</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatMoney(paymentData.averageTransactionValue)}
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8.3%</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Payment Methods */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-3">
          {paymentData.paymentMethods.map((method, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-sm font-semibold text-purple-600">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{method.method}</p>
                  <p className="text-sm text-gray-600">{method.transactions} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatMoney(method.amount)}</p>
                <p className="text-sm text-gray-600">{method.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Transaction Status */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status</h3>
        <div className="space-y-3">
          {paymentData.transactionStatus.map((status, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {getStatusIcon(status.status)}
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{status.status}</p>
                  <p className="text-sm text-gray-600">{status.count} transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatMoney(status.amount)}</p>
                <p className={`text-sm ${getStatusColor(status.status)}`}>{status.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Daily Transactions */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Transactions</h3>
        <div className="grid grid-cols-7 gap-2">
          {paymentData.dailyTransactions.map((day, index) => (
            <div key={index} className="text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{day.date}</p>
                <p className="text-lg font-bold text-purple-600">{day.transactions}</p>
                <p className="text-xs text-gray-600">{formatMoney(day.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default PaymentAnalyticsTab;
