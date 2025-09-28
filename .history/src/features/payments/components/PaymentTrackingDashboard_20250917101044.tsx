import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import SearchBar from '../../shared/components/ui/SearchBar';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import PaymentDetailsViewer from './PaymentDetailsViewer';
import { 
  CreditCard, DollarSign, TrendingUp, BarChart3, Wallet, 
  RefreshCw, ChevronRight, Download, Activity, ArrowUpDown,
  Filter, Search, Calendar, FileText, Bell, Settings, Eye, EyeOff,
  Package, Users, Building, Smartphone, Clock, CheckCircle,
  AlertTriangle, TrendingDown, ArrowUpRight, ArrowDownRight, X,
  Grid3X3, List
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
import { financialService, FinancialAnalytics } from '../../../lib/financialService';
import { paymentService, PaymentAnalytics, PaymentInsights } from '../services/PaymentService';
import { paymentProviderService, PaymentProvider } from '../../../lib/paymentProviderService';
import { enhancedPaymentService } from '../../../lib/enhancedPaymentService';
import { financeAccountService } from '../../../lib/financeAccountService';
import { currencyService } from '../../../lib/currencyService';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
  const [methodSummary, setMethodSummary] = useState<PaymentMethodSummary[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  
  // Enhanced comprehensive data states
  const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics | null>(null);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [paymentInsights, setPaymentInsights] = useState<PaymentInsights | null>(null);
  const [paymentProviders, setPaymentProviders] = useState<PaymentProvider[]>([]);
  const [financeAccounts, setFinanceAccounts] = useState<any[]>([]);
  const [enhancedTransactions, setEnhancedTransactions] = useState<any[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  
  // Payment details modal state
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Fetch comprehensive payment data from all available sources
  const fetchPaymentData = useCallback(async () => {
    console.log('🔄 PaymentTracking: Fetching comprehensive payment data from all sources...');
    setIsLoading(true);
    try {
      // Fetch data from all available services in parallel
      const [
        paymentsData, 
        metricsData, 
        methodSummaryData, 
        dailySummaryData,
        financialAnalyticsData,
        paymentAnalyticsData,
        paymentInsightsData,
        paymentProvidersData,
        financeAccountsData,
        enhancedTransactionsData,
        currencyData
      ] = await Promise.allSettled([
        // Core payment tracking data (using debounced version to prevent concurrent requests)
        paymentTrackingService.debouncedFetchPaymentTransactions(
          selectedDate || undefined, 
          selectedDate || undefined, 
          statusFilter !== 'all' ? statusFilter : undefined, 
          methodFilter !== 'all' ? methodFilter : undefined
        ),
        paymentTrackingService.calculatePaymentMetrics(selectedDate || undefined, selectedDate || undefined),
        paymentTrackingService.getPaymentMethodSummary(selectedDate || undefined, selectedDate || undefined),
        paymentTrackingService.getDailySummary(7),
        
        // Enhanced financial analytics
        financialService.getComprehensiveFinancialData(),
        paymentService.getPaymentAnalytics(selectedDate || undefined, selectedDate || undefined),
        paymentService.getPaymentInsights(),
        paymentProviderService.getPaymentProviders(),
        financeAccountService.getActiveFinanceAccounts(),
        enhancedPaymentService.getPaymentTransactionsForAccount('all', 1000, 0),
        currencyService.getCurrenciesUsedInPayments()
      ]);

      // Handle each result individually with comprehensive error handling
      if (paymentsData.status === 'fulfilled') {
        setPayments(paymentsData.value);
        console.log(`✅ Fetched ${paymentsData.value.length} payment transactions`);
      } else {
        console.error('Failed to fetch payments:', paymentsData.reason);
        // Keep existing payments data if fetch fails
      }

      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value);
        console.log('✅ Fetched payment metrics');
      } else {
        console.error('Failed to fetch metrics:', metricsData.reason);
        // Keep existing metrics if fetch fails
      }

      if (methodSummaryData.status === 'fulfilled') {
        setMethodSummary(methodSummaryData.value);
        console.log('✅ Fetched payment method summary');
      } else {
        console.error('Failed to fetch method summary:', methodSummaryData.reason);
        // Keep existing method summary if fetch fails
      }

      if (dailySummaryData.status === 'fulfilled') {
        setDailySummary(dailySummaryData.value);
        console.log('✅ Fetched daily summary');
      } else {
        console.error('Failed to fetch daily summary:', dailySummaryData.reason);
        // Keep existing daily summary if fetch fails
      }

      // Handle enhanced financial analytics
      if (financialAnalyticsData.status === 'fulfilled') {
        setFinancialAnalytics(financialAnalyticsData.value);
        console.log('✅ Fetched comprehensive financial analytics');
      } else {
        console.error('Failed to fetch financial analytics:', financialAnalyticsData.reason);
      }

      // Handle payment analytics
      if (paymentAnalyticsData.status === 'fulfilled') {
        setPaymentAnalytics(paymentAnalyticsData.value);
        console.log('✅ Fetched payment analytics');
      } else {
        console.error('Failed to fetch payment analytics:', paymentAnalyticsData.reason);
      }

      // Handle payment insights
      if (paymentInsightsData.status === 'fulfilled') {
        setPaymentInsights(paymentInsightsData.value);
        console.log('✅ Fetched payment insights');
      } else {
        console.error('Failed to fetch payment insights:', paymentInsightsData.reason);
      }

      // Handle payment providers
      if (paymentProvidersData.status === 'fulfilled') {
        setPaymentProviders(paymentProvidersData.value);
        console.log(`✅ Fetched ${paymentProvidersData.value.length} payment providers`);
      } else {
        console.error('Failed to fetch payment providers:', paymentProvidersData.reason);
      }

      // Handle finance accounts
      if (financeAccountsData.status === 'fulfilled') {
        setFinanceAccounts(financeAccountsData.value);
        console.log(`✅ Fetched ${financeAccountsData.value.length} finance accounts`);
      } else {
        console.error('Failed to fetch finance accounts:', financeAccountsData.reason);
      }

      // Handle enhanced transactions
      if (enhancedTransactionsData.status === 'fulfilled') {
        setEnhancedTransactions(enhancedTransactionsData.value);
        console.log(`✅ Fetched ${enhancedTransactionsData.value.length} enhanced transactions`);
      } else {
        console.error('Failed to fetch enhanced transactions:', enhancedTransactionsData.reason);
      }

      // Handle currency data
      if (currencyData.status === 'fulfilled') {
        setAvailableCurrencies(currencyData.value);
        console.log(`✅ Fetched ${currencyData.value.length} available currencies`);
      } else {
        console.error('Failed to fetch available currencies:', currencyData.reason);
      }

      // Show success message if most requests succeeded
      const successCount = [
        paymentsData, metricsData, methodSummaryData, dailySummaryData,
        financialAnalyticsData, paymentAnalyticsData, paymentInsightsData,
        paymentProvidersData, financeAccountsData, enhancedTransactionsData, currencyData
      ].filter(result => result.status === 'fulfilled').length;

      if (successCount >= 4) {
        console.log(`✅ Successfully loaded ${successCount}/11 data sources`);
      } else {
        toast.error('Some payment data failed to load. Check your connection.');
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, statusFilter, methodFilter]);

  // Auto-refresh setup
  useEffect(() => {
    fetchPaymentData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPaymentData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchPaymentData, autoRefresh]);

  // Debounced fetch function for real-time updates
  const debouncedFetch = useCallback(() => {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      fetchPaymentData();
    }, 2000); // 2 second debounce
  }, [fetchPaymentData]);

  // Real-time subscriptions with comprehensive table coverage
  useEffect(() => {
    if (!autoRefresh) return;

    let paymentsSubscription: any;
    let reconnectTimeout: NodeJS.Timeout;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 2; // Reduced to 2 attempts
    const baseReconnectDelay = 10000; // Increased to 10 seconds for stability
    let isSubscribed = false;
    let isConnecting = false;
    let lastConnectionAttempt = 0;
    const connectionCooldown = 5000; // 5 second cooldown between attempts

    const setupSubscription = () => {
      // Prevent rapid reconnection attempts
      const now = Date.now();
      if (isConnecting || (now - lastConnectionAttempt < connectionCooldown)) {
        console.log('⏳ PaymentTracking: Connection cooldown active, skipping setup');
        return;
      }

      try {
        isConnecting = true;
        lastConnectionAttempt = now;

        // Clean up existing subscription first
        if (paymentsSubscription) {
          paymentsSubscription.unsubscribe();
        }

        paymentsSubscription = supabase
          .channel('comprehensive-payment-tracking-updates')
          // Core payment tables
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_payments' }, (payload) => {
            console.log('🔔 Customer payment update received:', payload);
            debouncedFetch();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'lats_sales' }, (payload) => {
            console.log('🔔 POS sale update received:', payload);
            debouncedFetch();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'lats_sale_items' }, (payload) => {
            console.log('🔔 Sale item update received:', payload);
            debouncedFetch();
          })
          // Financial and account tables
          .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_accounts' }, (payload) => {
            console.log('🔔 Finance account update received:', payload);
            debouncedFetch();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, (payload) => {
            console.log('🔔 Finance transaction update received:', payload);
            debouncedFetch();
          })
          // Customer and device tables
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
            console.log('🔔 Customer update received:', payload);
            debouncedFetch();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload) => {
            console.log('🔔 Device update received:', payload);
            debouncedFetch();
          })
          // Audit and compliance tables
          .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_audit_log' }, (payload) => {
            console.log('🔔 Payment audit log update received:', payload);
            debouncedFetch();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_reconciliation' }, (payload) => {
            console.log('🔔 Payment reconciliation update received:', payload);
            debouncedFetch();
          })
          .subscribe((status) => {
            console.log('📡 Subscription status:', status);
            isConnecting = false;
            
            if (status === 'SUBSCRIBED') {
              reconnectAttempts = 0; // Reset attempts on successful connection
              isSubscribed = true;
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              isSubscribed = false;
              
              // Only attempt reconnection if we haven't exceeded max attempts
              if (reconnectAttempts < maxReconnectAttempts) {
                console.warn('⚠️ Subscription closed, attempting to reconnect...');
                reconnectAttempts++;
                const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts - 1); // Exponential backoff
                
                setTimeout(() => {
                  if (!isSubscribed && !isConnecting && autoRefresh) { // Double-check before reconnecting
                    setupSubscription();
                  }
                }, delay);
              } else {
                console.error('❌ Max reconnection attempts reached, stopping subscription');
              }
            }
          });
      } catch (error) {
        console.error('❌ Error setting up subscription:', error);
        isSubscribed = false;
        isConnecting = false;
        
        // Retry after delay with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts - 1);
          setTimeout(() => {
            if (!isSubscribed && !isConnecting && autoRefresh) { // Double-check before reconnecting
              setupSubscription();
            }
          }, delay);
        }
      }
    };

    // Initial setup with delay to prevent immediate connection
    setTimeout(() => {
      setupSubscription();
    }, 1000);

    return () => {
      clearTimeout(reconnectTimeout);
      isSubscribed = false;
      isConnecting = false;
      if (paymentsSubscription) {
        paymentsSubscription.unsubscribe();
      }
    };
  }, [fetchPaymentData, autoRefresh]);

  // Filter payments based on search query and filters
  const filteredPayments = useMemo(() => {
    let filtered = payments;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => {
        return (
          payment.customerName.toLowerCase().includes(searchLower) ||
          payment.transactionId.toLowerCase().includes(searchLower) ||
          payment.reference.toLowerCase().includes(searchLower) ||
          payment.method.toLowerCase().includes(searchLower) ||
          (payment.currency && payment.currency.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Apply method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.method === methodFilter);
    }
    
    // Apply currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(payment => payment.currency === currencyFilter);
    }
    
    return filtered;
  }, [payments, searchQuery, statusFilter, methodFilter, currencyFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Overview</h2>
          <p className="text-gray-600">Comprehensive view of all payment activities and financial metrics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPaymentData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Live Status Indicator */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live Updates Active</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {payments.length} Transactions
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {paymentProviders.length} Providers
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="w-4 h-4" />
              {financeAccounts.length} Accounts
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Payments</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.totalPayments}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Amount</p>
              <p className="text-2xl font-bold text-green-900">{formatMoney(metrics.totalAmount)}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Completed</p>
              <p className="text-2xl font-bold text-purple-900">{formatMoney(metrics.completedAmount)}</p>
              <p className="text-xs text-purple-600 mt-1">{metrics.successRate}% success rate</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Pending</p>
              <p className="text-2xl font-bold text-orange-900">{formatMoney(metrics.pendingAmount)}</p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Comprehensive Analytics Section */}
      {(financialAnalytics || paymentAnalytics || paymentInsights) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Analytics */}
          {financialAnalytics && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Financial Analytics</h3>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatMoney(financialAnalytics.summary.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-600">Total Revenue</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatMoney(financialAnalytics.summary.totalExpenses)}
                    </div>
                    <div className="text-xs text-gray-600">Total Expenses</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatMoney(financialAnalytics.summary.netProfit)}
                  </div>
                  <div className="text-xs text-gray-600">Net Profit</div>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Revenue Growth: {financialAnalytics.summary.revenueGrowth?.toFixed(1) || '0.0'}%</div>
                  <div>Expense Growth: {financialAnalytics.summary.expenseGrowth?.toFixed(1) || '0.0'}%</div>
                  <div>Profit Growth: {financialAnalytics.summary.profitGrowth?.toFixed(1) || '0.0'}%</div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Payment Insights */}
          {paymentInsights && (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment Insights</h3>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {paymentInsights.topPaymentMethod}
                    </div>
                    <div className="text-xs text-gray-600">Top Method</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatMoney(paymentInsights.averageTransactionValue)}
                    </div>
                    <div className="text-xs text-gray-600">Avg Transaction</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {paymentInsights.peakHour}
                  </div>
                  <div className="text-xs text-gray-600">Peak Hour</div>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Success Rate: {paymentInsights.successRate?.toFixed(1) || '0.0'}%</div>
                  <div>Failure Rate: {paymentInsights.failureRate?.toFixed(1) || '0.0'}%</div>
                  <div>Refund Rate: {paymentInsights.refundRate?.toFixed(1) || '0.0'}%</div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Payment Providers Performance */}
      {paymentProviders.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Providers Performance</h3>
            <Settings className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentProviders.map((provider) => (
              <div key={provider.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium">{provider.performance.successRate?.toFixed(1) || '0.0'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-medium">{provider.performance.averageResponseTime}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-medium">{provider.performance.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime:</span>
                    <span className="font-medium">{provider.performance.uptime?.toFixed(1) || '0.0'}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments, customers, or references..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <GlassSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              className="min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </GlassSelect>
            <GlassSelect
              value={methodFilter}
              onChange={(value) => setMethodFilter(value)}
              className="min-w-[140px]"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </GlassSelect>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              <Filter size={14} />
              {showAdvancedFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <GlassSelect
              options={[
                { value: 'all', label: 'All Currencies' },
                ...availableCurrencies.map(currency => ({
                  value: currency,
                  label: currencyService.getCurrencyDisplayName(currency)
                }))
              ]}
              value={currencyFilter}
              onChange={(value) => setCurrencyFilter(value)}
              placeholder="Filter by Currency"
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
                <GlassButton
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setMethodFilter('all');
                    setCurrencyFilter('all');
                    setSelectedDate('');
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Clear Filters
                </GlassButton>
                <GlassButton
                  onClick={onExport}
                  variant="primary"
                  icon={<Download size={16} />}
                  className="flex-1"
                >
                  Export
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Payment Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPayments.map((payment) => (
          <GlassCard key={payment.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{payment.customerName}</h3>
                  <p className="text-sm text-gray-600">{payment.transactionId}</p>
                  {payment.deviceName && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {payment.deviceName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                  {payment.status}
                </span>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{formatMoney(payment.amount)}</div>
                  <div className="text-xs text-gray-500">{payment.currency || 'TZS'}</div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Payment Method</div>
                  <div className="text-sm font-medium text-gray-900">
                    {payment.method === 'Multiple' ? (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-600 font-semibold">Multiple</span>
                        <span className="text-xs text-gray-500">
                          ({payment.metadata?.paymentMethod?.details?.payments?.length || 0})
                        </span>
                      </div>
                    ) : (
                      payment.method
                    )}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Fees</div>
                  <div className="text-sm font-medium text-gray-900">{formatMoney(payment.fees)}</div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Reference</div>
                <div className="text-sm font-medium text-gray-900">{payment.reference}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {payment.cashier}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(payment.date).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {payment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handlePaymentAction(payment.id, 'confirm', payment.source)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Confirm
                    </button>
                    <button
                      onClick={() => handlePaymentAction(payment.id, 'reject', payment.source)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      <X className="w-3 h-3" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleViewDetails(payment)}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-xs font-medium"
                >
                  <Eye className="w-3 h-3" />
                  Details
                </button>
                {payment.status === 'completed' && (
                  <button
                    onClick={() => onRefund?.(payment)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-xs font-medium"
                  >
                    <ArrowDownRight className="w-3 h-3" />
                    Refund
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
        
        {filteredPayments.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">💳</div>
            <div className="text-lg font-medium mb-2">No payments found</div>
            <div className="text-sm">Try adjusting your search or filters</div>
          </div>
        )}
      </div>

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
