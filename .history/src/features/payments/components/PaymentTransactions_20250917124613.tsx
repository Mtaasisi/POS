import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import SearchBar from '../../shared/components/ui/SearchBar';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { 
  CreditCard, DollarSign, TrendingUp, BarChart3, Wallet, 
  RefreshCw, ChevronRight, Download, Activity, ArrowUpDown,
  Filter, Search, Calendar, FileText, Bell, Settings, Eye, EyeOff,
  Package, Users, Building, Smartphone, Clock, CheckCircle,
  AlertTriangle, TrendingDown, ArrowUpRight, ArrowDownRight, X,
  Grid3X3, List, TestTube, Filter as FilterIcon, Copy, Edit, 
  Printer, Share, MoreHorizontal, Trash2, Flag, Star
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

interface PaymentTransactionsProps {
  onViewDetails?: (payment: PaymentTransaction) => void;
  onRefund?: (payment: PaymentTransaction) => void;
  onExport?: () => void;
  onEdit?: (payment: PaymentTransaction) => void;
  onCopy?: (payment: PaymentTransaction) => void;
  onPrint?: (payment: PaymentTransaction) => void;
  onShare?: (payment: PaymentTransaction) => void;
  onDelete?: (payment: PaymentTransaction) => void;
  onFlag?: (payment: PaymentTransaction) => void;
  onStar?: (payment: PaymentTransaction) => void;
}

const PaymentTransactions: React.FC<PaymentTransactionsProps> = ({
  onViewDetails,
  onRefund,
  onExport,
  onEdit,
  onCopy,
  onPrint,
  onShare,
  onDelete,
  onFlag,
  onStar
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  
  // Payment data state
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);
  const [purchaseOrderPayments, setPurchaseOrderPayments] = useState<any[]>([]);
  const [devicePayments, setDevicePayments] = useState<any[]>([]);
  const [repairPayments, setRepairPayments] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Fetch all payment data using a more robust approach
  const fetchPaymentData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 PaymentTransactions: Fetching comprehensive payment data from all database sources...');
      
      // First try to get data from paymentTrackingService (which is working in PaymentTrackingDashboard)
      let paymentsData;
      try {
        paymentsData = await paymentTrackingService.getPaymentTransactions();
        setPayments(paymentsData);
        console.log(`✅ PaymentTransactions: Fetched ${paymentsData.length} payment transactions from service`);
      } catch (error) {
        console.warn('⚠️ PaymentTransactions: Failed to fetch from paymentTrackingService, trying direct queries:', error);
        setPayments([]);
      }

      // Then try direct database queries as fallback
      const [
        customerPaymentsData,
        purchaseOrderPaymentsData,
        devicePaymentsData,
        repairPaymentsData,
        paymentTransactionsData,
        customersData
      ] = await Promise.allSettled([
        supabase.from('customer_payments').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('purchase_order_payments').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('customer_payments').select('*').not('device_id', 'is', null).order('created_at', { ascending: false }).limit(500),
        supabase.from('customer_payments').select('*').not('device_id', 'is', null).order('created_at', { ascending: false }).limit(500),
        supabase.from('payment_transactions').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(1000)
      ]);

      // Handle each result with detailed logging and error handling
      if (customerPaymentsData.status === 'fulfilled') {
        const data = customerPaymentsData.value.data || [];
        setCustomerPayments(data);
        console.log(`✅ PaymentTransactions: Fetched ${data.length} customer payments`);
      } else {
        console.error('❌ PaymentTransactions: Failed to fetch customer payments:', customerPaymentsData.reason);
        setCustomerPayments([]);
      }
      
      if (purchaseOrderPaymentsData.status === 'fulfilled') {
        const data = purchaseOrderPaymentsData.value.data || [];
        setPurchaseOrderPayments(data);
        console.log(`✅ PaymentTransactions: Fetched ${data.length} purchase order payments`);
      } else {
        console.error('❌ PaymentTransactions: Failed to fetch purchase order payments:', purchaseOrderPaymentsData.reason);
        setPurchaseOrderPayments([]);
      }
      
      if (devicePaymentsData.status === 'fulfilled') {
        const data = devicePaymentsData.value.data || [];
        setDevicePayments(data);
        console.log(`✅ PaymentTransactions: Fetched ${data.length} device payments`);
      } else {
        console.error('❌ PaymentTransactions: Failed to fetch device payments:', devicePaymentsData.reason);
        setDevicePayments([]);
      }
      
      if (repairPaymentsData.status === 'fulfilled') {
        const data = repairPaymentsData.value.data || [];
        setRepairPayments(data);
        console.log(`✅ PaymentTransactions: Fetched ${data.length} repair payments`);
      } else {
        console.error('❌ PaymentTransactions: Failed to fetch repair payments:', repairPaymentsData.reason);
        setRepairPayments([]);
      }
      
      if (paymentTransactionsData.status === 'fulfilled') {
        const data = paymentTransactionsData.value.data || [];
        setPaymentTransactions(data);
        console.log(`✅ PaymentTransactions: Fetched ${data.length} payment transactions`);
      } else {
        console.error('❌ PaymentTransactions: Failed to fetch payment transactions:', paymentTransactionsData.reason);
        setPaymentTransactions([]);
      }
      
      if (customersData.status === 'fulfilled') {
        const data = customersData.value.data || [];
        setCustomers(data);
        console.log(`✅ PaymentTransactions: Fetched ${data.length} customers`);
      } else {
        console.error('❌ PaymentTransactions: Failed to fetch customers:', customersData.reason);
        setCustomers([]);
      }

      // Check if we have any data at all (use the actual fetched data counts)
      const totalPayments = paymentsData?.length || 0;
      const totalCustomerPayments = customerPaymentsData.status === 'fulfilled' ? (customerPaymentsData.value.data || []).length : 0;
      const totalPurchaseOrderPayments = purchaseOrderPaymentsData.status === 'fulfilled' ? (purchaseOrderPaymentsData.value.data || []).length : 0;
      const totalDevicePayments = devicePaymentsData.status === 'fulfilled' ? (devicePaymentsData.value.data || []).length : 0;
      const totalRepairPayments = repairPaymentsData.status === 'fulfilled' ? (repairPaymentsData.value.data || []).length : 0;
      const totalPaymentTransactions = paymentTransactionsData.status === 'fulfilled' ? (paymentTransactionsData.value.data || []).length : 0;
      
      const totalData = totalPayments + totalCustomerPayments + totalPurchaseOrderPayments + 
                       totalDevicePayments + totalRepairPayments + totalPaymentTransactions;
      
      if (totalData === 0) {
        console.warn('⚠️ PaymentTransactions: No payment data found from any source');
        // Don't show error toast immediately, let the user see the empty state
        console.log('📊 PaymentTransactions: Showing empty state - no transactions found');
      } else {
        console.log(`✅ PaymentTransactions: Successfully loaded ${totalData} total payment records from multiple sources`);
      }

    } catch (error) {
      console.error('❌ PaymentTransactions: Critical error fetching payment data:', error);
      
      // Set all data to empty arrays to prevent undefined errors
      setPayments([]);
      setCustomerPayments([]);
      setPurchaseOrderPayments([]);
      setDevicePayments([]);
      setRepairPayments([]);
      setPaymentTransactions([]);
      
      // Only show error toast for critical errors, not for empty data
      if (error instanceof Error && error.message.includes('network') || error instanceof Error && error.message.includes('connection')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        console.log('📊 PaymentTransactions: Data fetch completed with no results');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  // Function to get customer name by ID
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Function to truncate reference to last 10 digits
  const truncateReference = (reference: string) => {
    if (!reference || reference === 'No reference') return 'No reference';
    return reference.length > 10 ? `...${reference.slice(-10)}` : reference;
  };

  // Combine all payments for display
  const allPayments = useMemo(() => {
    console.log('🔄 PaymentTransactions: Combining payment data...');
    console.log(`📊 PaymentTransactions: payments: ${payments.length}, customerPayments: ${customerPayments.length}, purchaseOrderPayments: ${purchaseOrderPayments.length}, devicePayments: ${devicePayments.length}, repairPayments: ${repairPayments.length}, paymentTransactions: ${paymentTransactions.length}, customers: ${customers.length}`);
    
    const combined = [
      ...payments,
      ...customerPayments,
      ...purchaseOrderPayments,
      ...devicePayments,
      ...repairPayments,
      ...paymentTransactions
    ];

    console.log(`📊 PaymentTransactions: Combined ${combined.length} total payments before deduplication`);

    // Remove duplicates based on ID and enrich with customer names
    const uniquePayments = combined.filter((payment, index, self) => 
      index === self.findIndex(p => p.id === payment.id)
    ).map(payment => ({
      ...payment,
      customerName: payment.customerName || payment.customer_name || 
                   (payment.customer_id ? getCustomerName(payment.customer_id) : 'Unknown Customer')
    }));

    console.log(`📊 PaymentTransactions: ${uniquePayments.length} unique payments after deduplication and customer name enrichment`);

    const sortedPayments = uniquePayments.sort((a, b) => 
      new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
    );

    console.log(`✅ PaymentTransactions: Returning ${sortedPayments.length} sorted payments`);
    return sortedPayments;
  }, [payments, customerPayments, purchaseOrderPayments, devicePayments, repairPayments, paymentTransactions, customers]);

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    console.log('🔄 PaymentTransactions: Filtering payments...');
    console.log(`📊 PaymentTransactions: Starting with ${allPayments.length} payments`);
    console.log(`📊 PaymentTransactions: Filters - search: "${searchQuery}", status: "${statusFilter}", method: "${methodFilter}", currency: "${currencyFilter}"`);
    
    let filtered = allPayments;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => {
        const customerName = payment.customerName || payment.customer_name || 'Unknown';
        const transactionId = payment.transactionId || payment.transaction_id || payment.id || '';
        const reference = payment.reference || payment.payment_reference || '';
        const method = payment.method || payment.payment_method || '';
        const currency = payment.currency || payment.currency_code || '';
        
        return (
          customerName.toLowerCase().includes(searchLower) ||
          transactionId.toLowerCase().includes(searchLower) ||
          reference.toLowerCase().includes(searchLower) ||
          method.toLowerCase().includes(searchLower) ||
          currency.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const status = payment.status || payment.payment_status || 'unknown';
        return status === statusFilter;
      });
    }
    
    // Apply method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const method = payment.method || payment.payment_method || 'unknown';
        return method === methodFilter;
      });
    }
    
    // Apply currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const currency = payment.currency || payment.currency_code || 'TZS';
        return currency === currencyFilter;
      });
    }
    
    console.log(`✅ PaymentTransactions: Filtered to ${filtered.length} payments`);
    return filtered;
  }, [allPayments, searchQuery, statusFilter, methodFilter, currencyFilter]);

  // Get unique values for filter options
  const statusOptions = useMemo(() => {
    const statuses = [...new Set(allPayments.map(p => p.status || p.payment_status || 'unknown'))];
    return ['all', ...statuses.filter(s => s !== 'unknown')];
  }, [allPayments]);

  const methodOptions = useMemo(() => {
    const methods = [...new Set(allPayments.map(p => p.method || p.payment_method || 'unknown'))];
    return ['all', ...methods.filter(m => m !== 'unknown')];
  }, [allPayments]);

  const currencyOptions = useMemo(() => {
    const currencies = [...new Set(allPayments.map(p => p.currency || p.currency_code || 'TZS'))];
    return ['all', ...currencies];
  }, [allPayments]);

  const formatMoney = (amount: number, currency: string = 'TZS') => {
    // Map currency codes to proper currency symbols
    const currencyMap: { [key: string]: string } = {
      'TZS': 'TZS',
      'USD': 'USD',
      'EUR': 'EUR',
      'GBP': 'GBP',
      'CNY': 'CNY',
      'KES': 'KES',
      'UGX': 'UGX'
    };
    
    const currencyCode = currencyMap[currency.toUpperCase()] || currency.toUpperCase();
    
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'mobile_money': return <Smartphone className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer': return <Building className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Transactions</h2>
          <p className="text-gray-600">View and manage all payment transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton
            onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
            className="flex items-center gap-2"
          >
            {viewMode === 'cards' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            {viewMode === 'cards' ? 'List View' : 'Card View'}
          </GlassButton>
          <GlassButton
            onClick={fetchPaymentData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </GlassButton>
          <GlassButton
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </GlassButton>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search transactions..."
              className="w-full"
            />
          </div>
          <GlassSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions.map(status => ({
              value: status,
              label: status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)
            }))}
            className="min-w-32"
          />
          <GlassSelect
            value={methodFilter}
            onChange={setMethodFilter}
            options={methodOptions.map(method => ({
              value: method,
              label: method === 'all' ? 'All Methods' : method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')
            }))}
            className="min-w-32"
          />
          <GlassSelect
            value={currencyFilter}
            onChange={setCurrencyFilter}
            options={currencyOptions.map(currency => ({
              value: currency,
              label: currency === 'all' ? 'All Currencies' : currency
            }))}
            className="min-w-32"
          />
          <GlassButton
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <FilterIcon className="w-4 h-4" />
            Filters
          </GlassButton>
        </div>
      </GlassCard>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredPayments.length} of {allPayments.length} transactions
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <span className="text-orange-600">🔄 Loading...</span>}
          {!isLoading && <span className="text-green-600">✅ Loaded</span>}
        </div>
      </div>

      {/* Transactions List */}
      {viewMode === 'list' ? (
        <GlassCard className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.customerName || payment.customer_name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.transactionId || payment.transaction_id || payment.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {truncateReference(payment.reference || payment.payment_reference || 'No reference')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method || payment.payment_method || 'unknown')}
                        <span className="text-sm text-gray-900 capitalize">
                          {(payment.method || payment.payment_method || 'unknown').replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatMoney(payment.amount || payment.total_amount || 0, payment.currency || payment.currency_code || 'TZS')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status || payment.payment_status || 'unknown')}`}>
                        {payment.status || payment.payment_status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.created_at || payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDetails?.(payment)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(payment.status || payment.payment_status) === 'completed' && (
                          <button
                            onClick={() => onRefund?.(payment)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => (
            <GlassCard key={payment.id} className="p-4">
              {/* Customer Name - First and Most Prominent */}
              <div className="mb-3">
                <div className="text-lg font-bold text-gray-900">
                  {payment.customerName || payment.customer_name || 'Unknown Customer'}
                </div>
                <div className="text-xs text-gray-500">
                  {payment.transactionId || payment.transaction_id || payment.id}
                </div>
                <div className="text-xs text-gray-400">
                  {truncateReference(payment.reference || payment.payment_reference || 'No reference')}
                </div>
              </div>
              
              {/* Payment Method and Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getMethodIcon(payment.method || payment.payment_method || 'unknown')}
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {(payment.method || payment.payment_method || 'unknown').replace('_', ' ')}
                  </span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status || payment.payment_status || 'unknown')}`}>
                  {payment.status || payment.payment_status || 'unknown'}
                </span>
              </div>
              
              {/* Amount */}
              <div className="mb-3">
                <div className="text-lg font-bold text-gray-900">
                  {formatMoney(payment.amount || payment.total_amount || 0, payment.currency || payment.currency_code || 'TZS')}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {new Date(payment.created_at || payment.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetails?.(payment)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {(payment.status || payment.payment_status) === 'completed' && (
                    <button
                      onClick={() => onRefund?.(payment)}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      <ArrowDownRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredPayments.length === 0 && !isLoading && (
        <GlassCard className="p-12 text-center">
          <div className="text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || methodFilter !== 'all' || currencyFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No payment transactions have been recorded yet.'}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default PaymentTransactions;
