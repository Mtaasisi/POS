import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../../../lib/supabaseClient';
import { 
  paymentTrackingService, 
  PaymentTransaction, 
  PaymentMetrics, 
  PaymentMethodSummary, 
  DailySummary, 
  ReconciliationRecord 
} from '../../../lib/paymentTrackingService';

const PaymentTrackingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(''); // Empty string means no date filter
  const [loading, setLoading] = useState(true);
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

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchPaymentData();
  }, [selectedDate]);

  // Setup real-time subscriptions for payment updates
  useEffect(() => {
    console.log('🔔 PaymentTrackingPage: Setting up real-time subscriptions...');
    
    // Subscribe to POS sales updates
    const posSalesSubscription = supabase
      .channel('payment-tracking-pos-sales')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'lats_sales'
        },
        (payload) => {
          console.log('🔔 PaymentTrackingPage: POS sale update received:', payload);
          // Refresh payment data when sales are added/updated
          fetchPaymentData();
        }
      )
      .subscribe();

    // Subscribe to device payments updates
    const devicePaymentsSubscription = supabase
      .channel('payment-tracking-device-payments')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'customer_payments'
        },
        (payload) => {
          console.log('🔔 PaymentTrackingPage: Device payment update received:', payload);
          // Refresh payment data when payments are added/updated
          fetchPaymentData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔔 PaymentTrackingPage: Cleaning up real-time subscriptions...');
      posSalesSubscription.unsubscribe();
      devicePaymentsSubscription.unsubscribe();
    };
  }, []);

  const fetchPaymentData = async () => {
    console.log('🔄 PaymentTrackingPage: Fetching payment data...');
    setLoading(true);
    try {
      // Fetch all payment data
      const [paymentsData, metricsData, methodSummaryData, dailySummaryData, reconciliationData] = await Promise.all([
        paymentTrackingService.debouncedFetchPaymentTransactions(selectedDate || undefined, selectedDate || undefined, selectedStatus !== 'all' ? selectedStatus : undefined, selectedMethod !== 'all' ? selectedMethod : undefined),
        paymentTrackingService.calculatePaymentMetrics(selectedDate || undefined, selectedDate || undefined),
        paymentTrackingService.getPaymentMethodSummary(selectedDate || undefined, selectedDate || undefined),
        paymentTrackingService.getDailySummary(7),
        paymentTrackingService.getReconciliationRecords()
      ]);

      console.log(`📊 PaymentTrackingPage: Received ${paymentsData.length} payments`);
      setPayments(paymentsData);
      setMetrics(metricsData);
      setMethodSummary(methodSummaryData);
      setDailySummary(dailySummaryData);
      setReconciliation(reconciliationData);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter payments based on search query
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    
    return payments.filter(payment => {
      const searchLower = searchQuery.toLowerCase();
      return (
        payment.customerName.toLowerCase().includes(searchLower) ||
        payment.transactionId.toLowerCase().includes(searchLower) ||
        payment.reference.toLowerCase().includes(searchLower)
      );
    });
  }, [payments, searchQuery]);

  // Format currency
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
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
      case 'stopped':
      case 'cancelled':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Handle filter changes
  const handleFilterChange = () => {
    // Trigger data refresh when filters change
    fetchPaymentData();
  };

  // Handle payment action
  const handlePaymentAction = async (paymentId: string, action: string, source: 'device_payment' | 'pos_sale') => {
    try {
      let newStatus: 'completed' | 'pending' | 'failed' | 'stopped' | 'cancelled';
      
      if (action === 'confirm') {
        newStatus = 'completed';
      } else if (action === 'reject') {
        newStatus = 'failed';
      } else if (action === 'stop' || action === 'cancel') {
        newStatus = 'stopped';
      } else {
        return;
      }

      const success = await paymentTrackingService.updatePaymentStatus(paymentId, newStatus, source);
      
      if (success) {
        // Refresh data after successful update
        await fetchPaymentData();
        alert(`Payment ${action} successful`);
      } else {
        alert(`Failed to ${action} payment`);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(`Error updating payment: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <PageHeader
          title="LATS System Dashboard - Payment Tracking"
          subtitle="Monitor payments, reconciliation, and financial reporting"
          className="mb-6"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        title="LATS System Dashboard - Payment Tracking"
        subtitle="Monitor payments, reconciliation, and financial reporting"
        className="mb-6"
      />

      {/* Payment Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalPayments}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-blue-600 text-xl">💳</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">All transactions</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(metrics.totalAmount)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-green-600 text-xl">💰</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Gross amount</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{formatMoney(metrics.completedAmount)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">{metrics.successRate}% success rate</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{formatMoney(metrics.pendingAmount)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-orange-600 text-xl">⏳</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Awaiting confirmation</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(metrics.totalFees)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-purple-600 text-xl">💸</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Transaction fees</span>
          </div>
        </GlassCard>
      </div>

      {/* Filters and Controls */}
      <GlassCard className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Methods</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="flex items-end">
            <GlassButton
              variant="primary"
              onClick={() => alert('Reconcile payments functionality')}
              className="w-full"
            >
              Reconcile
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Payment List and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment List */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Payment Transactions ({filteredPayments.length})
              </h3>
              <div className="flex space-x-2">
                <GlassButton
                  variant="secondary"
                  onClick={fetchPaymentData}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : '🔄 Refresh'}
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={() => alert('Export payment data')}
                >
                  Export
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={() => alert('Print payment report')}
                >
                  Print
                </GlassButton>
              </div>
            </div>

            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-4 bg-gray-50 rounded-lg">
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
                      <div className="text-sm text-gray-600">Net Amount</div>
                      <div className="font-medium text-gray-900">{formatMoney(payment.netAmount)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div>Cashier: {payment.cashier}</div>
                    <div>{new Date(payment.date).toLocaleString()}</div>
                  </div>

                  <div className="flex space-x-2">
                    {payment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'confirm', payment.source)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'reject', payment.source)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => alert(`View ${payment.transactionId} details`)}
                      className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💳</div>
                <div>No payments found</div>
                <div className="text-sm mt-1">Try adjusting your search or filters</div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-6">
          {/* Payment Methods Summary */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
            <div className="space-y-3">
              {methodSummary.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">
                        {method.method === 'M-Pesa' ? '📱' : method.method === 'Card' ? '💳' : method.method === 'Cash' ? '💵' : '🏦'}
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

          {/* Daily Summary */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Summary</h3>
            <div className="space-y-3">
              {dailySummary.slice(0, 5).map((day, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</div>
                    <div className="font-semibold text-gray-900">{formatMoney(day.total)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-green-600">✓ {formatMoney(day.completed)}</span>
                    </div>
                    <div>
                      <span className="text-orange-600">⏳ {formatMoney(day.pending)}</span>
                    </div>
                    <div>
                      <span className="text-red-600">✗ {formatMoney(day.failed)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Reconciliation Status */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reconciliation</h3>
            <div className="space-y-3">
              {reconciliation.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">{new Date(rec.date).toLocaleDateString()}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rec.status === 'reconciled' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Expected: {formatMoney(rec.expected)} | Actual: {formatMoney(rec.actual)}
                  </div>
                  {rec.variance !== 0 && (
                    <div className="text-xs text-red-600">
                      Variance: {formatMoney(rec.variance)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Financial Report</div>
              <div className="text-sm text-gray-600">Generate financial summary</div>
            </button>
            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-green-600 text-2xl mb-2">✅</div>
              <div className="font-medium text-gray-900">Bulk Reconciliation</div>
              <div className="text-sm text-gray-600">Reconcile multiple payments</div>
            </button>
            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-purple-600 text-2xl mb-2">📧</div>
              <div className="font-medium text-gray-900">Payment Alerts</div>
              <div className="text-sm text-gray-600">Configure notifications</div>
            </button>
            <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="text-orange-600 text-2xl mb-2">⚙️</div>
              <div className="font-medium text-gray-900">Payment Settings</div>
              <div className="text-sm text-gray-600">Configure payment methods</div>
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default PaymentTrackingPage;
