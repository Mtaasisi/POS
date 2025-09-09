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
  Filter, Search, Calendar, FileText, Bell, Settings, Eye, EyeOff
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
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
  
  // Payment details modal state
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Fetch payment data with better error handling
  const fetchPaymentData = useCallback(async () => {
    console.log('🔄 PaymentTracking: Fetching payment data...');
    setIsLoading(true);
    try {
      const [paymentsData, metricsData, methodSummaryData, dailySummaryData] = await Promise.allSettled([
        paymentTrackingService.fetchPaymentTransactions(
          selectedDate || undefined, 
          selectedDate || undefined, 
          statusFilter !== 'all' ? statusFilter : undefined, 
          methodFilter !== 'all' ? methodFilter : undefined
        ),
        paymentTrackingService.calculatePaymentMetrics(selectedDate || undefined, selectedDate || undefined),
        paymentTrackingService.getPaymentMethodSummary(selectedDate || undefined, selectedDate || undefined),
        paymentTrackingService.getDailySummary(7)
      ]);

      // Handle each result individually
      if (paymentsData.status === 'fulfilled') {
        setPayments(paymentsData.value);
      } else {
        console.error('Failed to fetch payments:', paymentsData.reason);
        // Keep existing payments data if fetch fails
      }

      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value);
      } else {
        console.error('Failed to fetch metrics:', metricsData.reason);
        // Keep existing metrics if fetch fails
      }

      if (methodSummaryData.status === 'fulfilled') {
        setMethodSummary(methodSummaryData.value);
      } else {
        console.error('Failed to fetch method summary:', methodSummaryData.reason);
        // Keep existing method summary if fetch fails
      }

      if (dailySummaryData.status === 'fulfilled') {
        setDailySummary(dailySummaryData.value);
      } else {
        console.error('Failed to fetch daily summary:', dailySummaryData.reason);
        // Keep existing daily summary if fetch fails
      }

      // Only show error toast if all requests failed
      const allFailed = [paymentsData, metricsData, methodSummaryData, dailySummaryData].every(
        result => result.status === 'rejected'
      );
      
      if (allFailed) {
        toast.error('Failed to load payment data. Check your connection.');
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

  // Real-time subscriptions with better error handling
  useEffect(() => {
    if (!autoRefresh) return;

    let paymentsSubscription: any;
    let reconnectTimeout: NodeJS.Timeout;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 2; // Reduced to 2 attempts
    const baseReconnectDelay = 10000; // Increased to 10 seconds
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
          .channel('payment-tracking-updates')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_payments' }, (payload) => {
            console.log('🔔 Payment update received:', payload);
            // Debounce the fetch to prevent excessive calls
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(() => {
              fetchPaymentData();
            }, 3000); // Increased debounce time to 3 seconds
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'lats_sales' }, (payload) => {
            console.log('🔔 Sale update received:', payload);
            // Debounce the fetch to prevent excessive calls
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(() => {
              fetchPaymentData();
            }, 3000); // Increased debounce time to 3 seconds
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
      {/* Enhanced Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard className="p-4 hover:shadow-lg transition-shadow">
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
        
        <GlassCard className="p-4 hover:shadow-lg transition-shadow">
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
        
        <GlassCard className="p-4 hover:shadow-lg transition-shadow">
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
        
        <GlassCard className="p-4 hover:shadow-lg transition-shadow">
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
        
        <GlassCard className="p-4 hover:shadow-lg transition-shadow">
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

      {/* Enhanced Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Payment Filters</h3>
          <div className="flex gap-2">
            <GlassButton
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="secondary"
              size="sm"
              icon={showAdvancedFilters ? <EyeOff size={16} /> : <Eye size={16} />}
            >
              {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
            </GlassButton>
            <GlassButton
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "primary" : "secondary"}
              size="sm"
              icon={<RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />}
            >
              Auto Refresh
            </GlassButton>
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
                  onClick={() => handleViewDetails(payment)}
                  variant="secondary"
                  size="sm"
                >
                  Details
                </GlassButton>
                {payment.status === 'completed' && (
                  <GlassButton
                    onClick={() => onRefund?.(payment)}
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
