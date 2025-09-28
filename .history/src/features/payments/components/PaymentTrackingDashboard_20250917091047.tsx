import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import SearchBar from '../../shared/components/ui/SearchBar';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import PaymentDetailsViewer from './PaymentDetailsViewer';
import PaymentsByMethodView from './PaymentsByMethodView';
import PurchaseOrderPaymentView from './PurchaseOrderPaymentView';
import { 
  CreditCard, DollarSign, Activity,
  CheckCircle2, Clock, Percent, BarChart3,
  Eye, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { 
  paymentTrackingService,
  PaymentTransaction,
  PaymentMetrics,
  PaymentMethodSummary,
  DailySummary
} from '../../../lib/paymentTrackingService';

interface PaymentTrackingDashboardProps {
  onViewDetails?: (payment: PaymentTransaction) => void;
  onRefund?: (payment: PaymentTransaction) => void;
  onExport?: () => void;
}

const PaymentTrackingDashboard: React.FC<PaymentTrackingDashboardProps> = ({
  onViewDetails,
  onRefund,
  onExport
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Payment data state
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalPayments: 0,
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0,
    failedAmount: 0,
    totalFees: 0,
    successRate: '0.0'
  });
  
  // Payment details modal state
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  
  // Tab state for dashboard organization
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'by-method' | 'purchase-orders'>('summary');

  // Fetch payment data
  const fetchPaymentData = useCallback(async () => {
    console.log('🔄 PaymentTracking: Fetching payment data...');
    setIsLoading(true);
    try {
      const [paymentsData, metricsData] = await Promise.all([
        paymentTrackingService.fetchPaymentTransactions(),
        paymentTrackingService.calculatePaymentMetrics()
      ]);

      setPayments(paymentsData);
      setMetrics(metricsData);
      
      console.log(`✅ Fetched ${paymentsData.length} payment transactions`);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    fetchPaymentData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPaymentData, 60000); // 60 seconds
      return () => clearInterval(interval);
    }
  }, [fetchPaymentData, autoRefresh]);

  // Filter payments based on search query
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    
    return payments.filter(payment => {
      const searchLower = searchQuery.toLowerCase();
      return (
        payment.customerName.toLowerCase().includes(searchLower) ||
        payment.transactionId.toLowerCase().includes(searchLower) ||
        payment.reference.toLowerCase().includes(searchLower) ||
        payment.method.toLowerCase().includes(searchLower)
      );
    });
  }, [payments, searchQuery]);

  // Format currency following user preference (no trailing zeros, show full numbers)
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle payment actions
  const handlePaymentAction = async (paymentId: string, action: string, source: 'device_payment' | 'pos_sale' | 'repair_payment') => {
    try {
      let newStatus: 'completed' | 'pending' | 'failed';
      
      if (action === 'confirm') {
        newStatus = 'completed';
      } else if (action === 'reject') {
        newStatus = 'failed';
      } else {
        return;
      }

      const success = await paymentTrackingService.updatePaymentStatus(paymentId, newStatus, source);
      
      if (success) {
        await fetchPaymentData();
        toast.success(`Payment ${action} successful`);
      } else {
        toast.error(`Failed to ${action} payment`);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(`Error updating payment: ${error}`);
    }
  };

  // Handle viewing payment details
  const handleViewDetails = (payment: PaymentTransaction) => {
    setSelectedTransactionId(payment.transactionId);
    setShowPaymentDetails(true);
  };

  // Handle viewing transaction details (for latest transactions)
  const handleViewTransactionDetails = (payment: PaymentTransaction) => {
    if (onViewDetails) {
      onViewDetails(payment);
    } else {
      setSelectedTransactionId(payment.transactionId);
      setShowPaymentDetails(true);
    }
  };

  // Handle refunding transaction
  const handleRefundTransaction = (payment: PaymentTransaction) => {
    if (onRefund) {
      onRefund(payment);
    } else {
      toast.error('Refund functionality not available');
    }
  };

  // Handle exporting transaction
  const handleExportTransaction = (payment: PaymentTransaction) => {
    if (onExport) {
      onExport();
    } else {
      // Create a simple CSV export for this transaction
      const csvContent = `Transaction ID,Customer,Amount,Status,Date\n${payment.transactionId},${payment.customerName},${payment.amount},${payment.status},${payment.date}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-${payment.transactionId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Transaction exported successfully');
    }
  };

  // Handle accepting transaction
  const handleAcceptTransaction = async (payment: PaymentTransaction) => {
    try {
      await handlePaymentAction(payment.transactionId, 'confirm', 'pos_sale');
      toast.success('Transaction accepted successfully');
    } catch (error) {
      console.error('Error accepting transaction:', error);
      toast.error('Failed to accept transaction');
    }
  };

  // Handle declining transaction
  const handleDeclineTransaction = async (payment: PaymentTransaction) => {
    try {
      await handlePaymentAction(payment.transactionId, 'reject', 'pos_sale');
      toast.success('Transaction declined successfully');
    } catch (error) {
      console.error('Error declining transaction:', error);
      toast.error('Failed to decline transaction');
    }
  };

  // Get status styling
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

  // Get latest transactions for summary view
  const latestTransactions = payments.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Matching PurchaseOrderDetailPage style */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Summary
            </div>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              All Transactions ({payments.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('by-method')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'by-method'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              By Payment Method
            </div>
          </button>
          <button
            onClick={() => setActiveTab('purchase-orders')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'purchase-orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Purchase Orders
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'by-method' && (
        <PaymentsByMethodView
          onViewDetails={onViewDetails}
          onExport={onExport}
        />
      )}

      {activeTab === 'purchase-orders' && (
        <PurchaseOrderPaymentView
          onViewDetails={onViewDetails}
          onExport={onExport}
        />
      )}

      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Financial Overview - Enhanced Design matching PurchaseOrderDetailPage */}
          <div className="mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Payments</div>
                <div className="text-xl font-bold text-emerald-900">{metrics.totalPayments}</div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Total Amount</div>
                <div className="text-xl font-bold text-blue-900">{formatMoney(metrics.totalAmount)}</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Completed</div>
                <div className="text-xl font-bold text-green-900">{formatMoney(metrics.completedAmount)}</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Pending</div>
                <div className="text-xl font-bold text-orange-900">{formatMoney(metrics.pendingAmount)}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Percent className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Total Fees</div>
                <div className="text-xl font-bold text-purple-900">{formatMoney(metrics.totalFees)}</div>
              </div>
            </div>
          </div>

          {/* Latest Transactions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Latest Transactions</h3>
              </div>
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All ({payments.length})
              </button>
            </div>
                
                <div className="space-y-2">
                  {latestTransactions.map((payment) => {
                    const getStatusConfig = (status: string) => {
                      switch (status) {
                        case 'completed':
                          return {
                            gradient: 'from-emerald-50 to-emerald-100',
                            border: 'border-emerald-200',
                            iconBg: 'bg-emerald-500',
                            iconColor: 'text-white',
                            labelColor: 'text-emerald-700',
                            amountColor: 'text-emerald-900',
                            badge: 'bg-emerald-100 text-emerald-800'
                          };
                        case 'pending':
                          return {
                            gradient: 'from-orange-50 to-orange-100',
                            border: 'border-orange-200',
                            iconBg: 'bg-orange-500',
                            iconColor: 'text-white',
                            labelColor: 'text-orange-700',
                            amountColor: 'text-orange-900',
                            badge: 'bg-orange-100 text-orange-800'
                          };
                        case 'failed':
                          return {
                            gradient: 'from-red-50 to-red-100',
                            border: 'border-red-200',
                            iconBg: 'bg-red-500',
                            iconColor: 'text-white',
                            labelColor: 'text-red-700',
                            amountColor: 'text-red-900',
                            badge: 'bg-red-100 text-red-800'
                          };
                        default:
                          return {
                            gradient: 'from-blue-50 to-blue-100',
                            border: 'border-blue-200',
                            iconBg: 'bg-blue-500',
                            iconColor: 'text-white',
                            labelColor: 'text-blue-700',
                            amountColor: 'text-blue-900',
                            badge: 'bg-blue-100 text-blue-800'
                          };
                      }
                    };
                    
                    const statusConfig = getStatusConfig(payment.status);
                    
                    return (
                      <div key={payment.id} className={`bg-gradient-to-br ${statusConfig.gradient} border ${statusConfig.border} rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer`} onClick={() => handleViewTransactionDetails(payment)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Status icon */}
                            <div className={`w-8 h-8 ${statusConfig.iconBg} rounded-lg flex items-center justify-center`}>
                              <CreditCard className={`w-4 h-4 ${statusConfig.iconColor}`} />
                            </div>
                            
                            {/* Transaction details */}
                            <div>
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {payment.customerName}
                              </div>
                              <div className="text-xs text-gray-500 font-mono mt-1">
                                {payment.transactionId}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Amount and status */}
                            <div className="text-right">
                              <div className={`text-lg font-bold ${statusConfig.amountColor}`}>
                                {formatMoney(payment.amount)}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                                {payment.status}
                              </span>
                            </div>
                            
                            {/* Simple view button */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTransactionDetails(payment);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {latestTransactions.length === 0 && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent transactions</h3>
                      <p className="text-sm text-gray-600 max-w-sm mx-auto">
                        Recent payment transactions will appear here once they are processed through the system.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Quick Actions</h3>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <CreditCard className="w-4 h-4" />
                    View All Transactions
                  </button>
                  
                  <button
                    onClick={fetchPaymentData}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh Data'}
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={onExport}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Enhanced Filters - Matching PurchaseOrderDetailPage style */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">Payment Filters</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  {showAdvancedFilters ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
                </button>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
                    autoRefresh 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
                  Auto Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <GlassSelect
                  options={[
                    { value: 'all', label: 'All Methods' },
                    { value: 'cash', label: 'Cash' },
                    { value: 'mobile_money', label: 'Mobile Money' },
                    { value: 'card', label: 'Card' },
                    { value: 'bank_transfer', label: 'Bank Transfer' }
                  ]}
                  value={methodFilter}
                  onChange={(value) => setMethodFilter(value)}
                  placeholder="Filter by Method"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <GlassSelect
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'failed', label: 'Failed' },
                    { value: 'refunded', label: 'Refunded' }
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  placeholder="Filter by Status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search payments..."
                />
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Dates</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const week = new Date();
                          week.setDate(week.getDate() - 7);
                          setSelectedDate(week.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      >
                        Last 7 Days
                      </button>
                      <button
                        onClick={() => setSelectedDate('')}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        All Time
                      </button>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 flex items-end gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        setMethodFilter('all');
                        setSelectedDate('');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={onExport}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <Download size={16} />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Transactions List - Matching PurchaseOrderDetailPage style */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">
                  Payment Transactions ({filteredPayments.length})
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchPaymentData}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-4 bg-gray-50 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900">{payment.customerName}</div>
                      <div className="text-sm text-gray-600">{payment.transactionId}</div>
                      {payment.deviceName && (
                        <div className="text-xs text-blue-600">Device: {payment.deviceName}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatMoney(payment.amount)}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-gray-600">Method</div>
                      <div className="font-medium text-gray-900">
                        {payment.method === 'Multiple' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600 font-semibold">Multiple</span>
                            <span className="text-xs text-gray-500">
                              ({payment.metadata?.paymentMethod?.details?.payments?.length || 0} methods)
                            </span>
                          </div>
                        ) : (
                          payment.method
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Reference</div>
                      <div className="font-medium text-gray-900 text-sm">{payment.reference}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Fees</div>
                      <div className="font-medium text-gray-900">{formatMoney(payment.fees)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Source</div>
                      <div className="font-medium text-gray-900 capitalize">{payment.source.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div>Cashier: {payment.cashier}</div>
                    <div>{new Date(payment.date).toLocaleString()}</div>
                  </div>

                  {/* Show multiple payment preview if applicable */}
                  {payment.method === 'Multiple' && payment.metadata?.paymentMethod?.details?.payments && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-blue-900">Split Payment Methods:</div>
                        <div className="text-xs text-blue-700">
                          {payment.metadata.paymentMethod.details.payments.length} methods
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {payment.metadata.paymentMethod.details.payments.slice(0, 3).map((p: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs">
                            <span className="font-medium text-gray-700 capitalize">{p.method}</span>
                            <span className="text-gray-500">({formatMoney(p.amount)})</span>
                          </div>
                        ))}
                        {payment.metadata.paymentMethod.details.payments.length > 3 && (
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs">
                            <span className="text-gray-500">+{payment.metadata.paymentMethod.details.payments.length - 3} more</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-blue-700">
                        Total: {formatMoney(payment.metadata.paymentMethod.details.totalPaid || payment.amount)}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {payment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'confirm', payment.source)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'reject', payment.source)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewDetails(payment)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Details
                    </button>
                    {payment.status === 'completed' && (
                      <button
                        onClick={() => onRefund?.(payment)}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        Refund
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredPayments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">💳</div>
                  <div className="text-lg font-medium mb-2">No payments found</div>
                  <div className="text-sm">Try adjusting your search or filters</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedTransactionId && (
        <PaymentDetailsViewer
          transactionId={selectedTransactionId}
          onClose={() => {
            setShowPaymentDetails(false);
            setSelectedTransactionId(null);
          }}
          isModal={true}
        />
      )}
    </div>
  );
};

export default PaymentTrackingDashboard;
