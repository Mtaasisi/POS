import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../../features/shared/components/PageErrorBoundary';
import { 
  CreditCard, DollarSign, TrendingUp, BarChart3, Wallet, 
  RefreshCw, ChevronRight, Download, Activity, ArrowUpDown,
  Filter, Search, Calendar, FileText, Bell, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { 
  paymentTrackingService,
  PaymentTransaction,
  PaymentMetrics,
  PaymentMethodSummary,
  DailySummary,
  ReconciliationRecord
} from '../../../lib/paymentTrackingService';
import { financeAccountService } from '../../../lib/financeAccountService';
import { enhancedPaymentService } from '../../../lib/enhancedPaymentService';
import RefundModal from '../components/RefundModal';

// Payment tab types
type PaymentTab = 'tracking' | 'accounts' | 'reports' | 'analytics';

interface TabConfig {
  id: PaymentTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  adminOnly?: boolean;
  color: string;
}

const UnifiedPaymentManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PaymentTab>('tracking');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  
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
  const [methodSummary, setMethodSummary] = useState<PaymentMethodSummary[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationRecord[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<any>(null);

  // Fetch all payment data
  const fetchPaymentData = async () => {
    console.log('🔄 PaymentManagement: Fetching payment data...');
    setIsLoading(true);
    try {
      const [paymentsData, metricsData, methodSummaryData, dailySummaryData, reconciliationData, accountsData, methodsData] = await Promise.all([
        paymentTrackingService.fetchPaymentTransactions(
          selectedDate || undefined, 
          selectedDate || undefined, 
          statusFilter !== 'all' ? statusFilter : undefined, 
          methodFilter !== 'all' ? methodFilter : undefined
        ),
        paymentTrackingService.calculatePaymentMetrics(selectedDate || undefined, selectedDate || undefined),
        paymentTrackingService.getPaymentMethodSummary(selectedDate || undefined, selectedDate || undefined),
        paymentTrackingService.getDailySummary(7),
        paymentTrackingService.getReconciliationRecords(),
        financeAccountService.getActiveFinanceAccounts(),
        enhancedPaymentService.getPaymentMethods()
      ]);

      console.log(`📊 PaymentManagement: Received ${paymentsData.length} payments`);
      setPayments(paymentsData);
      setMetrics(metricsData);
      setMethodSummary(methodSummaryData);
      setDailySummary(dailySummaryData);
      setReconciliation(reconciliationData);
      setPaymentAccounts(accountsData);
      setPaymentMethods(methodsData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup data loading and real-time subscriptions
  useEffect(() => {
    fetchPaymentData();
  }, [selectedDate, statusFilter, methodFilter]);

  useEffect(() => {
    console.log('🔔 PaymentManagement: Setting up real-time subscriptions...');
    
    const paymentsSubscription = supabase
      .channel('payment-management-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_payments' }, () => {
        console.log('🔔 Payment update received');
        fetchPaymentData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lats_sales' }, () => {
        console.log('🔔 Sale update received');
        fetchPaymentData();
      })
      .subscribe();

    return () => {
      console.log('🔔 PaymentManagement: Cleaning up subscriptions');
      paymentsSubscription.unsubscribe();
    };
  }, []);

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

  // Format currency following user preference (no trailing zeros)
  const formatMoney = (amount: number) => {
    if (amount >= 1000000) {
      const millions = (amount / 1000000).toFixed(1).replace('.0', '');
      return `TZS ${millions}M`;
    }
    if (amount >= 1000) {
      const thousands = (amount / 1000).toFixed(1).replace('.0', '');
      return `TZS ${thousands}K`;
    }
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

  // Handle refund
  const handleRefund = (payment: PaymentTransaction) => {
    setSelectedPaymentForRefund(payment);
    setRefundModalOpen(true);
  };

  // Handle refund completion
  const handleRefundComplete = () => {
    fetchPaymentData();
    setRefundModalOpen(false);
    setSelectedPaymentForRefund(null);
  };

  // Define all payment tabs
  const paymentTabs: TabConfig[] = [
    {
      id: 'tracking',
      label: 'Payment Tracking',
      icon: <CreditCard size={20} />,
      description: 'Track and manage payment transactions',
      color: 'blue'
    },
    {
      id: 'accounts',
      label: 'Payment Accounts',
      icon: <Wallet size={20} />,
      description: 'Manage payment accounts and settings',
      color: 'green'
    },
    {
      id: 'reports',
      label: 'Payment Reports',
      icon: <BarChart3 size={20} />,
      description: 'Generate payment reports and analytics',
      color: 'purple'
    },
    {
      id: 'analytics',
      label: 'Payment Analytics',
      icon: <TrendingUp size={20} />,
      description: 'Advanced payment analytics and insights',
      adminOnly: true,
      color: 'orange'
    }
  ];

  // Filter tabs based on user role
  const availableTabs = paymentTabs.filter(tab => 
    !tab.adminOnly || currentUser?.role === 'admin'
  );

  // Get current tab config
  const currentTab = paymentTabs.find(tab => tab.id === activeTab);

  // Handle tab changes
  const handleTabChange = (tabId: PaymentTab) => {
    setActiveTab(tabId);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchPaymentData();
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tracking':
        return (
          <div className="space-y-6">
            {/* Payment Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-xl font-bold text-gray-900">{metrics.totalPayments}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900">{formatMoney(metrics.totalAmount)}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-xl font-bold text-green-600">{formatMoney(metrics.completedAmount)}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{metrics.successRate}% success</p>
              </GlassCard>
              
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-xl font-bold text-orange-600">{formatMoney(metrics.pendingAmount)}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-orange-600 text-lg">⏳</span>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Fees</p>
                    <p className="text-xl font-bold text-gray-900">{formatMoney(metrics.totalFees)}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-purple-600 text-lg">💸</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Additional Filters for Tracking */}
            <GlassCard className="p-4">
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
                  <GlassButton
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setMethodFilter('all');
                      setSelectedDate('');
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Clear Filters
                  </GlassButton>
                  <GlassButton
                    onClick={() => alert('Export payment data functionality')}
                    variant="primary"
                    icon={<Download size={16} />}
                    className="flex-1"
                  >
                    Export
                  </GlassButton>
                </div>
              </div>
            </GlassCard>

            {/* Payment Transactions List */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Payment Transactions ({filteredPayments.length})
                </h3>
                <div className="flex gap-2">
                  <GlassButton
                    onClick={fetchPaymentData}
                    variant="secondary"
                    disabled={isLoading}
                    icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
                  >
                    Refresh
                  </GlassButton>
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
                        <div className="font-medium text-gray-900">{payment.method}</div>
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

                    <div className="flex gap-2">
                      {payment.status === 'pending' && (
                        <>
                          <GlassButton
                            onClick={() => handlePaymentAction(payment.id, 'confirm', payment.source)}
                            size="sm"
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            Confirm
                          </GlassButton>
                          <GlassButton
                            onClick={() => handlePaymentAction(payment.id, 'reject', payment.source)}
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Reject
                          </GlassButton>
                        </>
                      )}
                      <GlassButton
                        onClick={() => alert(`View ${payment.transactionId} details`)}
                        variant="secondary"
                        size="sm"
                      >
                        Details
                      </GlassButton>
                      {payment.status === 'completed' && (
                        <GlassButton
                          onClick={() => handleRefund(payment)}
                          variant="secondary"
                          size="sm"
                          className="text-orange-600 hover:bg-orange-50"
                        >
                          Refund
                        </GlassButton>
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
            </GlassCard>
          </div>
        );
      case 'accounts':
        return (
          <div className="space-y-6">
            {/* Payment Accounts Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentAccounts.map((account) => (
                <GlassCard key={account.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{account.name}</h4>
                      <p className="text-sm text-gray-600">{account.type}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Balance</p>
                    <p className="text-lg font-bold text-green-600">{formatMoney(account.balance || 0)}</p>
                  </div>
                  <div className="flex gap-2">
                    <GlassButton
                      onClick={() => alert(`Manage ${account.name} account`)}
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      Manage
                    </GlassButton>
                    <GlassButton
                      onClick={() => alert(`View ${account.name} transactions`)}
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                    >
                      View
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
            
            {/* Payment Methods */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        method.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {method.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{method.description || 'No description'}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert(`Configure ${method.name}`)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => alert(`${method.is_active ? 'Disable' : 'Enable'} ${method.name}`)}
                        className={`px-3 py-1 text-xs rounded-lg ${
                          method.is_active 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {method.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            {/* Payment Methods Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods Breakdown</h3>
                <div className="space-y-3">
                  {methodSummary.map((method, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">
                            {method.method === 'M-Pesa' ? '📱' : 
                             method.method === 'Card' ? '💳' : 
                             method.method === 'Cash' ? '💵' : '🏦'}
                          </span>
                        </div>
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Performance</h3>
                <div className="space-y-3">
                  {dailySummary.slice(0, 7).map((day, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</div>
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
            
            {/* Export Options */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassButton
                  onClick={() => alert('Export daily summary')}
                  variant="secondary"
                  className="p-4 h-auto flex-col gap-2"
                >
                  <FileText size={24} />
                  <span>Daily Summary</span>
                </GlassButton>
                <GlassButton
                  onClick={() => alert('Export payment methods report')}
                  variant="secondary"
                  className="p-4 h-auto flex-col gap-2"
                >
                  <BarChart3 size={24} />
                  <span>Methods Report</span>
                </GlassButton>
                <GlassButton
                  onClick={() => alert('Export reconciliation report')}
                  variant="secondary"
                  className="p-4 h-auto flex-col gap-2"
                >
                  <Activity size={24} />
                  <span>Reconciliation</span>
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Reconciliation Status */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Reconciliation Status</h3>
              <div className="space-y-3">
                {reconciliation.slice(0, 5).map((rec, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{new Date(rec.date).toLocaleDateString()}</div>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        rec.status === 'reconciled' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Expected</div>
                        <div className="font-medium">{formatMoney(rec.expected)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Actual</div>
                        <div className="font-medium">{formatMoney(rec.actual)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Variance</div>
                        <div className={`font-medium ${
                          rec.variance === 0 ? 'text-green-600' : rec.variance > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {rec.variance >= 0 ? '+' : ''}{formatMoney(rec.variance)}
                        </div>
                      </div>
                    </div>
                    
                    {rec.status === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <GlassButton
                          onClick={() => alert(`Reconcile ${rec.date}`)}
                          size="sm"
                          className="bg-blue-600 text-white"
                        >
                          Reconcile
                        </GlassButton>
                        <GlassButton
                          onClick={() => alert(`Investigate variance for ${rec.date}`)}
                          size="sm"
                          variant="secondary"
                        >
                          Investigate
                        </GlassButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
            
            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Trends</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Transaction:</span>
                    <span className="font-medium">{formatMoney(metrics.totalAmount / (metrics.totalPayments || 1))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium text-green-600">{metrics.successRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Fees:</span>
                    <span className="font-medium text-red-600">{formatMoney(metrics.totalFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Revenue:</span>
                    <span className="font-medium text-blue-600">{formatMoney(metrics.totalAmount - metrics.totalFees)}</span>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <GlassButton
                    onClick={() => alert('Generate comprehensive financial report')}
                    variant="secondary"
                    className="w-full justify-start"
                    icon={<FileText size={16} />}
                  >
                    Financial Report
                  </GlassButton>
                  <GlassButton
                    onClick={() => alert('Bulk reconciliation')}
                    variant="secondary"
                    className="w-full justify-start"
                    icon={<Activity size={16} />}
                  >
                    Bulk Reconciliation
                  </GlassButton>
                  <GlassButton
                    onClick={() => alert('Payment alerts configuration')}
                    variant="secondary"
                    className="w-full justify-start"
                    icon={<Bell size={16} />}
                  >
                    Payment Alerts
                  </GlassButton>
                  <GlassButton
                    onClick={() => alert('Payment settings')}
                    variant="secondary"
                    className="w-full justify-start"
                    icon={<Settings size={16} />}
                  >
                    Settings
                  </GlassButton>
                </div>
              </GlassCard>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Tracking</h3>
            <p className="text-gray-600">Track and manage payment transactions</p>
          </div>
        );
    }
  };

  return (
    <PageErrorBoundary pageName="Unified Payment Management" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-gray-600 mt-1">
                {currentTab?.description || 'Comprehensive payment management system'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
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
              className="min-w-[150px]"
            />

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
              className="min-w-[150px]"
            />
            
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search payments..."
              className="min-w-[200px]"
            />

            <GlassButton
              onClick={handleRefresh}
              icon={<RefreshCw size={18} />}
              variant="secondary"
              loading={isLoading}
              disabled={isLoading}
            >
              Refresh
            </GlassButton>

            <GlassButton
              onClick={() => {/* TODO: Export payments */}}
              icon={<Download size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Export
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Payment Navigation */}
          <div className="lg:col-span-1">
            <GlassCard className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Categories</h3>
              <nav className="space-y-2">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? `bg-${tab.color}-500 text-white shadow-lg`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`${activeTab === tab.id ? 'text-white' : `text-${tab.color}-500`}`}>
                      {tab.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{tab.label}</div>
                      {tab.adminOnly && (
                        <div className="text-xs opacity-75">Admin Only</div>
                      )}
                    </div>
                    <ChevronRight 
                      size={16} 
                      className={`${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} 
                    />
                  </button>
                ))}
              </nav>
            </GlassCard>

            {/* Live Stats */}
            <GlassCard className="p-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Live Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Transactions:</span>
                  <span className="font-medium text-blue-600">{metrics.totalPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">
                    {payments.filter(p => p.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-yellow-600">
                    {payments.filter(p => p.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">
                    {payments.filter(p => p.status === 'failed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-purple-600">{formatMoney(metrics.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium text-green-600">{metrics.successRate}%</span>
                </div>
              </div>
            </GlassCard>
            
            {/* Payment Methods Quick View */}
            <GlassCard className="p-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Payment Methods</h4>
              <div className="space-y-2 text-sm">
                {methodSummary.slice(0, 4).map((method, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{method.method}:</span>
                    <span className="font-medium text-blue-600">{formatMoney(method.amount)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Payment Content */}
          <div className="lg:col-span-3">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`text-${currentTab?.color}-500`}>
                  {currentTab?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentTab?.label}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currentTab?.description}
                  </p>
                </div>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading payment data...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {renderTabContent()}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
      
      {/* Refund Modal */}
      {selectedPaymentForRefund && (
        <RefundModal
          isOpen={refundModalOpen}
          onClose={() => setRefundModalOpen(false)}
          payment={selectedPaymentForRefund}
          onRefundComplete={handleRefundComplete}
        />
      )}
    </PageErrorBoundary>
  );
};

export default UnifiedPaymentManagementPage;
