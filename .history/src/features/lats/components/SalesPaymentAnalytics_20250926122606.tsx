import React, { useState, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import { 
  salesPaymentTrackingService, 
  SalesPaymentMetrics, 
  SalesPaymentSummary 
} from '../../../lib/salesPaymentTrackingService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';

interface SalesPaymentAnalyticsProps {
  filter?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentMethod?: string;
  };
}

const SalesPaymentAnalytics: React.FC<SalesPaymentAnalyticsProps> = ({ filter = {} }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SalesPaymentMetrics>({
    totalSales: 0,
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0,
    cancelledAmount: 0,
    refundedAmount: 0,
    averageSaleAmount: 0,
    totalItems: 0,
    successRate: 0
  });
  const [dailySummary, setDailySummary] = useState<SalesPaymentSummary[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [filter]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [metricsData, summaryData, methodData, statusData] = await Promise.all([
        salesPaymentTrackingService.calculateSalesPaymentMetrics(filter),
        salesPaymentTrackingService.getSalesPaymentSummary(7),
        salesPaymentTrackingService.getSalesByPaymentMethod(filter),
        salesPaymentTrackingService.fetchSalesPayments(filter)
      ]);

      setMetrics(metricsData);
      setDailySummary(summaryData);

      // Process payment method data
      const methodChartData = Object.entries(methodData).map(([method, sales]: [string, any]) => ({
        method,
        amount: sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0),
        count: sales.length
      }));

      setPaymentMethodData(methodChartData);

      // Process status data
      const statusChartData = [
        { name: 'Completed', value: metricsData.completedAmount, count: metricsData.totalSales * (metricsData.successRate / 100) },
        { name: 'Pending', value: metricsData.pendingAmount, count: metricsData.totalSales * ((100 - metricsData.successRate) / 100) },
        { name: 'Cancelled', value: metricsData.cancelledAmount, count: 0 },
        { name: 'Refunded', value: metricsData.refundedAmount, count: 0 }
      ].filter(item => item.value > 0);

      setStatusData(statusChartData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency in TSH
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalSales}</p>
              <p className="text-sm text-gray-500">{metrics.totalItems} items sold</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalAmount)}</p>
              <p className="text-sm text-gray-500">Avg: {formatCurrency(metrics.averageSaleAmount)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.successRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">{formatCurrency(metrics.completedAmount)} completed</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.pendingAmount)}</p>
              <p className="text-sm text-gray-500">Awaiting completion</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </GlassCard>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'totalAmount' ? formatCurrency(value) : value,
                    name === 'totalAmount' ? 'Revenue' : name === 'totalSales' ? 'Sales Count' : name
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalAmount" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Payment Methods */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, amount }) => `${method}: ${formatCurrency(amount)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Status Distribution */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Payment Method Performance */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'amount' ? formatCurrency(value) : value,
                    name === 'amount' ? 'Amount' : 'Count'
                  ]}
                />
                <Bar dataKey="amount" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.completedAmount)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.pendingAmount)}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.cancelledAmount)}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Summary Table */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Sale</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailySummary.map((day) => (
                <tr key={day.date}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-TZ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.totalSales}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(day.totalAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(day.completedAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(day.pendingAmount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(day.averageSaleAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default SalesPaymentAnalytics;
