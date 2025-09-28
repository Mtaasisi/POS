import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { paymentTrackingService, PaymentTransaction } from '../../../lib/paymentTrackingService';
import { 
  ShoppingCart, DollarSign, TrendingUp, Users, 
  CheckCircle2, Clock, XCircle, Eye, Download,
  Calendar, Filter, Search, Package, Truck,
  Building2, Phone, Mail, FileText, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PurchaseOrderPaymentViewProps {
  onViewDetails?: (payment: PaymentTransaction) => void;
  onExport?: (payments: PaymentTransaction[]) => void;
}

const PurchaseOrderPaymentView: React.FC<PurchaseOrderPaymentViewProps> = ({
  onViewDetails,
  onExport
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [poPayments, setPOPayments] = useState<PaymentTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);

  // Fetch purchase order payments
  const fetchPOPayments = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching Purchase Order payments...');
      
      const allPayments = await paymentTrackingService.fetchPaymentTransactions(
        dateFilter !== 'all' ? getDateRange(dateFilter).start : undefined,
        dateFilter !== 'all' ? getDateRange(dateFilter).end : undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );

      // Filter for purchase order payments only
      const poPaymentsOnly = allPayments.filter(payment => payment.source === 'purchase_order');
      setPOPayments(poPaymentsOnly);
      
      console.log(`✅ Loaded ${poPaymentsOnly.length} Purchase Order payments`);
    } catch (error) {
      console.error('Error fetching Purchase Order payments:', error);
      toast.error('Failed to load Purchase Order payments');
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
      case 'approved':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Filter payments
  const filterPayments = () => {
    let filtered = poPayments;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.purchaseOrderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      filtered = filtered.filter(payment => payment.supplierId === supplierFilter);
    }

    return filtered;
  };

  // Get unique suppliers for filter
  const getUniqueSuppliers = () => {
    const suppliers = poPayments.reduce((acc, payment) => {
      if (payment.supplierId && payment.supplierName) {
        acc[payment.supplierId] = payment.supplierName;
      }
      return acc;
    }, {} as { [key: string]: string });
    
    return Object.entries(suppliers).map(([id, name]) => ({ id, name }));
  };

  // Calculate statistics
  const calculateStats = () => {
    const filtered = filterPayments();
    const totalAmount = filtered.reduce((sum, payment) => sum + payment.amount, 0);
    const completedAmount = filtered.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = filtered.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
    const failedAmount = filtered.filter(p => p.status === 'failed').reduce((sum, payment) => sum + payment.amount, 0);
    
    return {
      total: filtered.length,
      totalAmount,
      completedAmount,
      pendingAmount,
      failedAmount,
      successRate: filtered.length > 0 ? (filtered.filter(p => p.status === 'completed').length / filtered.length) * 100 : 0
    };
  };

  // Export payments
  const handleExport = () => {
    if (onExport) {
      onExport(filterPayments());
    } else {
      const csvContent = [
        'Transaction ID,Purchase Order,Supplier,Amount,Status,Payment Method,Date,Reference',
        ...filterPayments().map(payment => 
          `${payment.transactionId},${payment.purchaseOrderNumber},${payment.supplierName},${payment.amount},${payment.status},${payment.method},${payment.date},${payment.reference}`
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase_order_payments_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Purchase Order payments exported successfully');
    }
  };

  // View payment details
  const handleViewDetails = (payment: PaymentTransaction) => {
    if (onViewDetails) {
      onViewDetails(payment);
    }
  };

  useEffect(() => {
    fetchPOPayments();
  }, [statusFilter, dateFilter, supplierFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Purchase Order payments...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const filteredPayments = filterPayments();
  const suppliers = getUniqueSuppliers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Order Payments</h2>
          <p className="text-gray-600 mt-1">
            {stats.total} payments • {formatMoney(stats.totalAmount)} total
          </p>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Payments</div>
              <div className="text-lg font-bold text-blue-900">{stats.total}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Total Amount</div>
              <div className="text-lg font-bold text-green-900">{formatMoney(stats.totalAmount)}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-medium text-orange-700 uppercase tracking-wide">Success Rate</div>
              <div className="text-lg font-bold text-orange-900">{stats.successRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Suppliers</div>
              <div className="text-lg font-bold text-purple-900">{suppliers.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by supplier, PO number, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
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

        {suppliers.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        {filteredPayments.map((payment) => (
          <div key={payment.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  {getStatusIcon(payment.status)}
                </div>
                
                {/* Payment Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {payment.supplierName || 'Unknown Supplier'}
                    </h3>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>PO: {payment.purchaseOrderNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>{payment.method}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(payment.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {payment.supplierPhone && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{payment.supplierPhone}</span>
                      </div>
                      {payment.supplierEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{payment.supplierEmail}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Amount and Actions */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatMoney(payment.amount)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.transactionId}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(payment)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  
                  <button
                    onClick={() => setSelectedPayment(payment)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="View Full Details"
                  >
                    <FileText size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {payment.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Notes:</strong> {payment.notes}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPayments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Purchase Order payments found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No Purchase Order payments were found for the selected filters. Try adjusting your search criteria.
          </p>
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                  <div className="text-sm text-gray-900">{selectedPayment.transactionId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Order</label>
                  <div className="text-sm text-gray-900">{selectedPayment.purchaseOrderNumber}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Supplier</label>
                  <div className="text-sm text-gray-900">{selectedPayment.supplierName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <div className="text-sm text-gray-900 font-semibold">{formatMoney(selectedPayment.amount)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <div className="text-sm text-gray-900">{selectedPayment.method}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Date</label>
                  <div className="text-sm text-gray-900">{new Date(selectedPayment.date).toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference</label>
                  <div className="text-sm text-gray-900">{selectedPayment.reference}</div>
                </div>
              </div>
              
              {selectedPayment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded-lg">{selectedPayment.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderPaymentView;
