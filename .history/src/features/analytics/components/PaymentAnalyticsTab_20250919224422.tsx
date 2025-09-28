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
      
      // Mock payment data
      const mockData: PaymentData = {
        totalTransactions: 1247,
        totalAmount: 12500000,
        successRate: 94.2,
        averageTransactionValue: 10032,
        paymentMethods: [
          { method: 'Mobile Money', transactions: 456, amount: 4560000, percentage: 36.5 },
          { method: 'Cash', transactions: 234, amount: 2340000, percentage: 18.7 },
          { method: 'Card', transactions: 189, amount: 1890000, percentage: 15.1 },
          { method: 'Bank Transfer', transactions: 156, amount: 1560000, percentage: 12.5 },
          { method: 'Beem', transactions: 212, amount: 2150000, percentage: 17.2 }
        ],
        transactionStatus: [
          { status: 'Completed', count: 1174, amount: 11740000, percentage: 94.2 },
          { status: 'Pending', count: 45, amount: 450000, percentage: 3.6 },
          { status: 'Failed', count: 28, amount: 280000, percentage: 2.2 }
        ],
        dailyTransactions: [
          { date: 'Mon', transactions: 45, amount: 450000 },
          { date: 'Tue', transactions: 52, amount: 520000 },
          { date: 'Wed', transactions: 38, amount: 380000 },
          { date: 'Thu', transactions: 61, amount: 610000 },
          { date: 'Fri', transactions: 48, amount: 480000 },
          { date: 'Sat', transactions: 55, amount: 550000 },
          { date: 'Sun', transactions: 42, amount: 420000 }
        ]
      };
      
      setPaymentData(mockData);
    } catch (error) {
      console.error('Error loading payment data:', error);
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
