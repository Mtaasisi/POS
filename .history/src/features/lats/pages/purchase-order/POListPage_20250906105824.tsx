// POListPage - Purchase Order List & Management Interface (POS Style)
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../../features/shared/components/ui/BackButton';

import LATSBreadcrumb from '../../components/ui/LATSBreadcrumb';
import { 
  Search, Plus, RefreshCw, Eye, Edit, Trash2, CheckCircle, 
  XCircle, Clock, Send, Truck, Package, DollarSign, Calendar,
  Filter, Download, Upload, BarChart3, Users, Command, 
  AlertCircle, FileText, Grid, List, SortAsc, SortDesc,
  ChevronDown, ChevronUp, Star, Coins, Phone, Building, MapPin
} from 'lucide-react';

import { useInventoryStore } from '../../stores/useInventoryStore';
import { PurchaseOrder } from '../../types/inventory';
import { formatMoney, SUPPORTED_CURRENCIES, PAYMENT_TERMS } from '../../lib/purchaseOrderUtils';
import { toast } from 'react-hot-toast';

// Performance constants
const SEARCH_DEBOUNCE_MS = 300;

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const POListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Database state management
  const { 
    purchaseOrders, 
    suppliers,
    isLoading, 
    error,
    loadPurchaseOrders,
    loadSuppliers,
    deletePurchaseOrder,
    receivePurchaseOrder,
    updatePurchaseOrder
  } = useInventoryStore();

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'received' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Display options
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'createdAt' | 'orderNumber' | 'totalAmount' | 'expectedDelivery'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📋 PO List: Loading purchase orders...');
        await Promise.all([
          loadPurchaseOrders(),
          loadSuppliers()
        ]);
        console.log('📊 PO List: Data loaded successfully');
      } catch (error) {
        console.error('Error loading purchase orders:', error);
      }
    };
    
    loadData();
  }, [loadPurchaseOrders, loadSuppliers]);

  // Filter and sort purchase orders
  const filteredOrders = useMemo(() => {
    let filtered = purchaseOrders || [];

    // Search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.notes?.toLowerCase().includes(query) ||
        suppliers.find(s => s.id === order.supplierId)?.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(order => order.supplierId === supplierFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filtered = filtered.filter(order => new Date(order.createdAt) >= startDate);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => new Date(order.createdAt) >= startDate);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(order => new Date(order.createdAt) >= startDate);
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            const start = new Date(customDateRange.start);
            const end = new Date(customDateRange.end);
            filtered = filtered.filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate >= start && orderDate <= end;
            });
          }
          break;
      }
    }

    // Amount range filter
    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter(order => {
        const amount = order.totalAmount || 0;
        const min = amountRange.min ? parseFloat(amountRange.min) : 0;
        const max = amountRange.max ? parseFloat(amountRange.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'orderNumber':
          aValue = a.orderNumber;
          bValue = b.orderNumber;
          break;
        case 'totalAmount':
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        case 'expectedDelivery':
          aValue = a.expectedDelivery ? new Date(a.expectedDelivery).getTime() : 0;
          bValue = b.expectedDelivery ? new Date(b.expectedDelivery).getTime() : 0;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [purchaseOrders, suppliers, debouncedSearchQuery, statusFilter, dateFilter, customDateRange, supplierFilter, amountRange, sortBy, sortOrder]);

  // Action handlers
  const handleViewOrder = useCallback((order: PurchaseOrder) => {
    navigate(`/lats/purchase-orders/${order.id}`);
  }, [navigate]);

  const handleEditOrder = useCallback((order: PurchaseOrder) => {
    navigate(`/lats/purchase-orders/${order.id}/edit`);
  }, [navigate]);

  const handleDeleteOrder = useCallback(async (order: PurchaseOrder) => {
    if (!confirm(`Delete purchase order ${order.orderNumber}?`)) return;
    
    try {
      const result = await deletePurchaseOrder(order.id);
      if (result.ok) {
        toast.success('Purchase order deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete purchase order');
      }
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast.error('Failed to delete purchase order');
    }
  }, [deletePurchaseOrder]);

  const handleReceiveOrder = useCallback(async (order: PurchaseOrder) => {
    if (!confirm(`Mark purchase order ${order.orderNumber} as received?`)) return;
    
    try {
      const result = await receivePurchaseOrder(order.id);
      if (result.ok) {
        toast.success('Purchase order marked as received');
      } else {
        toast.error(result.message || 'Failed to update purchase order');
      }
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      toast.error('Failed to update purchase order');
    }
  }, [receivePurchaseOrder]);

  const handleToggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const handleSelectAllOrders = useCallback(() => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  }, [selectedOrders.length, filteredOrders]);

  const handleBulkAction = useCallback(async (action: 'delete' | 'export') => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected');
      return;
    }

    if (action === 'delete') {
      if (!confirm(`Delete ${selectedOrders.length} selected purchase orders?`)) return;
      
      try {
        const results = await Promise.all(
          selectedOrders.map(id => deletePurchaseOrder(id))
        );
        
        const successful = results.filter(r => r.ok).length;
        toast.success(`${successful} purchase orders deleted successfully`);
        setSelectedOrders([]);
      } catch (error) {
        toast.error('Failed to delete some purchase orders');
      }
    }
  }, [selectedOrders, deletePurchaseOrder]);

  // Search input handlers
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSearchInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
    }
  }, [searchQuery]);

  // Global keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      navigate('/lats/purchase-orders/create');
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-700', icon: FileText, text: 'Draft' };
      case 'sent':
        return { color: 'bg-blue-100 text-blue-700', icon: Send, text: 'Sent' };
      case 'received':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Received' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-700', icon: XCircle, text: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: Clock, text: 'Unknown' };
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Navigation */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <LATSBreadcrumb 
            items={[
              { label: 'LATS', href: '/lats' },
              { label: 'Purchase Orders', href: '/lats/purchase-orders' }
            ]} 
          />
        </div>
      </div>

      {/* Top Actions Bar - POS Style */}
      <div className="px-4 sm:px-6 mb-6">
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="text-sm text-gray-600">
                  {filteredOrders.length} of {purchaseOrders.length} orders
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <GlassButton
                onClick={() => navigate('/lats/purchase-orders/create')}
                icon={<Plus size={18} />}
                className="bg-orange-500 text-white"
              >
                Create PO
              </GlassButton>
              <GlassButton
                onClick={() => navigate('/lats/purchase-orders/suppliers')}
                icon={<Users size={18} />}
                className="bg-blue-500 text-white"
              >
                Suppliers
              </GlassButton>
              <GlassButton
                onClick={() => navigate('/lats/purchase-orders/shipped-items')}
                icon={<Truck size={18} />}
                className="bg-green-500 text-white"
              >
                Shipped Items
              </GlassButton>
              <GlassButton
                onClick={() => navigate('/lats/purchase-orders/reports')}
                icon={<BarChart3 size={18} />}
                className="bg-purple-500 text-white"
              >
                Reports
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="px-4 sm:px-6 pb-20 max-w-full mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
          {/* Search & Filters Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <GlassCard className="p-6 h-full flex flex-col">
              {/* Fixed Search Section - POS Style */}
              <div className="flex-shrink-0 mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-orange-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search purchase orders by number, supplier, notes... (Ctrl+F focus)"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchInputKeyPress}
                    className="w-full pl-14 pr-24 py-5 text-lg border-2 border-orange-200 rounded-xl bg-white text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/30 focus:border-orange-500 shadow-lg hover:shadow-xl transition-all duration-200"
                    style={{ minHeight: '60px' }}
                  />
                  
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
                      title="Advanced filters"
                    >
                      <Command className="w-5 h-5" />
                    </button>
                    <button
                      onClick={loadPurchaseOrders}
                      className="p-3 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors duration-200"
                      title="Refresh orders"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All</option>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="received">Received</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">View:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors duration-200`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors duration-200`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="orderNumber">Order Number</option>
                      <option value="totalAmount">Total Amount</option>
                      <option value="expectedDelivery">Expected Delivery</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Supplier Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                        <select
                          value={supplierFilter}
                          onChange={(e) => setSupplierFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">All Suppliers</option>
                          {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        <select
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="week">Last 7 Days</option>
                          <option value="month">This Month</option>
                          <option value="custom">Custom Range</option>
                        </select>
                      </div>

                      {/* Amount Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={amountRange.min}
                            onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={amountRange.max}
                            onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Date Range */}
                    {dateFilter === 'custom' && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={customDateRange.start}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                          <input
                            type="date"
                            value={customDateRange.end}
                            onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Clear Filters */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setDateFilter('all');
                          setSupplierFilter('');
                          setAmountRange({ min: '', max: '' });
                          setCustomDateRange({ start: '', end: '' });
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* Bulk Actions */}
                {selectedOrders.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-100 rounded-lg border border-orange-200">
                    <span className="text-sm font-medium text-orange-800">
                      {selectedOrders.length} orders selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBulkAction('export')}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Orders List/Grid */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading purchase orders...</h3>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading orders</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <GlassButton
                      onClick={loadPurchaseOrders}
                      icon={<RefreshCw size={18} />}
                      className="bg-orange-500 text-white"
                    >
                      Retry
                    </GlassButton>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {purchaseOrders.length === 0 ? 'No purchase orders yet' : 'No orders match your filters'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {purchaseOrders.length === 0 
                        ? 'Create your first purchase order to get started'
                        : 'Try adjusting your search criteria'
                      }
                    </p>
                    <GlassButton
                      onClick={() => navigate('/lats/purchase-orders/create')}
                      icon={<Plus size={20} />}
                      className="bg-orange-500 text-white"
                    >
                      Create First PO
                    </GlassButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Select All Checkbox */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={handleSelectAllOrders}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select All ({filteredOrders.length} orders)
                      </span>
                    </div>

                    {/* Orders List */}
                    {viewMode === 'list' ? (
                      <div className="space-y-3">
                        {filteredOrders.map((order) => {
                          const supplier = suppliers.find(s => s.id === order.supplierId);
                          const statusDisplay = getStatusDisplay(order.status);
                          const StatusIcon = statusDisplay.icon;
                          const currency = SUPPORTED_CURRENCIES.find(c => c.code === order.currency) || SUPPORTED_CURRENCIES[0];
                          
                          return (
                            <div
                              key={order.id}
                              className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(order.id)}
                                    onChange={() => handleToggleOrderSelection(order.id)}
                                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                  />
                                  
                                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {order.orderNumber.slice(-2)}
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusDisplay.color}`}>
                                        <StatusIcon className="w-3 h-3 inline mr-1" />
                                        {statusDisplay.text}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                          <Building className="w-3 h-3" />
                                          {supplier?.name || 'Unknown Supplier'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          {formatMoney(order.totalAmount || 0, currency)}
                                          {order.exchangeRate && order.exchangeRate !== 1.0 && (
                                            <span className="text-xs text-gray-500 ml-1">
                                              (1 {order.currency} = {order.exchangeRate.toFixed(4)} TZS)
                                            </span>
                                          )}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewOrder(order)}
                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    title="View order"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                  
                                  {order.status === 'draft' && (
                                    <button
                                      onClick={() => handleEditOrder(order)}
                                      className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                      title="Edit order"
                                    >
                                      <Edit className="w-5 h-5" />
                                    </button>
                                  )}
                                  
                                  {order.status === 'sent' && (
                                    <button
                                      onClick={() => handleReceiveOrder(order)}
                                      className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                                      title="Mark as received"
                                    >
                                      <CheckCircle className="w-5 h-5" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleDeleteOrder(order)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    title="Delete order"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Order Details (Expandable) */}
                              {(order.expectedDelivery || order.exchangeRate) && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    {order.expectedDelivery && (
                                      <span className="flex items-center gap-1">
                                        <Truck className="w-3 h-3" />
                                        Expected: {new Date(order.expectedDelivery).toLocaleDateString()}
                                      </span>
                                    )}
                                    {order.exchangeRate && order.exchangeRate !== 1.0 && (
                                      <span className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        Rate: 1 {order.currency} = {order.exchangeRate.toFixed(4)} TZS
                                        {order.exchangeRateSource && order.exchangeRateSource !== 'default' && (
                                          <span className="text-xs text-gray-500 ml-1">
                                            ({order.exchangeRateSource})
                                          </span>
                                        )}
                                      </span>
                                    )}
                                    {order.notes && (
                                      <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {order.notes.substring(0, 50)}{order.notes.length > 50 ? '...' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredOrders.map((order) => {
                          const supplier = suppliers.find(s => s.id === order.supplierId);
                          const statusDisplay = getStatusDisplay(order.status);
                          const StatusIcon = statusDisplay.icon;
                          const currency = SUPPORTED_CURRENCIES.find(c => c.code === order.currency) || SUPPORTED_CURRENCIES[0];
                          
                          return (
                            <div
                              key={order.id}
                              className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(order.id)}
                                    onChange={() => handleToggleOrderSelection(order.id)}
                                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                  />
                                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {order.orderNumber.slice(-2)}
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.color}`}>
                                  <StatusIcon className="w-3 h-3 inline mr-1" />
                                  {statusDisplay.text}
                                </span>
                              </div>
                              
                              <div className="mb-3">
                                <h3 className="font-bold text-gray-900 mb-1">{order.orderNumber}</h3>
                                <p className="text-sm text-gray-600">{supplier?.name || 'Unknown Supplier'}</p>
                                <p className="text-lg font-bold text-orange-600 mt-2">
                                  {formatMoney(order.totalAmount || 0, currency)}
                                  {order.exchangeRate && order.exchangeRate !== 1.0 && (
                                    <span className="text-xs text-gray-500 block mt-1">
                                      1 {order.currency} = {order.exchangeRate.toFixed(4)} TZS
                                    </span>
                                  )}
                                </p>
                              </div>
                              
                              <div className="text-xs text-gray-500 mb-3">
                                <div>Created: {new Date(order.createdAt).toLocaleDateString()}</div>
                                {order.expectedDelivery && (
                                  <div>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</div>
                                )}
                                {order.exchangeRate && order.exchangeRate !== 1.0 && order.exchangeRateSource && order.exchangeRateSource !== 'default' && (
                                  <div>Rate source: {order.exchangeRateSource}</div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewOrder(order)}
                                  className="flex-1 py-2 px-3 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                >
                                  View
                                </button>
                                {order.status === 'draft' && (
                                  <button
                                    onClick={() => handleEditOrder(order)}
                                    className="flex-1 py-2 px-3 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                                  >
                                    Edit
                                  </button>
                                )}
                                {order.status === 'sent' && (
                                  <button
                                    onClick={() => handleReceiveOrder(order)}
                                    className="flex-1 py-2 px-3 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                                  >
                                    Receive
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Quick Stats Sidebar - POS Style */}
          <div className="lg:w-[350px] flex-shrink-0">
            <GlassCard className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Quick Stats</h2>
                  <p className="text-sm text-gray-600">Purchase order overview</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-900">{purchaseOrders.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Received</p>
                      <p className="text-2xl font-bold text-green-900">
                        {purchaseOrders.filter(o => o.status === 'received').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Pending</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {purchaseOrders.filter(o => o.status === 'sent').length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Total Value</p>
                      <p className="text-xl font-bold text-orange-900">
                        {formatMoney(
                          purchaseOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
                          SUPPORTED_CURRENCIES[0]
                        )}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3 flex-shrink-0">
                <GlassButton
                  onClick={() => navigate('/lats/purchase-orders/create')}
                  icon={<Plus size={18} />}
                  className="w-full bg-orange-500 text-white"
                >
                  New Purchase Order
                </GlassButton>

                <GlassButton
                  onClick={() => navigate('/lats/purchase-orders/suppliers')}
                  icon={<Users size={18} />}
                  className="w-full bg-blue-500 text-white"
                >
                  Manage Suppliers
                </GlassButton>

                <GlassButton
                  onClick={() => navigate('/lats/purchase-orders/shipped-items')}
                  icon={<Truck size={18} />}
                  className="w-full bg-green-500 text-white"
                >
                  Track Shipments
                </GlassButton>

                <GlassButton
                  onClick={() => navigate('/lats/shipping')}
                  icon={<MapPin size={18} />}
                  className="w-full bg-purple-500 text-white"
                >
                  Shipping Hub
                </GlassButton>

                <GlassButton
                  onClick={() => navigate('/lats/purchase-orders/reports')}
                  icon={<BarChart3 size={18} />}
                  className="w-full bg-purple-500 text-white"
                >
                  View Reports
                </GlassButton>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <GlassButton
                    onClick={() => {/* TODO: Export functionality */}}
                    icon={<Download size={16} />}
                    className="bg-gray-500 text-white text-sm"
                  >
                    Export
                  </GlassButton>
                  <GlassButton
                    onClick={() => {/* TODO: Import functionality */}}
                    icon={<Upload size={16} />}
                    className="bg-gray-500 text-white text-sm"
                  >
                    Import
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POListPage;

