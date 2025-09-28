import React, { useState, useEffect, useMemo } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PageHeader from '../components/ui/PageHeader';
import { 
  salesPaymentTrackingService, 
  SalesPayment, 
  SalesPaymentMetrics, 
  SalesPaymentFilter,
  SalesPaymentSummary 
} from '../../../lib/salesPaymentTrackingService';
import { 
  CreditCard, DollarSign, TrendingUp, BarChart3, Users, 
  RefreshCw, Search, Filter, Calendar, Download, Eye,
  CheckCircle, Clock, XCircle, AlertTriangle, ShoppingCart,
  Package, User, Phone, Mail, MapPin, Receipt, Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SalesPaymentTrackingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Data states
  const [sales, setSales] = useState<SalesPayment[]>([]);
  const [metrics, setMetrics] = useState<SalesPaymentMetrics>({
    totalSales: 0,
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0,
    cancelledAmount: 0,
    refundedAmount: 0,
    averageSaleAmount: 0,
    totalItems: 0,
    successRate: 0
  });
  const [dailySummary, setDailySummary] = useState<SalesPaymentSummary[]>([]);
  const [selectedSale, setSelectedSale] = useState<SalesPayment | null>(null);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchSalesData();
  }, [selectedDate, selectedStatus, selectedMethod]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      const filter: SalesPaymentFilter = {
        searchQuery: searchQuery || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        paymentMethod: selectedMethod !== 'all' ? selectedMethod : undefined,
        startDate: selectedDate ? selectedDate : undefined,
        endDate: selectedDate ? selectedDate : undefined
      };

      const [salesData, metricsData, summaryData] = await Promise.all([
        salesPaymentTrackingService.fetchSalesPayments(filter),
        salesPaymentTrackingService.calculateSalesPaymentMetrics(filter),
        salesPaymentTrackingService.getSalesPaymentSummary(7)
      ]);

      setSales(salesData);
      setMetrics(metricsData);
      setDailySummary(summaryData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Filter sales based on search query
  const filteredSales = useMemo(() => {
    if (!searchQuery) return sales;
    
    return sales.filter(sale => 
      sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customerPhone?.includes(searchQuery) ||
      sale.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sales, searchQuery]);

  // Format currency in TSH
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-500', icon: CheckCircle, bg: 'bg-green-50' };
      case 'pending':
        return { color: 'text-yellow-500', icon: Clock, bg: 'bg-yellow-50' };
      case 'cancelled':
        return { color: 'text-red-500', icon: XCircle, bg: 'bg-red-50' };
      case 'refunded':
        return { color: 'text-orange-500', icon: AlertTriangle, bg: 'bg-orange-50' };
      default:
        return { color: 'text-gray-500', icon: Clock, bg: 'bg-gray-50' };
    }
  };

  // Handle sale status update
  const handleStatusUpdate = async (saleId: string, newStatus: string) => {
    try {
      const success = await salesPaymentTrackingService.updateSaleStatus(
        saleId, 
        newStatus as any
      );
      
      if (success) {
        toast.success('Sale status updated successfully');
        fetchSalesData(); // Refresh data
      } else {
        toast.error('Failed to update sale status');
      }
    } catch (error) {
      console.error('Error updating sale status:', error);
      toast.error('Failed to update sale status');
    }
  };

  // Export sales data
  const handleExport = () => {
    const csvData = filteredSales.map(sale => ({
      'Sale Number': sale.saleNumber,
      'Customer': sale.customerName,
      'Phone': sale.customerPhone || '',
      'Email': sale.customerEmail || '',
      'Total Amount': sale.totalAmount,
      'Payment Method': sale.paymentMethod,
      'Status': sale.status,
      'Date': formatDate(sale.createdAt),
      'Items': sale.saleItems.length,
      'Notes': sale.notes || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Sales Payment Tracking"
          subtitle="Track and manage all sales payments"
          icon={CreditCard}
        />

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalSales}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.completedAmount)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search sales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <GlassButton
              onClick={fetchSalesData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </GlassButton>

            <GlassButton
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </GlassButton>
          </div>
        </GlassCard>

        {/* Sales List */}
        <GlassCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sales Payments</h3>
              <p className="text-sm text-gray-500">{filteredSales.length} sales found</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading sales...</span>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No sales found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSales.map((sale) => {
                  const statusDisplay = getStatusDisplay(sale.status);
                  const StatusIcon = statusDisplay.icon;
                  
                  return (
                    <div
                      key={sale.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedSale(sale)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{sale.saleNumber}</span>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {sale.status}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {sale.customerName}
                            </div>
                            {sale.customerPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {sale.customerPhone}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {sale.saleItems.length} items
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                          <p className="text-sm text-gray-500">{sale.paymentMethod}</p>
                          <p className="text-xs text-gray-400">{formatDate(sale.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Sale Details Modal */}
        {selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Sale Details</h3>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sale Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Sale Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sale Number:</span>
                        <span className="font-medium">{selectedSale.saleNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedSale.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-medium">{selectedSale.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{selectedSale.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(selectedSale.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedSale.customerName}</span>
                      </div>
                      {selectedSale.customerPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{selectedSale.customerPhone}</span>
                        </div>
                      )}
                      {selectedSale.customerEmail && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{selectedSale.customerEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sale Items */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Sale Items</h4>
                  <div className="space-y-2">
                    {selectedSale.saleItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">{item.variantName} - {item.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(item.totalPrice)}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <GlassButton
                    onClick={() => handleStatusUpdate(selectedSale.id, 'completed')}
                    disabled={selectedSale.status === 'completed'}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark Complete
                  </GlassButton>
                  
                  <GlassButton
                    onClick={() => handleStatusUpdate(selectedSale.id, 'cancelled')}
                    disabled={selectedSale.status === 'cancelled'}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Sale
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPaymentTrackingPage;
