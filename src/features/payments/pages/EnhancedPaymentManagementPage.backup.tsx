import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import SearchBar from '../../shared/components/ui/SearchBar';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { 
  CreditCard, RefreshCw, Download, Settings, ShoppingCart, Search, Filter, 
  Calendar, ChevronLeft, ChevronRight, CheckSquare, Square, MoreHorizontal,
  AlertTriangle, CheckCircle, Clock, XCircle, TrendingUp, TrendingDown, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

// Import only essential components
import PaymentTrackingDashboard from '../components/PaymentTrackingDashboard';
import PurchaseOrderPaymentDashboard from '../components/PurchaseOrderPaymentDashboard';
import PaymentAccountManagement from '../components/PaymentAccountManagement';

// Payment tab types - simplified for repair shop business
type PaymentTab = 'tracking' | 'providers' | 'purchase-orders';

interface TabConfig {
  id: PaymentTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

// Payment data interfaces
interface PaymentData {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  date: string;
  customer?: string;
  reference?: string;
  type: 'customer_payment' | 'purchase_order_payment';
}

interface PaymentFilters {
  search: string;
  status: 'all' | 'completed' | 'pending' | 'failed';
  method: 'all' | string;
  dateRange: { start: string; end: string };
  sortBy: 'date' | 'amount' | 'customer' | 'status';
  sortOrder: 'asc' | 'desc';
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface DataCache {
  payments: PaymentData[] | null;
  accounts: any[] | null;
  lastUpdated: number;
}

const EnhancedPaymentManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Error handling
  const { errorState, handleError, clearError, withErrorHandling } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState<PaymentTab>('tracking');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [lastDataLoadTime, setLastDataLoadTime] = useState(0);
  
  // Data cache
  const [dataCache, setDataCache] = useState<DataCache>({
    payments: null,
    accounts: null,
    lastUpdated: 0
  });
  
  // Payment data
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  
  // Search and filters
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: 'all',
    method: 'all',
    dateRange: { start: '', end: '' },
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // Pagination
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0
  });
  
  // Bulk operations
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(true);

  // Enhanced payment data fetching with caching and error handling
  const fetchPaymentData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (!forceRefresh && dataCache.payments && (now - dataCache.lastUpdated) < CACHE_DURATION) {
      setPayments(dataCache.payments);
      setIsLoading(false);
      setShowLoadingSkeleton(false);
      return;
    }

    // Prevent multiple simultaneous loads
    if (isDataLoading) return;

    await withErrorHandling(async () => {
      setIsDataLoading(true);
      setIsLoading(true);
      setShowLoadingSkeleton(true);
      
      try {
        // Fetch customer payments with more details
        const { data: customerPayments, error: customerError } = await supabase
          .from('customer_payments')
          .select(`
            id, amount, status, method, payment_date, reference, notes,
            customers:customer_id (name, phone),
            devices:device_id (model, brand)
          `)
          .order('payment_date', { ascending: false });

        // Fetch purchase order payments
        const { data: poPayments, error: poError } = await supabase
          .from('purchase_order_payments')
          .select(`
            id, amount, status, payment_method, payment_date, reference, notes,
            lats_purchase_orders:purchase_order_id (order_number, supplier_id)
          `)
          .order('payment_date', { ascending: false });

        if (customerError) throw customerError;
        if (poError) throw poError;

        // Fetch supplier names for purchase order payments
        const supplierIds = [...new Set((poPayments || [])
          .map(payment => payment.lats_purchase_orders?.supplier_id)
          .filter(Boolean))];
        
        let suppliersMap: Record<string, string> = {};
        if (supplierIds.length > 0) {
          const { data: suppliers, error: suppliersError } = await supabase
            .from('lats_suppliers')
            .select('id, name')
            .in('id', supplierIds);
          
          if (!suppliersError && suppliers) {
            suppliersMap = suppliers.reduce((acc, supplier) => {
              acc[supplier.id] = supplier.name;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        // Transform and combine payment data
        const transformedPayments: PaymentData[] = [
          ...(customerPayments || []).map(payment => ({
            id: payment.id,
            amount: Number(payment.amount),
            status: payment.status as 'completed' | 'pending' | 'failed',
            method: payment.method || 'Unknown',
            date: payment.payment_date,
            customer: payment.customers?.name || 'Unknown Customer',
            reference: payment.reference,
            type: 'customer_payment' as const
          })),
          ...(poPayments || []).map(payment => ({
            id: payment.id,
            amount: Number(payment.amount),
            status: payment.status as 'completed' | 'pending' | 'failed',
            method: payment.payment_method || 'Unknown',
            date: payment.payment_date,
            customer: suppliersMap[payment.lats_purchase_orders?.supplier_id || ''] || 'Unknown Supplier',
            reference: payment.reference,
            type: 'purchase_order_payment' as const
          }))
        ];

        // Calculate totals
        const completedPayments = transformedPayments.filter(p => p.status === 'completed');
        const pendingPayments = transformedPayments.filter(p => p.status === 'pending');
        
        const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        setPayments(transformedPayments);
        setTotalRevenue(totalRevenue);
        setPendingAmount(pendingAmount);
        setTotalPayments(transformedPayments.length);

        // Update cache
        setDataCache({
          payments: transformedPayments,
          accounts: dataCache.accounts,
          lastUpdated: now
        });

        setLastDataLoadTime(now);

      } catch (error) {
        handleError(error as Error, 'Failed to load payment data');
        throw error;
      } finally {
        setIsDataLoading(false);
        setIsLoading(false);
        setShowLoadingSkeleton(false);
      }
    });
  }, [dataCache, isDataLoading, withErrorHandling, handleError]);

  // Filtered and sorted payments
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.customer?.toLowerCase().includes(searchTerm) ||
        payment.reference?.toLowerCase().includes(searchTerm) ||
        payment.method.toLowerCase().includes(searchTerm) ||
        payment.id.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    // Method filter
    if (filters.method !== 'all') {
      filtered = filtered.filter(payment => payment.method === filters.method);
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.date);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
        
        if (startDate && paymentDate < startDate) return false;
        if (endDate && paymentDate > endDate) return false;
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'customer':
          aValue = a.customer?.toLowerCase() || '';
          bValue = b.customer?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [payments, filters]);

  // Paginated payments
  const paginatedPayments = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, pagination.currentPage, pagination.itemsPerPage]);

  // Update pagination when filtered data changes
  useEffect(() => {
    const totalPages = Math.ceil(filteredPayments.length / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalItems: filteredPayments.length,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
    }));
  }, [filteredPayments.length, pagination.itemsPerPage]);

  // Filter handlers
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const handleFilterChange = useCallback((key: keyof PaymentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      method: 'all',
      dateRange: { start: '', end: '' },
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleItemsPerPageChange = useCallback((itemsPerPage: number) => {
    setPagination(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  }, []);

  // Bulk operation handlers
  const togglePaymentSelection = useCallback((paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId) 
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  }, []);

  const selectAllPayments = useCallback(() => {
    setSelectedPayments(paginatedPayments.map(p => p.id));
  }, [paginatedPayments]);

  const deselectAllPayments = useCallback(() => {
    setSelectedPayments([]);
  }, []);

  // Get unique payment methods for filter
  const paymentMethods = useMemo(() => {
    const methods = [...new Set(payments.map(p => p.method))];
    return methods.map(method => ({ value: method, label: method }));
  }, [payments]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);


  // Enhanced real-time subscription for payment updates
  useEffect(() => {
    const paymentsSubscription = supabase
      .channel('payment-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'customer_payments' 
      }, (payload) => {
        console.log('Customer payment updated:', payload);
        fetchPaymentData(true); // Force refresh
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'purchase_order_payments' 
      }, (payload) => {
        console.log('Purchase order payment updated:', payload);
        fetchPaymentData(true); // Force refresh
      })
      .subscribe((status) => {
        console.log('Payment subscription status:', status);
      });

    return () => {
      paymentsSubscription.unsubscribe();
    };
  }, [fetchPaymentData]);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="w-32 h-4 bg-gray-300 rounded"></div>
                <div className="w-24 h-4 bg-gray-300 rounded"></div>
              </div>
              <div className="w-20 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Format currency with full numbers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Define payment tabs for repair shop business
  const paymentTabs: TabConfig[] = [
    {
      id: 'tracking',
      label: 'Payment Tracking',
      icon: <CreditCard size={20} />,
      description: 'Monitor customer repair payments',
      color: 'blue'
    },
    {
      id: 'providers',
      label: 'Payment Methods',
      icon: <Settings size={20} />,
      description: 'Manage cash, card, and transfer methods',
      color: 'indigo'
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: <ShoppingCart size={20} />,
      description: 'Manage supplier payments',
      color: 'teal'
    }
  ];

  // All tabs are available for repair shop users
  const availableTabs = paymentTabs;

  // Get current tab config
  const currentTab = paymentTabs.find(tab => tab.id === activeTab);

  // Handle tab changes
  const handleTabChange = (tabId: PaymentTab) => {
    setActiveTab(tabId);
  };


  // Enhanced payment actions
  const handleViewPaymentDetails = useCallback((payment: PaymentData) => {
    toast.success(`Viewing details for payment ${payment.id}`);
    // TODO: Open payment details modal
  }, []);

  const handleRefundPayment = useCallback((payment: PaymentData) => {
    toast.success(`Processing refund for payment ${payment.id}`);
    // TODO: Open refund modal
  }, []);

  const handleExportData = useCallback(async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      setIsLoading(true);
      
      // Apply current filters to export data
      const exportData = filteredPayments.map(payment => ({
        ID: payment.id,
        Amount: payment.amount,
        Status: payment.status,
        Method: payment.method,
        Date: new Date(payment.date).toLocaleDateString(),
        Customer: payment.customer || 'N/A',
        Reference: payment.reference || 'N/A',
        Type: payment.type === 'customer_payment' ? 'Customer Payment' : 'Purchase Order Payment'
      }));

      if (format === 'csv') {
        // Generate CSV
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Exported ${exportData.length} payments as ${format.toUpperCase()}`);
    } catch (error) {
      handleError(error as Error, 'Failed to export payment data');
    } finally {
      setIsLoading(false);
    }
  }, [filteredPayments, handleError]);

  // Bulk operations
  const handleBulkExport = useCallback(() => {
    if (selectedPayments.length === 0) {
      toast.error('Please select payments to export');
      return;
    }
    
    const selectedData = payments.filter(p => selectedPayments.includes(p.id));
    // TODO: Implement bulk export
    toast.success(`Exporting ${selectedPayments.length} selected payments`);
  }, [selectedPayments, payments]);

  const handleBulkDelete = useCallback(() => {
    if (selectedPayments.length === 0) {
      toast.error('Please select payments to delete');
      return;
    }
    
    // TODO: Implement bulk delete with confirmation
    toast.success(`Deleting ${selectedPayments.length} selected payments`);
  }, [selectedPayments]);

  // Render tab content for repair shop
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tracking':
        return (
          <PaymentTrackingDashboard
            onViewDetails={handleViewPaymentDetails}
            onRefund={handleRefundPayment}
            onExport={handleExportData}
          />
        );
      case 'providers':
        return <PaymentAccountManagement />;
      case 'purchase-orders':
        return (
          <PurchaseOrderPaymentDashboard
            onViewDetails={(payment) => {
              toast(`Viewing purchase order payment details for ${payment.id}`);
            }}
            onMakePayment={(purchaseOrder) => {
              toast(`Opening payment modal for purchase order ${purchaseOrder.orderNumber}`);
            }}
            onExport={handleExportData}
          />
        );
      default:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Management</h3>
            <p className="text-gray-600">Select a tab to get started</p>
          </div>
        );
    }
  };

  return (
    <PageErrorBoundary pageName="Payment Management" showDetails={true}>
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton to="/dashboard" />
              <div className="flex items-center gap-3">
                <CreditCard size={24} className="text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Payment Management</h1>
                  <p className="text-xs text-gray-500">Repair shop payment tracking and management</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <GlassButton
                onClick={() => fetchPaymentData(true)}
                icon={<RefreshCw size={16} />}
                variant="secondary"
                loading={isLoading}
                disabled={isLoading}
                className="text-sm"
              >
                Refresh
              </GlassButton>
              <GlassButton
                onClick={() => handleExportData('csv')}
                icon={<Download size={16} />}
                className="text-sm bg-gradient-to-r from-green-500 to-green-600 text-white"
                disabled={isLoading}
              >
                Export
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Matching GeneralProductDetailModal style */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-8 px-6">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters Section */}
        {activeTab === 'tracking' && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <SearchBar
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Search payments by customer, reference, method..."
                  className="w-full"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <GlassSelect
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'failed', label: 'Failed' }
                  ]}
                  className="min-w-[120px]"
                />

                <GlassSelect
                  value={filters.method}
                  onChange={(value) => handleFilterChange('method', value)}
                  options={[
                    { value: 'all', label: 'All Methods' },
                    ...paymentMethods
                  ]}
                  className="min-w-[140px]"
                />

                <GlassSelect
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                  options={[
                    { value: 'date-desc', label: 'Newest First' },
                    { value: 'date-asc', label: 'Oldest First' },
                    { value: 'amount-desc', label: 'Highest Amount' },
                    { value: 'amount-asc', label: 'Lowest Amount' },
                    { value: 'customer-asc', label: 'Customer A-Z' },
                    { value: 'customer-desc', label: 'Customer Z-A' }
                  ]}
                  className="min-w-[140px]"
                />

                <GlassButton
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  icon={<Filter size={16} />}
                  variant="secondary"
                  className="text-sm"
                >
                  Filters
                </GlassButton>

                {(filters.search || filters.status !== 'all' || filters.method !== 'all' || filters.dateRange.start || filters.dateRange.end) && (
                  <GlassButton
                    onClick={clearFilters}
                    icon={<X size={16} />}
                    variant="outline"
                    className="text-sm text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Clear
                  </GlassButton>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                    <GlassSelect
                      value={pagination.itemsPerPage.toString()}
                      onChange={(value) => handleItemsPerPageChange(Number(value))}
                      options={[
                        { value: '10', label: '10 per page' },
                        { value: '20', label: '20 per page' },
                        { value: '50', label: '50 per page' },
                        { value: '100', label: '100 per page' }
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">

          {/* Loading State */}
          {showLoadingSkeleton ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-6">
              {renderTabContent()}
              
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default EnhancedPaymentManagementPage;
