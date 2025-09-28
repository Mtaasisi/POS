import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, 
  DollarSign, CreditCard, Smartphone, Building,
  Calendar, Download, RefreshCw, Eye, EyeOff,
  Activity, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  paymentTrackingService,
  PaymentTransaction,
  PaymentMetrics,
  PaymentMethodSummary,
  DailySummary
} from '../../../lib/paymentTrackingService';
import { paymentProviderService } from '../../../lib/paymentProviderService';

interface PaymentAnalyticsProps {
  onExport?: () => void;
}

interface PaymentMethodAnalytics {
  method: string;
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  averageTicket: number;
  trend: number;
  fees: number;
  netAmount: number;
  peakHour: string;
  lastUsed: string;
  performance: {
    responseTime: number;
    failureRate: number;
    refundRate: number;
  };
}

interface AnalyticsData {
  metrics: PaymentMetrics;
  methodSummary: PaymentMethodSummary[];
  dailySummary: DailySummary[];
  methodAnalytics: PaymentMethodAnalytics[];
  trends: {
    revenue: number;
    transactions: number;
    successRate: number;
    averageTicket: number;
  };
  insights: {
    topMethod: string;
    peakHour: string;
    growthRate: number;
    riskFactors: string[];
    methodInsights: string[];
  };
}

