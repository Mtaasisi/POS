import React, { useState, useMemo, useEffect } from 'react';
import { X, RefreshCw, Download, Printer, Search, Filter, TrendingUp, DollarSign, CreditCard, Clock, CheckCircle, XCircle, BarChart3, Users, Package, Eye, Calendar, User, Phone, Mail, MapPin, Receipt, Hash, Tag } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  paymentTrackingService, 
  PaymentTransaction, 
  PaymentMetrics, 
  PaymentMethodSummary, 
  DailySummary, 
  ReconciliationRecord,
  SoldItem
} from '../../../../lib/paymentTrackingService';

interface PaymentTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Transaction Details Modal Component
interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ isOpen, onClose, transaction }) => {
  const [loadingSoldItems, setLoadingSoldItems] = useState(false);
  
  if (!isOpen || !transaction) return null;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'pending':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <GlassCard className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Transaction Details</h2>
              <p className="text-base text-gray-600">Complete payment information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Transaction Overview */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Amount Card */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-green-700">Transaction Amount</span>
              </div>
              <div className="text-3xl font-bold text-green-900 mb-2">{formatMoney(transaction.amount)}</div>
              <div className="text-sm text-green-600">
                {transaction.soldItems && transaction.soldItems.length > 0 
                  ? `${transaction.soldItems.length} item${transaction.soldItems.length !== 1 ? 's' : ''} sold`
                  : 'Payment processed'
                }
              </div>
            </div>

            {/* Status Card */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                {getStatusIcon(transaction.status)}
                <span className="text-sm font-medium text-blue-700">Status</span>
              </div>
              <div className="text-xl font-bold text-blue-900 mb-2 capitalize">{transaction.status}</div>
              <div className="text-sm text-blue-600">Payment status</div>
            </div>

            {/* Method Card */}
            <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Payment Method</span>
              </div>
              <div className="text-xl font-bold text-purple-900 mb-2">{transaction.paymentMethod}</div>
              <div className="text-sm text-purple-600">How payment was made</div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction Information */}
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-blue-600" />
                Transaction Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Transaction ID</span>
                  <span className="text-sm font-mono text-gray-900">{transaction.transactionId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Reference</span>
                  <span className="text-sm font-mono text-gray-900">{transaction.reference}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Date & Time</span>
                  <span className="text-sm text-gray-900">{new Date(transaction.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Source</span>
                  <span className="text-sm text-gray-900 capitalize">{transaction.source}</span>
                </div>
                {transaction.deviceName && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Device</span>
                    <span className="text-sm text-gray-900">📱 {transaction.deviceName}</span>
                  </div>
                )}
                {transaction.fees && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Transaction Fees</span>
                    <span className="text-sm text-gray-900">{formatMoney(transaction.fees)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(transaction.status)}`}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Customer Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Customer Name</span>
                  <span className="text-sm font-semibold text-gray-900">{transaction.customerName}</span>
                </div>
                {transaction.customerPhone && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Phone Number</span>
                    <span className="text-sm text-gray-900 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {transaction.customerPhone}
                    </span>
                  </div>
                )}
                {transaction.customerEmail && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Email</span>
                    <span className="text-sm text-gray-900 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {transaction.customerEmail}
                    </span>
                  </div>
                )}
                {transaction.customerAddress && (
                  <div className="flex justify-between items-start py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Address</span>
                    <span className="text-sm text-gray-900 flex items-start gap-1 text-right">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {transaction.customerAddress}
                    </span>
                  </div>
                )}
                {transaction.customerId && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Customer ID</span>
                    <span className="text-sm font-mono text-gray-900">{transaction.customerId}</span>
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Additional Details */}
          <div className="space-y-6">


            {/* Transaction Timeline */}
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Transaction Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Payment Initiated</div>
                    <div className="text-xs text-gray-600">{new Date(transaction.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                {transaction.status === 'completed' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Payment Completed</div>
                      <div className="text-xs text-gray-600">{new Date(transaction.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                )}
                {transaction.status === 'pending' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Payment Pending</div>
                      <div className="text-xs text-gray-600">Awaiting confirmation</div>
                    </div>
                  </div>
                )}
                {transaction.status === 'failed' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Payment Failed</div>
                      <div className="text-xs text-gray-600">{transaction.failureReason || 'Transaction failed'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sold Items */}
            <div className="p-6 bg-white rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Sold Items
                {transaction.soldItems && (
                  <span className="text-sm text-gray-600">({transaction.soldItems.length})</span>
                )}
              </h3>
              
              {loadingSoldItems ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading sold items...</p>
                  </div>
                </div>
              ) : transaction.soldItems && transaction.soldItems.length > 0 ? (
                <div className="space-y-3">
                  {transaction.soldItems.map((item, index) => (
                    <div key={item.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {item.productName}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.type === 'product' ? 'bg-blue-100 text-blue-700' :
                              item.type === 'service' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {item.type}
                            </span>
                          </div>
                          {item.sku && (
                            <div className="text-sm text-gray-600 font-mono">SKU: {item.sku}</div>
                          )}
                                                      {item.category && (
                                                          <div className="text-sm text-gray-600">
                                {item.category && <span className="mr-2">Category: {item.category}</span>}
                              </div>
                          )}
                          {item.variant && (
                            <div className="text-sm text-gray-600">Variant: {item.variant}</div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-gray-900">{formatMoney(item.totalPrice)}</div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} × {formatMoney(item.unitPrice)}
                          </div>
                        </div>
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                          {item.description}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-sm text-gray-500 mt-1 italic">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Summary */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-900">Total Items</span>
                      <span className="font-semibold text-blue-900">
                        {transaction.soldItems.reduce((sum, item) => sum + item.quantity, 0)} items
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-medium text-blue-900">Total Amount</span>
                      <span className="font-semibold text-blue-900">
                        {formatMoney(transaction.soldItems.reduce((sum, item) => sum + item.totalPrice, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sold items found for this transaction</p>
                </div>
              )}
            </div>

            {/* Additional Metadata */}
            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
              <div className="p-6 bg-white rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Additional Information
                </h3>
                <div className="space-y-3">
                  {Object.entries(transaction.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <GlassButton
            onClick={onClose}
            variant="secondary"
            className="flex-1 py-4 text-lg font-semibold"
          >
            Close
          </GlassButton>
          <GlassButton
            onClick={() => {
              // Print transaction details
              const printContent = `
                Transaction Details
                ===================
                Transaction ID: ${transaction.transactionId}
                Customer: ${transaction.customerName}
                Amount: ${formatMoney(transaction.amount)}
                Method: ${transaction.paymentMethod}
                Status: ${transaction.status}
                Date: ${new Date(transaction.timestamp).toLocaleString()}
                Reference: ${transaction.reference}
              `;
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                printWindow.document.write(`
                  <html>
                    <head><title>Transaction ${transaction.transactionId}</title></head>
                    <body style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                      <pre>${printContent}</pre>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.print();
              }
            }}
            className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print Details
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

const PaymentTrackingModal: React.FC<PaymentTrackingModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
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

  // Transaction details modal state
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 PaymentTrackingModal: Modal opened, fetching data...');
      fetchPaymentData();
    }
  }, [isOpen]); // Removed selectedDate dependency to prevent excessive re-renders

  // Separate effect for date changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      console.log('🔍 PaymentTrackingModal: Date changed, refetching data...');
      fetchPaymentData();
    }
  }, [selectedDate]);

  // Setup real-time subscriptions for payment updates
  useEffect(() => {
    if (!isOpen) return;

    console.log('🔔 PaymentTrackingModal: Setting up real-time subscriptions...');
    
    let posSalesSubscription: any;
    let devicePaymentsSubscription: any;
    
    // Debounce function to prevent excessive API calls
    const debouncedFetch = debounce(() => {
      console.log('🔔 PaymentTrackingModal: Debounced fetch triggered');
      // Clear cache before fetching to ensure fresh data
      paymentTrackingService.clearPaymentCache();
      fetchPaymentData();
    }, 3000); // 3 second debounce to reduce frequency
    
    // Subscribe to POS sales updates
    posSalesSubscription = supabase!
      .channel('payment-tracking-pos-sales-modal')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'lats_sales'
        },
        (payload) => {
          console.log('🔔 PaymentTrackingModal: POS sale update received:', payload);
          debouncedFetch();
        }
      )
      .subscribe();

    // Subscribe to device payments updates
    devicePaymentsSubscription = supabase!
      .channel('payment-tracking-device-payments-modal')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'customer_payments'
        },
        (payload) => {
          console.log('🔔 PaymentTrackingModal: Device payment update received:', payload);
          debouncedFetch();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔔 PaymentTrackingModal: Cleaning up real-time subscriptions...');
      if (posSalesSubscription) posSalesSubscription.unsubscribe();
      if (devicePaymentsSubscription) devicePaymentsSubscription.unsubscribe();
    };
  }, [isOpen]);

  // Debounce utility function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const fetchPaymentData = async () => {
    console.log('🔄 PaymentTrackingModal: Fetching payment data...');
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

      console.log(`📊 PaymentTrackingModal: Received ${paymentsData.length} payments`);
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

  // Format currency with full numbers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  // Handle payment action
  const handlePaymentAction = async (paymentId: string, action: string, source: 'device_payment' | 'pos_sale') => {
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
        alert(`Payment ${action} successful`);
      } else {
        alert(`Failed to ${action} payment`);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(`Error updating payment: ${error}`);
    }
  };

  // Handle transaction selection with sold items loading
  const handleTransactionSelect = async (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
    
    // If sold items are not loaded, fetch them
    if (!transaction.soldItems) {
      try {
        const soldItems = await paymentTrackingService.fetchSoldItems(transaction.id, transaction.source);
        setSelectedTransaction({
          ...transaction,
          soldItems
        });
      } catch (error) {
        console.error('Error fetching sold items:', error);
      }
    }
  };

  if (!isOpen) return null;

  // console.log('🔍 PaymentTrackingModal: Modal is open, rendering...');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-7xl w-full max-h-[90vh] overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Payment Tracking</h2>
              <p className="text-base text-gray-600">Real-time payment monitoring & analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPaymentData}
              disabled={loading}
              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment data...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            <div className="space-y-6">
                            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Total Payments</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{metrics.totalPayments}</div>
                <div className="text-sm text-blue-600">All transactions</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Total Amount</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{formatMoney(metrics.totalAmount)}</div>
                <div className="text-sm text-green-600">Gross amount</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Completed</span>
                </div>
                <div className="text-2xl font-bold text-emerald-900">{formatMoney(metrics.completedAmount)}</div>
                <div className="text-sm text-emerald-600">{metrics.successRate}% success rate</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Pending</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{formatMoney(metrics.pendingAmount)}</div>
                <div className="text-sm text-orange-600">Awaiting confirmation</div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">💸</span>
                  <span className="text-sm font-medium text-purple-700">Total Fees</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{formatMoney(metrics.totalFees)}</div>
                <div className="text-sm text-purple-600">Transaction fees</div>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Filters:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Methods</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Payment Transactions */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Transactions ({filteredPayments.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPayments.length > 0 ? (
                    filteredPayments.slice(0, 5).map((payment) => (
                      <div 
                        key={payment.id} 
                        className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 hover:shadow-md transition-all duration-200 group"
                        onClick={() => handleTransactionSelect(payment)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">{payment.customerName}</div>
                          <div className="text-sm text-gray-600">{payment.transactionId}</div>
                          {payment.deviceName && (
                            <div className="text-xs text-blue-600">📱 {payment.deviceName}</div>
                          )}
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div className="font-semibold text-blue-600">{formatMoney(payment.amount)}</div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                          <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No payment transactions found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Methods
                </h3>
                <div className="space-y-3">
                  {methodSummary.length > 0 ? (
                    methodSummary.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 capitalize">{method.method}</div>
                          <div className="text-sm text-gray-600">{method.count} transactions</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{formatMoney(method.amount)}</div>
                          <div className="text-xs text-gray-500">{method.percentage}% of total</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No payment method data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Daily Summary */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Daily Summary
                </h3>
                <div className="space-y-2">
                  {dailySummary.length > 0 ? (
                    dailySummary.slice(0, 5).map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</div>
                        <div className="text-right">
                          <div className="font-semibold text-purple-600">{formatMoney(day.total)}</div>
                          <div className="text-sm text-gray-600">
                            ✓ {formatMoney(day.completed)} | ⏳ {formatMoney(day.pending)} | ✗ {formatMoney(day.failed)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No daily summary data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reconciliation Status */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Reconciliation
                </h3>
                <div className="space-y-3">
                  {reconciliation.length > 0 ? (
                    reconciliation.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{new Date(rec.date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-600">
                            Expected: {formatMoney(rec.expected)} | Actual: {formatMoney(rec.actual)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rec.status === 'reconciled' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {rec.status}
                          </span>
                          {rec.variance !== 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              Variance: {formatMoney(rec.variance)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No reconciliation data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                className="flex-1 py-4 text-lg font-semibold"
              >
                Close
              </GlassButton>
              <GlassButton
                onClick={() => alert('Export payment data')}
                className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export Data
              </GlassButton>
            </div>
          </div>
          </>
        )}

        {/* Empty State */}
        {!loading && payments.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Data</h3>
              <p className="text-gray-600 mb-4">No payment data available for the selected period</p>
              <button 
                onClick={fetchPaymentData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}

        {/* Transaction Details Modal */}
        <TransactionDetailsModal
          isOpen={showTransactionDetails}
          onClose={() => {
            setShowTransactionDetails(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      </GlassCard>
    </div>
  );
};

export default PaymentTrackingModal;

