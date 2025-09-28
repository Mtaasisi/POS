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
  Printer, Share, MoreHorizontal, Trash2, Flag, Star, Check
} from 'lucide-react';
import Modal from '../../shared/components/ui/Modal';
import ConfirmationDialog from '../../shared/components/ui/ConfirmationDialog';
import PromptDialog from '../../shared/components/ui/PromptDialog';
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
  onAccept?: (payment: PaymentTransaction) => void;
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
  onStar,
  onAccept
}) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  
  // Modal and dialog states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    currency: '',
    method: '',
    status: '',
    notes: ''
  });
  const [flagReason, setFlagReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  // Action handlers
  const handleCopyTransaction = (payment: any) => {
    const transactionText = `Transaction: ${payment.transactionId || payment.id}
Customer: ${payment.customerName || 'Unknown'}
Amount: ${formatMoney(payment.amount || payment.total_amount || 0, payment.currency || payment.currency_code || 'TZS')}
Method: ${payment.method || payment.payment_method || 'Unknown'}
Status: ${payment.status || payment.payment_status || 'Unknown'}
Date: ${new Date(payment.created_at || payment.date).toLocaleDateString()}`;
    
    navigator.clipboard.writeText(transactionText).then(() => {
      toast.success('Transaction details copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const handlePrintTransaction = (payment: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Transaction Receipt</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Transaction Receipt</h2>
            <p><strong>Transaction ID:</strong> ${payment.transactionId || payment.id}</p>
            <p><strong>Customer:</strong> ${payment.customerName || 'Unknown'}</p>
            <p><strong>Amount:</strong> ${formatMoney(payment.amount || payment.total_amount || 0, payment.currency || payment.currency_code || 'TZS')}</p>
            <p><strong>Method:</strong> ${payment.method || payment.payment_method || 'Unknown'}</p>
            <p><strong>Status:</strong> ${payment.status || payment.payment_status || 'Unknown'}</p>
            <p><strong>Date:</strong> ${new Date(payment.created_at || payment.date).toLocaleDateString()}</p>
            <p><strong>Reference:</strong> ${payment.reference || payment.payment_reference || 'No reference'}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShareTransaction = (payment: any) => {
    if (navigator.share) {
      navigator.share({
        title: 'Transaction Details',
        text: `Transaction ${payment.transactionId || payment.id} - ${payment.customerName || 'Unknown'} - ${formatMoney(payment.amount || payment.total_amount || 0, payment.currency || payment.currency_code || 'TZS')}`,
        url: window.location.href
      }).catch(() => {
        toast.error('Failed to share');
      });
    } else {
      handleCopyTransaction(payment);
    }
  };

  // Real action handlers
  const handleEditTransaction = (payment: any) => {
    setSelectedPayment(payment);
    setEditForm({
      amount: (payment.amount || payment.total_amount || 0).toString(),
      currency: payment.currency || payment.currency_code || 'TZS',
      method: payment.method || payment.payment_method || '',
      status: payment.status || payment.payment_status || '',
      notes: payment.notes || payment.description || ''
    });
    setEditModalOpen(true);
  };

  const handleDeleteTransaction = (payment: any) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleFlagTransaction = (payment: any) => {
    setSelectedPayment(payment);
    setFlagReason('');
    setFlagDialogOpen(true);
  };

  const handleStarTransaction = async (payment: any) => {
    try {
      setIsLoading(true);
      // Add star/favorite functionality
      const { error } = await supabase
        .from('payment_transactions')
        .update({ 
          is_starred: !payment.is_starred,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast.success(payment.is_starred ? 'Removed from favorites' : 'Added to favorites');
      fetchPaymentData(); // Refresh data
    } catch (error) {
      console.error('Error starring transaction:', error);
      toast.error('Failed to update favorite status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPayment) return;

    try {
      setIsLoading(true);
      
      // Determine which table to update based on payment source
      let tableName = '';
      let updateData: any = {};

      // Determine table and update data based on payment source
      if (selectedPayment.source === 'customer_payments') {
        tableName = 'customer_payments';
        updateData = {
          amount: parseFloat(editForm.amount),
          method: editForm.method,
          status: editForm.status,
          updated_at: new Date().toISOString()
        };
      } else if (selectedPayment.source === 'purchase_order_payments') {
        tableName = 'purchase_order_payments';
        updateData = {
          amount: parseFloat(editForm.amount),
          currency: editForm.currency,
          payment_method: editForm.method,
          status: editForm.status,
          notes: editForm.notes,
          updated_at: new Date().toISOString()
        };
      } else if (selectedPayment.source === 'device_payments') {
        tableName = 'device_payments';
        updateData = {
          amount: parseFloat(editForm.amount),
          method: editForm.method,
          status: editForm.status,
          updated_at: new Date().toISOString()
        };
      } else if (selectedPayment.source === 'repair_payments') {
        tableName = 'repair_payments';
        updateData = {
          amount: parseFloat(editForm.amount),
          method: editForm.method,
          status: editForm.status,
          updated_at: new Date().toISOString()
        };
      } else {
        // For payment_transactions table
        tableName = 'payment_transactions';
        updateData = {
          amount: parseFloat(editForm.amount),
          currency: editForm.currency,
          status: editForm.status,
          updated_at: new Date().toISOString()
        };
      }

      console.log(`🔄 PaymentTransactions: Updating ${tableName} with data:`, updateData);

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', selectedPayment.id);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      toast.success('Transaction updated successfully');
      setEditModalOpen(false);
      fetchPaymentData(); // Refresh data
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPayment) return;

    try {
      setIsLoading(true);
      
      // Determine which table to delete from
      let tableName = '';
      if (selectedPayment.source === 'customer_payments') {
        tableName = 'customer_payments';
      } else if (selectedPayment.source === 'purchase_order_payments') {
        tableName = 'purchase_order_payments';
      } else if (selectedPayment.source === 'device_payments') {
        tableName = 'device_payments';
      } else if (selectedPayment.source === 'repair_payments') {
        tableName = 'repair_payments';
      } else {
        tableName = 'payment_transactions';
      }

      console.log(`🔄 PaymentTransactions: Deleting from ${tableName} with id:`, selectedPayment.id);

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', selectedPayment.id);

      if (error) {
        console.error('Database delete error:', error);
        throw error;
      }

      toast.success('Transaction deleted successfully');
      setDeleteDialogOpen(false);
      fetchPaymentData(); // Refresh data
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmFlag = async () => {
    if (!selectedPayment || !flagReason.trim()) return;

    try {
      setIsLoading(true);
      
      // Add flag to transaction
      const { error } = await supabase
        .from('payment_transactions')
        .update({ 
          is_flagged: true,
          flag_reason: flagReason.trim(),
          flagged_at: new Date().toISOString(),
          flagged_by: currentUser?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast.success('Transaction flagged successfully');
      setFlagDialogOpen(false);
      setFlagReason('');
      fetchPaymentData(); // Refresh data
    } catch (error) {
      console.error('Error flagging transaction:', error);
      toast.error('Failed to flag transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTransaction = async (payment: any) => {
    try {
      setIsLoading(true);
      
      // Determine which table to update based on payment source
      let tableName = '';
      let updateData: any = {};

      // Determine table and update data based on payment source
      if (payment.source === 'customer_payments') {
        tableName = 'customer_payments';
        updateData = {
          status: 'completed',
          updated_at: new Date().toISOString()
        };
      } else if (payment.source === 'purchase_order_payments') {
        tableName = 'purchase_order_payments';
        updateData = {
          status: 'completed',
          updated_at: new Date().toISOString()
        };
      } else if (payment.source === 'device_payments') {
        tableName = 'device_payments';
        updateData = {
          status: 'completed',
          updated_at: new Date().toISOString()
        };
      } else if (payment.source === 'repair_payments') {
        tableName = 'repair_payments';
        updateData = {
          status: 'completed',
          updated_at: new Date().toISOString()
        };
      } else {
        // For payment_transactions table, only update status and completed_at
        tableName = 'payment_transactions';
        updateData = {
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      console.log(`🔄 PaymentTransactions: Updating ${tableName} with data:`, updateData);

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', payment.id);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      toast.success('Transaction accepted successfully');
      fetchPaymentData(); // Refresh data
    } catch (error) {
      console.error('Error accepting transaction:', error);
      toast.error('Failed to accept transaction');
    } finally {
      setIsLoading(false);
    }
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
    
    // Debug: Show all unique status values in the data
    const uniqueStatuses = [...new Set(allPayments.map(p => p.status || p.payment_status || 'unknown'))];
    console.log(`📊 PaymentTransactions: Available statuses in data:`, uniqueStatuses);
    
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
      console.log(`🔍 PaymentTransactions: Applying status filter "${statusFilter}"`);
      const beforeCount = filtered.length;
      filtered = filtered.filter(payment => {
        const status = payment.status || payment.payment_status || 'unknown';
        const matches = status === statusFilter;
        if (!matches) {
          console.log(`❌ PaymentTransactions: Payment ${payment.id} status "${status}" does not match filter "${statusFilter}"`);
        }
        return matches;
      });
      console.log(`📊 PaymentTransactions: Status filter reduced from ${beforeCount} to ${filtered.length} payments`);
    }
    
    // Apply method filter
    if (methodFilter !== 'all') {
      console.log(`🔍 PaymentTransactions: Applying method filter "${methodFilter}"`);
      const beforeCount = filtered.length;
      filtered = filtered.filter(payment => {
        const method = payment.method || payment.payment_method || 'unknown';
        const matches = method === methodFilter;
        if (!matches) {
          console.log(`❌ PaymentTransactions: Payment ${payment.id} method "${method}" does not match filter "${methodFilter}"`);
        }
        return matches;
      });
      console.log(`📊 PaymentTransactions: Method filter reduced from ${beforeCount} to ${filtered.length} payments`);
    }
    
    // Apply currency filter
    if (currencyFilter !== 'all') {
      console.log(`🔍 PaymentTransactions: Applying currency filter "${currencyFilter}"`);
      const beforeCount = filtered.length;
      filtered = filtered.filter(payment => {
        const currency = payment.currency || payment.currency_code || 'TZS';
        const matches = currency === currencyFilter;
        if (!matches) {
          console.log(`❌ PaymentTransactions: Payment ${payment.id} currency "${currency}" does not match filter "${currencyFilter}"`);
        }
        return matches;
      });
      console.log(`📊 PaymentTransactions: Currency filter reduced from ${beforeCount} to ${filtered.length} payments`);
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onViewDetails?.(payment)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyTransaction(payment)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                          title="Copy Details"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintTransaction(payment)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShareTransaction(payment)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                          title="Share"
                        >
                          <Share className="w-4 h-4" />
                        </button>
                        {(payment.status || payment.payment_status) === 'pending' && (
                          <button
                            onClick={() => handleAcceptTransaction(payment)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Accept Transaction"
                            disabled={isLoading}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {(payment.status || payment.payment_status) === 'completed' && (
                          <button
                            onClick={() => onRefund?.(payment)}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                            title="Refund"
                          >
                            <ArrowDownRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditTransaction(payment)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFlagTransaction(payment)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                          title="Flag"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStarTransaction(payment)}
                          className={`p-1 rounded hover:bg-gray-50 ${payment.is_starred ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'}`}
                          title={payment.is_starred ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star className={`w-4 h-4 ${payment.is_starred ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(payment)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewDetails?.(payment)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyTransaction(payment)}
                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                    title="Copy Details"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrintTransaction(payment)}
                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                    title="Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  {(payment.status || payment.payment_status) === 'pending' && (
                    <button
                      onClick={() => handleAcceptTransaction(payment)}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                      title="Accept Transaction"
                      disabled={isLoading}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {(payment.status || payment.payment_status) === 'completed' && (
                    <button
                      onClick={() => onRefund?.(payment)}
                      className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                      title="Refund"
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

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Transaction"
        maxWidth="md"
        actions={
          <div className="flex gap-3">
            <GlassButton
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSaveEdit}
              loading={isLoading}
            >
              Save Changes
            </GlassButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={editForm.amount}
              onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={editForm.currency}
              onChange={(e) => setEditForm({...editForm, currency: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TZS">TZS - Tanzanian Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={editForm.method}
              onChange={(e) => setEditForm({...editForm, method: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({...editForm, status: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter notes or description"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={isLoading}
      />

      {/* Flag Transaction Dialog */}
      <PromptDialog
        isOpen={flagDialogOpen}
        onClose={() => setFlagDialogOpen(false)}
        onConfirm={handleConfirmFlag}
        title="Flag Transaction"
        message="Please provide a reason for flagging this transaction:"
        placeholder="Enter reason for flagging..."
        defaultValue={flagReason}
        type="textarea"
        loading={isLoading}
      />
    </div>
  );
};

export default PaymentTransactions;
