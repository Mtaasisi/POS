import React, { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import PageHeader from '../components/ui/PageHeader';
import SalesPaymentAnalytics from '../components/SalesPaymentAnalytics';
import RealTimePaymentUpdates from '../components/RealTimePaymentUpdates';
import { 
  salesPaymentTrackingService, 
  SalesPayment, 
  SalesPaymentMetrics, 
  SalesPaymentFilter 
} from '../../../lib/salesPaymentTrackingService';
import { 
  CreditCard, BarChart3, Activity, Settings, 
  RefreshCw, Download, Filter, Search, Calendar,
  TrendingUp, DollarSign, ShoppingCart, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type TabType = 'overview' | 'analytics' | 'realtime' | 'settings';

const EnhancedPaymentTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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
  const [selectedSale, setSelectedSale] = useState<SalesPayment | null>(null);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'realtime', label: 'Real-time', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

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
        endDate: selectedDate ? selectedDate : undefined,
        limit: 100
      };

      const [salesData, metricsData] = await Promise.all([
        salesPaymentTrackingService.fetchSalesPayments(filter),
        salesPaymentTrackingService.calculateSalesPaymentMetrics(filter)
      ]);

      setSales(salesData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  // Handle real-time payment updates
  const handlePaymentUpdate = (payment: SalesPayment) => {
    setSales(prev => {
      const existingIndex = prev.findIndex(s => s.id === payment.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = payment;
        return updated;
      } else {
        return [payment, ...prev];
      }
    });
  };

  const handleMetricsUpdate = () => {
    fetchSalesData();
  };

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
        return { color: 'text-green-500', bg: 'bg-green-50' };
      case 'pending':
        return { color: 'text-yellow-500', bg: 'bg-yellow-50' };
      case 'cancelled':
        return { color: 'text-red-500', bg: 'bg-red-50' };
      case 'refunded':
        return { color: 'text-orange-500', bg: 'bg-orange-50' };
      default:
        return { color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  // Export sales data
  const handleExport = () => {
    const csvData = sales.map(sale => ({
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
    toast.success('Sales data exported successfully');
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalSales}</p>
                    <p className="text-sm text-gray-500">{metrics.totalItems} items</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalAmount)}</p>
                    <p className="text-sm text-gray-500">Avg: {formatCurrency(metrics.averageSaleAmount)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.successRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">{formatCurrency(metrics.completedAmount)} completed</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Sales</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.pendingAmount)}</p>
                    <p className="text-sm text-gray-500">Awaiting completion</p>
                  </div>
                  <Users className="h-8 w-8 text-yellow-500" />
                </div>
              </GlassCard>
            </div>

            {/* Recent Sales */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
                <GlassButton onClick={handleExport} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </GlassButton>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading sales...</span>
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sales found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sales.slice(0, 10).map((sale) => {
                    const statusDisplay = getStatusDisplay(sale.status);
                    
                    return (
                      <div
                        key={sale.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-medium text-gray-900">{sale.saleNumber}</span>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                                {sale.status}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{sale.customerName}</span>
                              <span>•</span>
                              <span>{sale.saleItems.length} items</span>
                              <span>•</span>
                              <span>{sale.paymentMethod}</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                            <p className="text-xs text-gray-400">{formatDate(sale.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        );

      case 'analytics':
        return (
          <SalesPaymentAnalytics 
            filter={{
              startDate: selectedDate ? selectedDate : undefined,
              endDate: selectedDate ? selectedDate : undefined,
              status: selectedStatus !== 'all' ? selectedStatus : undefined,
              paymentMethod: selectedMethod !== 'all' ? selectedMethod : undefined
            }}
          />
        );

      case 'realtime':
        return (
          <div className="space-y-6">
            <RealTimePaymentUpdates 
              onPaymentUpdate={handlePaymentUpdate}
              onMetricsUpdate={handleMetricsUpdate}
            />
            
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Sales Feed</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sales.slice(0, 20).map((sale) => {
                  const statusDisplay = getStatusDisplay(sale.status);
                  
                  return (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${statusDisplay.color.replace('text-', 'bg-')}`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{sale.saleNumber}</p>
                          <p className="text-sm text-gray-600">{sale.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{formatDate(sale.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Tracking Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-refresh interval (seconds)
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                    <option value="0">Disabled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Real-time notifications
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-600">Enable real-time payment notifications</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export format
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
              </div>
            </GlassCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Payment Tracking"
          subtitle="Track and manage all sales payments with real-time updates"
          icon={CreditCard}
        />

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
          </div>
        </GlassCard>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {renderTabContent()}

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
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    </div>
                  </div>

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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPaymentTrackingPage;
