import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { paymentTrackingService, PaymentTransaction } from '../../../lib/paymentTrackingService';
import { 
  CreditCard, DollarSign, TrendingUp, Users, 
  CheckCircle2, Clock, XCircle, Eye, Download,
  Calendar, Filter, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PaymentsByMethodViewProps {
  onViewDetails?: (payment: PaymentTransaction) => void;
  onExport?: (method: string, payments: PaymentTransaction[]) => void;
}

const PaymentsByMethodView: React.FC<PaymentsByMethodViewProps> = ({
  onViewDetails,
  onExport
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentsByMethod, setPaymentsByMethod] = useState<{ [method: string]: PaymentTransaction[] }>({});
  const [methodStatistics, setMethodStatistics] = useState<{ [method: string]: any }>({});
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Fetch payments grouped by method
  const fetchPaymentsByMethod = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching payments by method...');
      
      const [paymentsData, statisticsData] = await Promise.all([
        paymentTrackingService.getPaymentsByMethod(
          dateFilter !== 'all' ? getDateRange(dateFilter).start : undefined,
          dateFilter !== 'all' ? getDateRange(dateFilter).end : undefined,
          statusFilter !== 'all' ? statusFilter : undefined
        ),
        paymentTrackingService.getPaymentMethodStatistics(
          dateFilter !== 'all' ? getDateRange(dateFilter).start : undefined,
          dateFilter !== 'all' ? getDateRange(dateFilter).end : undefined
        )
      ]);

      setPaymentsByMethod(paymentsData);
      setMethodStatistics(statisticsData);
      
      console.log(`✅ Loaded payments for ${Object.keys(paymentsData).length} methods`);
    } catch (error) {
      console.error('Error fetching payments by method:', error);
      toast.error('Failed to load payments by method');
    } finally {
      setIsLoading(false);
    }
  };

  // Get date range based on filter
  const getDateRange = (filter: string) => {
    const today = new Date();
    const start = new Date();
    
    switch (filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        return { start: start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      case 'week':
        start.setDate(today.getDate() - 7);
        return { start: start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      case 'month':
        start.setMonth(today.getMonth() - 1);
        return { start: start.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      default:
        return { start: undefined, end: undefined };
    }
  };

  // Format money
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get method icon
  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'm-pesa':
      case 'mpesa':
        return '📱';
      case 'bank transfer':
      case 'transfer':
        return '🏦';
      default:
        return '💳';
    }
  };

  // Get method color
  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'from-green-50 to-green-100 border-green-200';
      case 'card':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'm-pesa':
      case 'mpesa':
        return 'from-purple-50 to-purple-100 border-purple-200';
      case 'bank transfer':
      case 'transfer':
        return 'from-indigo-50 to-indigo-100 border-indigo-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  // Filter payments by search query
  const filterPayments = (payments: PaymentTransaction[]) => {
    if (!searchQuery) return payments;
    
    return payments.filter(payment =>
      payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Export payments for a method
  const handleExportMethod = (method: string, payments: PaymentTransaction[]) => {
    if (onExport) {
      onExport(method, payments);
    } else {
      const csvContent = [
        'Transaction ID,Customer,Amount,Status,Date,Reference',
        ...payments.map(payment => 
          `${payment.transactionId},${payment.customerName},${payment.amount},${payment.status},${payment.date},${payment.reference}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${method.toLowerCase().replace(/\s+/g, '_')}_payments.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${method} payments exported successfully`);
    }
  };

  // View payment details
  const handleViewDetails = (payment: PaymentTransaction) => {
    if (onViewDetails) {
      onViewDetails(payment);
    }
  };

  useEffect(() => {
    fetchPaymentsByMethod();
  }, [statusFilter, dateFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments by method...</p>
        </div>
      </div>
    );
  }

  const methods = Object.keys(paymentsByMethod);
  const totalPayments = Object.values(paymentsByMethod).flat().length;
  const totalAmount = Object.values(paymentsByMethod).flat().reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payments by Method</h2>
          <p className="text-gray-600 mt-1">
            {totalPayments} payments • {formatMoney(totalAmount)} total
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search payments by customer, transaction ID, or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Method Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {methods.map((method) => {
          const payments = filterPayments(paymentsByMethod[method]);
          const stats = methodStatistics[method] || {};
          const methodColor = getMethodColor(method);
          
          return (
            <div key={method} className={`bg-gradient-to-br ${methodColor} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
              {/* Method Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getMethodIcon(method)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{method}</h3>
                    <p className="text-sm text-gray-600">{payments.length} payments</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleExportMethod(method, payments)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                  title="Export payments"
                >
                  <Download size={16} />
                </button>
              </div>

              {/* Method Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatMoney(stats.totalAmount || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Amount</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {((stats.successRate || 0)).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="flex items-center justify-between text-sm mb-4">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">{stats.completedCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700">{stats.pendingCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700">{stats.failedCount || 0}</span>
                </div>
              </div>

              {/* Recent Payments */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Payments</h4>
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {payment.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.transactionId}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatMoney(payment.amount)}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {payments.length > 3 && (
                  <div className="text-center">
                    <button
                      onClick={() => setSelectedMethod(selectedMethod === method ? null : method)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all {payments.length} payments
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed View for Selected Method */}
      {selectedMethod && paymentsByMethod[selectedMethod] && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{getMethodIcon(selectedMethod)}</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedMethod} Payments</h3>
                <p className="text-gray-600">{filterPayments(paymentsByMethod[selectedMethod]).length} payments</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Payment List */}
          <div className="space-y-2">
            {filterPayments(paymentsByMethod[selectedMethod]).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {payment.customerName}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {payment.transactionId}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatMoney(payment.amount)}
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleViewDetails(payment)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {methods.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No payments were found for the selected filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentsByMethodView;