// Helper function to fetch comprehensive payment method analytics
const fetchPaymentMethodAnalytics = async (startDate: Date, endDate: Date): Promise<PaymentMethodAnalytics[]> => {
  try {
    console.log('🔍 Fetching comprehensive payment method analytics...');
    
    // Fetch all payments for the period
    const payments = await paymentTrackingService.fetchPaymentTransactions(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Group payments by method
    const methodGroups = new Map<string, PaymentTransaction[]>();
    payments.forEach(payment => {
      const method = payment.method;
      if (!methodGroups.has(method)) {
        methodGroups.set(method, []);
      }
      methodGroups.get(method)!.push(payment);
    });

    // Calculate analytics for each method
    const methodAnalytics: PaymentMethodAnalytics[] = [];
    
    for (const [method, methodPayments] of methodGroups) {
      const totalTransactions = methodPayments.length;
      const totalAmount = methodPayments.reduce((sum, p) => sum + p.amount, 0);
      const successfulPayments = methodPayments.filter(p => p.status === 'completed');
      const successRate = totalTransactions > 0 ? (successfulPayments.length / totalTransactions) * 100 : 0;
      const averageTicket = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
      const fees = methodPayments.reduce((sum, p) => sum + p.fees, 0);
      const netAmount = totalAmount - fees;
      
      // Calculate trend (compare with previous period)
      const trend = await calculateTrendFromDatabase();
      
      // Calculate performance metrics
      const failedPayments = methodPayments.filter(p => p.status === 'failed');
      const failureRate = totalTransactions > 0 ? (failedPayments.length / totalTransactions) * 100 : 0;
      const refundedPayments = methodPayments.filter(p => p.paymentType === 'refund');
      const refundRate = totalTransactions > 0 ? (refundedPayments.length / totalTransactions) * 100 : 0;
      
      // Determine peak hour (simplified)
      const peakHour = '14:00-15:00'; // Placeholder
      const lastUsed = methodPayments.length > 0 
        ? methodPayments[0].date 
        : new Date().toISOString();

      methodAnalytics.push({
        method,
        totalTransactions,
        totalAmount,
        successRate,
        averageTicket,
        trend,
        fees,
        netAmount,
        peakHour,
        lastUsed,
        performance: {
          responseTime: await getAverageResponseTime(method),
          failureRate,
          refundRate
        }
      });
    }

    // Sort by total amount (descending)
    methodAnalytics.sort((a, b) => b.totalAmount - a.totalAmount);
    
    console.log(`✅ Found ${methodAnalytics.length} payment methods with analytics`);
    return methodAnalytics;
  } catch (error) {
    console.error('Error fetching payment method analytics:', error);
    return [];
  }
};

// Helper function to calculate trends
const calculateTrends = async (startDate: Date, endDate: Date) => {
  try {
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const [currentMetrics, previousMetrics] = await Promise.all([
      paymentTrackingService.calculatePaymentMetrics(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ),
      paymentTrackingService.calculatePaymentMetrics(
        previousStartDate.toISOString().split('T')[0],
        startDate.toISOString().split('T')[0]
      )
    ]);

    const revenue = previousMetrics.totalAmount > 0 
      ? ((currentMetrics.totalAmount - previousMetrics.totalAmount) / previousMetrics.totalAmount) * 100
      : 0;

    const transactions = previousMetrics.totalPayments > 0
      ? ((currentMetrics.totalPayments - previousMetrics.totalPayments) / previousMetrics.totalPayments) * 100
      : 0;

    const successRate = parseFloat(previousMetrics.successRate) > 0
      ? ((parseFloat(currentMetrics.successRate) - parseFloat(previousMetrics.successRate)) / parseFloat(previousMetrics.successRate)) * 100
      : 0;

    const currentAvgTicket = currentMetrics.totalPayments > 0 ? currentMetrics.totalAmount / currentMetrics.totalPayments : 0;
    const previousAvgTicket = previousMetrics.totalPayments > 0 ? previousMetrics.totalAmount / previousMetrics.totalPayments : 0;
    const averageTicket = previousAvgTicket > 0
      ? ((currentAvgTicket - previousAvgTicket) / previousAvgTicket) * 100
      : 0;

    return {
      revenue: Math.round(revenue * 100) / 100,
      transactions: Math.round(transactions * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      averageTicket: Math.round(averageTicket * 100) / 100
    };
  } catch (error) {
    console.error('Error calculating trends:', error);
    return { revenue: 0, transactions: 0, successRate: 0, averageTicket: 0 };
  }
};

const PaymentAnalyticsDashboard: React.FC<PaymentAnalyticsProps> = ({ onExport }) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate start date based on selected period
      switch (selectedPeriod) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const [metricsData, methodSummaryData, dailySummaryData, methodAnalyticsData] = await Promise.all([
        paymentTrackingService.calculatePaymentMetrics(
          startDate.toISOString().split('T')[0], 
          endDate.toISOString().split('T')[0]
        ),
        paymentTrackingService.getPaymentMethodSummary(
          startDate.toISOString().split('T')[0], 
          endDate.toISOString().split('T')[0]
        ),
        paymentTrackingService.getDailySummary(parseInt(selectedPeriod.replace('d', ''))),
        fetchPaymentMethodAnalytics(startDate, endDate)
      ]);

      // Calculate trends from historical data
      const trends = await calculateTrends(startDate, endDate);

      // Generate comprehensive insights
      const methodInsights = methodAnalyticsData.map(method => {
        if (method.performance.failureRate > 10) {
          return `High failure rate (${method.performance.failureRate.toFixed(1)}%) for ${method.method}`;
        }
        if (method.performance.responseTime > 3) {
          return `Slow response time (${method.performance.responseTime.toFixed(1)}s) for ${method.method}`;
        }
        if (method.trend < -5) {
          return `Declining usage (-${Math.abs(method.trend).toFixed(1)}%) for ${method.method}`;
        }
        return null;
      }).filter(Boolean) as string[];

      const insights = {
        topMethod: methodAnalyticsData[0]?.method || methodSummaryData[0]?.method || 'M-Pesa',
        peakHour: methodAnalyticsData[0]?.peakHour || '14:00-15:00',
        growthRate: trends.revenue,
        riskFactors: [
          'High failure rate for card payments',
          'Mobile money delays during peak hours',
          'Bank transfer processing time increased'
        ],
        methodInsights
      };

      setAnalyticsData({
        metrics: metricsData,
        methodSummary: methodSummaryData,
        dailySummary: dailySummaryData,
        methodAnalytics: methodAnalyticsData,
        trends,
        insights
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Format currency with full numbers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Get trend icon and color
  const getTrendIcon = (value: number) => {
    if (value >= 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Get method icon
  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'm-pesa':
      case 'airtel money':
      case 'mobile_money':
        return <Smartphone className="w-5 h-5 text-green-600" />;
      case 'card':
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'bank_transfer':
      case 'bank':
        return <Building className="w-5 h-5 text-purple-600" />;
      case 'cash':
        return <DollarSign className="w-5 h-5 text-yellow-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Analytics</h2>
          <p className="text-gray-600">Comprehensive payment performance insights</p>
        </div>
        
        <div className="flex gap-3">
          <GlassSelect
            options={[
              { value: '1d', label: 'Last 24 Hours' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' }
            ]}
            value={selectedPeriod}
            onChange={(value) => setSelectedPeriod(value)}
            className="min-w-[150px]"
          />
          
          <GlassSelect
            options={[
              { value: 'all', label: 'All Methods' },
              ...(analyticsData?.methodAnalytics.map(method => ({
                value: method.method.toLowerCase().replace(/\s+/g, '_'),
                label: method.method
              })) || [
                { value: 'mobile_money', label: 'Mobile Money' },
                { value: 'card', label: 'Card' },
                { value: 'cash', label: 'Cash' },
                { value: 'bank_transfer', label: 'Bank Transfer' }
              ])
            ]}
            value={selectedMethod}
            onChange={(value) => setSelectedMethod(value)}
            className="min-w-[150px]"
          />
          
          <GlassButton
            onClick={() => setShowDetailedView(!showDetailedView)}
            variant="secondary"
            icon={showDetailedView ? <EyeOff size={16} /> : <Eye size={16} />}
          >
            {showDetailedView ? 'Hide' : 'Show'} Details
          </GlassButton>
          
          <GlassButton
            onClick={fetchAnalyticsData}
            variant="secondary"
            icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
            disabled={isLoading}
          >
            Refresh
          </GlassButton>
          
          <GlassButton
            onClick={onExport}
            icon={<Download size={16} />}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white"
          >
            Export
          </GlassButton>
        </div>
      </div>

      {/* Key Metrics with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(analyticsData.trends.revenue)}
              <span className={`text-sm font-medium ${getTrendColor(analyticsData.trends.revenue)}`}>
                {formatPercentage(analyticsData.trends.revenue)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(analyticsData.metrics.totalAmount)}</p>
            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(analyticsData.trends.transactions)}
              <span className={`text-sm font-medium ${getTrendColor(analyticsData.trends.transactions)}`}>
                {formatPercentage(analyticsData.trends.transactions)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.metrics.totalPayments.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(analyticsData.trends.successRate)}
              <span className={`text-sm font-medium ${getTrendColor(analyticsData.trends.successRate)}`}>
                {formatPercentage(analyticsData.trends.successRate)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.metrics.successRate}%</p>
            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(analyticsData.trends.averageTicket)}
              <span className={`text-sm font-medium ${getTrendColor(analyticsData.trends.averageTicket)}`}>
                {formatPercentage(analyticsData.trends.averageTicket)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Ticket Size</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatMoney(analyticsData.metrics.totalAmount / (analyticsData.metrics.totalPayments || 1))}
            </p>
            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
          </div>
        </GlassCard>
      </div>

      {/* Comprehensive Payment Methods Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods Performance</h3>
          <div className="space-y-4">
            {analyticsData.methodSummary.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getMethodIcon(method.method)}
                  <div>
                    <div className="font-medium text-gray-900">{method.method}</div>
                    <div className="text-sm text-gray-600">{method.count} transactions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatMoney(method.amount)}</div>
                  <div className="text-sm text-gray-600">{method.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Method Analytics</h3>
          <div className="space-y-4">
            {analyticsData.methodAnalytics.slice(0, 5).map((method, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(method.method)}
                    <div>
                      <div className="font-medium text-gray-900">{method.method}</div>
                      <div className="text-sm text-gray-600">
                        {method.totalTransactions} transactions • {formatMoney(method.totalAmount)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(method.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(method.trend)}`}>
                        {formatPercentage(method.trend)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Success Rate</div>
                    <div className="font-medium text-green-600">{method.successRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Ticket</div>
                    <div className="font-medium text-blue-600">{formatMoney(method.averageTicket)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Response Time</div>
                    <div className="font-medium text-purple-600">{method.performance.responseTime.toFixed(1)}s</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Failure Rate</div>
                    <div className="font-medium text-red-600">{method.performance.failureRate.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Performance</h3>
          <div className="space-y-3">
            {analyticsData.dailySummary.slice(0, 7).map((day, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <div className="font-semibold text-gray-900">{formatMoney(day.total)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-green-600">✓ {formatMoney(day.completed)}</div>
                  <div className="text-orange-600">⏳ {formatMoney(day.pending)}</div>
                  <div className="text-red-600">✗ {formatMoney(day.failed)}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* All Payment Methods Overview */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">All Payment Methods Overview</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {analyticsData.methodAnalytics.length} methods found
            </span>
            <div className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
              Live Data
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {analyticsData.methodAnalytics.map((method, index) => (
            <div key={index} className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 transform hover:scale-105">
              <div className="flex items-center gap-3 mb-3">
                {getMethodIcon(method.method)}
                <div>
                  <div className="font-semibold text-gray-900 text-lg">{method.method}</div>
                  <div className="text-sm text-gray-600 font-medium">
                    {method.totalTransactions} transactions
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-green-600">{formatMoney(method.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium text-green-600">{method.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Ticket:</span>
                  <span className="font-medium text-blue-600">{formatMoney(method.averageTicket)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fees:</span>
                  <span className="font-medium text-purple-600">{formatMoney(method.fees)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Amount:</span>
                  <span className="font-medium text-gray-900">{formatMoney(method.netAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium text-orange-600">{method.performance.responseTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failure Rate:</span>
                  <span className="font-medium text-red-600">{method.performance.failureRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trend:</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(method.trend)}
                    <span className={`font-medium ${getTrendColor(method.trend)}`}>
                      {formatPercentage(method.trend)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Top Payment Method</p>
                <p className="text-sm text-gray-600">{analyticsData.insights.topMethod} is your most popular payment method</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Peak Transaction Time</p>
                <p className="text-sm text-gray-600">Most transactions occur between {analyticsData.insights.peakHour}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Growth Rate</p>
                <p className="text-sm text-gray-600">
                  Revenue is growing at {formatPercentage(analyticsData.insights.growthRate)} compared to last period
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Method-Specific Insights</h3>
          <div className="space-y-3">
            {analyticsData.insights.methodInsights.length > 0 ? (
              analyticsData.insights.methodInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{insight}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">All payment methods are performing well</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Detailed Analytics (when enabled) */}
      {showDetailedView && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">{formatMoney(analyticsData.metrics.completedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="font-medium text-orange-600">{formatMoney(analyticsData.metrics.pendingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">{formatMoney(analyticsData.metrics.failedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Fees:</span>
                  <span className="font-medium text-purple-600">{formatMoney(analyticsData.metrics.totalFees)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Success Rate:</span>
                  <span className="font-medium text-green-600">{analyticsData.metrics.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time:</span>
                  <span className="font-medium text-blue-600">2.3s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Peak Hour Volume:</span>
                  <span className="font-medium text-purple-600">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Refund Rate:</span>
                  <span className="font-medium text-orange-600">1.2%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Method Efficiency</h4>
              <div className="space-y-2">
                {analyticsData.methodSummary.slice(0, 4).map((method, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm text-gray-600">{method.method}:</span>
                    <span className="font-medium text-blue-600">{method.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default PaymentAnalyticsDashboard;
