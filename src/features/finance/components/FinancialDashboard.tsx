import React, { useState } from 'react';
import useFinancialData from '../hooks/useFinancialData';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Filter,
  FileText,
  Users,
  Package,
  Receipt,
  Building,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Legend
} from 'recharts';

interface FinancialDashboardProps {
  showDetails?: boolean;
  onExport?: (data: string) => void;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ 
  showDetails = true, 
  onExport 
}) => {
  const {
    summary,
    payments,
    expenses,
    accounts,
    transfers,
    revenue,
    trends,
    loading,
    error,
    refreshData,
    exportData,
    clearError
  } = useFinancialData();

  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return 'Tsh ' + Number(amount).toLocaleString('en-TZ', { maximumFractionDigits: 0 });
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (value < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const data = await exportData(format);
      if (onExport) {
        onExport(data);
      } else {
        // Create and download file
        const blob = new Blob([data], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial-data-${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(`Financial data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-600">Error Loading Financial Data</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <GlassButton onClick={clearError}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </GlassButton>
      </GlassCard>
    );
  }

  if (!summary) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No financial data available</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive overview of all financial data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton
            variant="outline"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
          >
            {showSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showSensitiveData ? 'Hide' : 'Show'} Details
          </GlassButton>
          <GlassButton
            variant="outline"
            onClick={() => handleExport('csv')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </GlassButton>
          <GlassButton
            onClick={refreshData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {showSensitiveData ? formatCurrency(summary.totalRevenue) : '***'}
              </p>
              {revenue && (
                <div className="flex items-center gap-1 mt-2">
                  {getGrowthIcon(revenue.growth_percentage)}
                  <span className={`text-sm ${getGrowthColor(revenue.growth_percentage)}`}>
                    {formatPercentage(revenue.growth_percentage)}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </GlassCard>

        {/* Net Profit */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Net Profit
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {showSensitiveData ? formatCurrency(summary.netProfit) : '***'}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {getGrowthIcon(summary.profitGrowth)}
                <span className={`text-sm ${getGrowthColor(summary.profitGrowth)}`}>
                  {formatPercentage(summary.profitGrowth)}
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </GlassCard>

        {/* Total Balance */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Balance
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {showSensitiveData ? formatCurrency(summary.totalBalance) : '***'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {summary.totalAccounts} accounts
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </GlassCard>

        {/* Outstanding Payments */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Outstanding
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {showSensitiveData ? formatCurrency(summary.totalOutstanding) : '***'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {summary.pendingPayments} pending
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Expenses */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Revenue vs Expenses
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Revenue:</span>
                <span className="font-medium">
                  {showSensitiveData ? formatCurrency(summary.monthlyRevenue) : '***'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Expenses:</span>
                <span className="font-medium">
                  {showSensitiveData ? formatCurrency(summary.monthlyExpenses) : '***'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Profit:</span>
                <span className={`font-medium ${summary.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {showSensitiveData ? formatCurrency(summary.monthlyProfit) : '***'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Payment Statistics */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Payment Statistics
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Payments:</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{summary.completedPayments}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Payments:</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{summary.pendingPayments}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Transaction:</span>
                <span className="font-medium">
                  {showSensitiveData ? formatCurrency(summary.averageTransaction) : '***'}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Charts Section */}
      {showDetails && trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <LineChart className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Revenue Trend
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={trends.monthly.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Profit Trend */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Profit Trend
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={trends.monthly.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Profit"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}

      {/* Recent Activity */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Recent Payments
                </h3>
              </div>
              <span className="text-sm text-gray-500">{payments.length} total</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {payment.customer_name || 'Unknown Customer'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {showSensitiveData ? formatCurrency(payment.amount) : '***'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {payment.method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Expenses */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Recent Expenses
                </h3>
              </div>
              <span className="text-sm text-gray-500">{expenses.length} total</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{expense.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {showSensitiveData ? formatCurrency(expense.amount) : '***'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {expense.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard; 