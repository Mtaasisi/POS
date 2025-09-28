import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  X, Search, Filter, SortAsc, Eye, Edit, Trash2, CheckSquare, 
  Send, Truck, Package, AlertCircle, RefreshCw, Clock, FileText,
  XSquare, ShoppingCart, Calendar, User, DollarSign, TrendingUp,
  List, Grid, ChevronDown, ChevronUp, Ship, PackageCheck, MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { PurchaseOrder } from '../../types/inventory';

interface OrderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Enhanced status options including shipping statuses
type OrderStatus = 'draft' | 'sent' | 'confirmed' | 'shipping' | 'shipped' | 'received' | 'cancelled';
type ShippingStatus = 'pending' | 'packed' | 'shipped' | 'in_transit' | 'delivered' | 'returned';

interface EnhancedPurchaseOrder extends PurchaseOrder {
  shippingStatus?: ShippingStatus;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippingNotes?: string;
}

const OrderManagementModal: React.FC<OrderManagementModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  
  // Database state management
  const { 
    purchaseOrders, 
    isLoading, 
    error,
    loadPurchaseOrders,
    deletePurchaseOrder,
    receivePurchaseOrder,
    updatePurchaseOrder
  } = useInventoryStore();

  // Local state for modal functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'orderNumber' | 'totalAmount' | 'expectedDelivery'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editingShipping, setEditingShipping] = useState<string | null>(null);

  // Load purchase orders when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPurchaseOrders();
    }
  }, [isOpen, loadPurchaseOrders]);

  // Enhanced order filtering and sorting
  const filteredOrders = useMemo(() => {
    let filtered = (purchaseOrders || []) as EnhancedPurchaseOrder[];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.currency?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(order => (order.currency || 'TZS') === currencyFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'orderNumber':
          aValue = a.orderNumber;
          bValue = b.orderNumber;
          break;
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case 'expectedDelivery':
          aValue = a.expectedDeliveryDate || '';
          bValue = b.expectedDeliveryDate || '';
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
  }, [purchaseOrders, searchQuery, statusFilter, currencyFilter, sortBy, sortOrder]);

  // Status management functions
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await updatePurchaseOrder(orderId, { status: newStatus });
      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        await loadPurchaseOrders();
      } else {
        toast.error(response.message || 'Failed to update order status');
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const updateShippingInfo = async (orderId: string, shippingData: Partial<EnhancedPurchaseOrder>) => {
    try {
      const response = await updatePurchaseOrder(orderId, shippingData);
      if (response.ok) {
        toast.success('Shipping information updated');
        await loadPurchaseOrders();
        setEditingShipping(null);
      } else {
        toast.error(response.message || 'Failed to update shipping information');
      }
    } catch (error) {
      toast.error('Failed to update shipping information');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      const response = await deletePurchaseOrder(orderId);
      if (response.ok) {
        toast.success('Purchase order deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete purchase order');
      }
    }
  };

  // Utility functions
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'confirmed': return 'text-purple-600 bg-purple-100';
      case 'shipping': return 'text-orange-600 bg-orange-100';
      case 'shipped': return 'text-indigo-600 bg-indigo-100';
      case 'received': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'confirmed': return <CheckSquare className="w-4 h-4" />;
      case 'shipping': return <Package className="w-4 h-4" />;
      case 'shipped': return <Ship className="w-4 h-4" />;
      case 'received': return <PackageCheck className="w-4 h-4" />;
      case 'cancelled': return <XSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getShippingStatusColor = (status: ShippingStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'packed': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-indigo-600 bg-indigo-100';
      case 'in_transit': return 'text-orange-600 bg-orange-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'returned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount).replace('.00', '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-6xl max-h-[90vh] transform transition-all duration-300 scale-100 opacity-100">
        <GlassCard className="h-full flex flex-col shadow-2xl border-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <span className="text-sm text-gray-500">
                  ({filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'})
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all duration-200 group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>

          {/* Filters and Controls */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders, suppliers, tracking, currency..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipping">Shipping</option>
                  <option value="shipped">Shipped</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <option value="all">All Currencies</option>
                  {(() => {
                    const currencies = Array.from(new Set(filteredOrders.map(order => order.currency || 'TZS')));
                    return currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ));
                  })()}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="orderNumber">Order Number</option>
                  <option value="shipping">Shipping</option>
                  <option value="expectedDelivery">Expected Delivery</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <SortAsc className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={loadPurchaseOrders}
                  disabled={isLoading}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {['draft', 'sent', 'confirmed', 'shipping', 'shipped', 'received'].map(status => {
                const count = filteredOrders.filter(order => order.status === status).length;
                return (
                  <div
                    key={status}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
                      statusFilter === status 
                        ? getStatusColor(status as OrderStatus) + ' shadow-lg scale-105' 
                        : 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                    }`}
                    onClick={() => setStatusFilter(statusFilter === status ? 'all' : status as OrderStatus)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium capitalize">{status}</span>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Currency Distribution */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Currency Distribution:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  const currencyStats = filteredOrders.reduce((acc, order) => {
                    const currency = order.currency || 'TZS';
                    if (!acc[currency]) {
                      acc[currency] = { count: 0, total: 0 };
                    }
                    acc[currency].count += 1;
                    acc[currency].total += order.totalAmount;
                    return acc;
                  }, {} as Record<string, { count: number; total: number }>);
                  
                  return Object.entries(currencyStats).map(([currency, stats]) => (
                    <div key={currency} className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="text-xs font-medium text-gray-600">{currency}</div>
                      <div className="text-lg font-bold text-blue-600">{stats.count}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(stats.total)}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Orders Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Loading orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No purchase orders available'
                  }
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusUpdate={updateOrderStatus}
                    onShippingUpdate={updateShippingInfo}
                    onDelete={handleDeleteOrder}
                    isExpanded={expandedOrder === order.id}
                    onToggleExpanded={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    isEditingShipping={editingShipping === order.id}
                    onEditShipping={(orderId) => setEditingShipping(editingShipping === orderId ? null : orderId)}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    getShippingStatusColor={getShippingStatusColor}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer with summary */}
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {filteredOrders.length} of {purchaseOrders?.length || 0} orders
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">
                  Total Value: {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0))}
                </span>
                <span className="text-gray-600">
                  In Transit: {filteredOrders.filter(order => ['shipping', 'shipped'].includes(order.status)).length}
                </span>
              </div>
            </div>
            
            {/* Currency Breakdown */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-2">Currency Breakdown:</div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const currencyGroups = filteredOrders.reduce((acc, order) => {
                    const currency = order.currency || 'TZS';
                    if (!acc[currency]) acc[currency] = 0;
                    acc[currency] += order.totalAmount;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  return Object.entries(currencyGroups).map(([currency, total]) => (
                    <span key={currency} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-blue-700 border border-blue-200">
                      {currency}: {formatCurrency(total)}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// Separate OrderCard component for better organization
interface OrderCardProps {
  order: EnhancedPurchaseOrder;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onShippingUpdate: (orderId: string, shippingData: Partial<EnhancedPurchaseOrder>) => void;
  onDelete: (orderId: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isEditingShipping: boolean;
  onEditShipping: (orderId: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  getStatusColor: (status: OrderStatus) => string;
  getStatusIcon: (status: OrderStatus) => React.ReactNode;
  getShippingStatusColor: (status: ShippingStatus) => string;
  viewMode: 'grid' | 'list';
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  onShippingUpdate,
  onDelete,
  isExpanded,
  onToggleExpanded,
  isEditingShipping,
  onEditShipping,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getShippingStatusColor,
  viewMode
}) => {
  const [tempShippingData, setTempShippingData] = useState({
    trackingNumber: order.trackingNumber || '',
    estimatedDelivery: order.estimatedDelivery || '',
    shippingNotes: order.shippingNotes || '',
    shippingStatus: order.shippingStatus || 'pending'
  });

  // Smart button visibility - only show next available actions
  const getAvailableStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    switch (currentStatus) {
      case 'draft': return ['sent', 'cancelled'];
      case 'sent': return ['confirmed', 'cancelled'];
      case 'confirmed': return ['shipping', 'cancelled'];
      case 'shipping': return ['shipped', 'received', 'cancelled'];
      case 'shipped': return ['received'];
      case 'received': return []; // No further actions needed
      case 'cancelled': return []; // No further actions needed
      default: return [];
    }
  };

  // Get smart action buttons based on proper workflow sequence: Approve → Pay → Receive
  const getSmartActionButtons = (order: EnhancedPurchaseOrder) => {
    const actions = [];
    const currentStatus = order.status as OrderStatus;
    const paymentStatus = (order as any).payment_status || 'unpaid';
    
    // Debug logging
    console.log('🔍 OrderManagementModal: Order data:', {
      id: order.id,
      status: currentStatus,
      payment_status: paymentStatus,
      order: order
    });

    // Always show View Details
    actions.push({
      type: 'view',
      label: 'View',
      icon: <Eye className="w-4 h-4" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => window.open(`/lats/purchase-orders/${order.id}`, '_blank')
    });

    // Workflow sequence: Draft → Approve → Pay → Receive
    switch (currentStatus) {
      case 'draft':
        // Step 1: Draft - Primary actions
        actions.push({
          type: 'edit',
          label: 'Edit',
          icon: <Edit className="w-4 h-4" />,
          color: 'bg-purple-600 hover:bg-purple-700',
          onClick: () => window.open(`/lats/purchase-orders/${order.id}/edit`, '_blank')
        });
        actions.push({
          type: 'approve',
          label: 'Approve',
          icon: <CheckSquare className="w-4 h-4" />,
          color: 'bg-green-600 hover:bg-green-700',
          onClick: () => onStatusUpdate(order.id, 'sent')
        });
        
        // Plan B buttons for Draft
        actions.push({
          type: 'duplicate',
          label: 'Duplicate',
          icon: <FileText className="w-4 h-4" />,
          color: 'bg-blue-600 hover:bg-blue-700',
          onClick: () => window.open(`/lats/purchase-orders/${order.id}?action=duplicate`, '_blank')
        });
        actions.push({
          type: 'print',
          label: 'Print',
          icon: <Printer className="w-4 h-4" />,
          color: 'bg-gray-600 hover:bg-gray-700',
          onClick: () => window.open(`/lats/purchase-orders/${order.id}?action=print`, '_blank')
        });
        actions.push({
          type: 'delete',
          label: 'Delete',
          icon: <Trash2 className="w-4 h-4" />,
          color: 'bg-red-600 hover:bg-red-700',
          onClick: () => onDelete(order.id)
        });
        break;
      
      case 'sent':
        // Step 2: Approved - Must pay before receiving
        // Show payment button if unpaid, partial, or if payment_status is undefined (fallback)
        if (paymentStatus === 'unpaid' || paymentStatus === 'partial' || !paymentStatus) {
          actions.push({
            type: 'pay',
            label: 'Pay',
            icon: <CreditCard className="w-4 h-4" />,
            color: 'bg-orange-600 hover:bg-orange-700',
            onClick: () => window.open(`/lats/purchase-orders/${order.id}?action=pay`, '_blank')
          });
        }
        // Only show receive if fully paid
        if (paymentStatus === 'paid') {
          actions.push({
            type: 'receive',
            label: 'Receive',
            icon: <CheckSquare className="w-4 h-4" />,
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => onStatusUpdate(order.id, 'received')
          });
        }
        break;
      
      case 'confirmed':
        // Step 2.5: Confirmed by supplier - Still need to pay
        if (paymentStatus === 'unpaid' || paymentStatus === 'partial' || !paymentStatus) {
          actions.push({
            type: 'pay',
            label: 'Pay',
            icon: <CreditCard className="w-4 h-4" />,
            color: 'bg-orange-600 hover:bg-orange-700',
            onClick: () => window.open(`/lats/purchase-orders/${order.id}?action=pay`, '_blank')
          });
        }
        // Only show receive if fully paid
        if (paymentStatus === 'paid') {
          actions.push({
            type: 'receive',
            label: 'Receive',
            icon: <CheckSquare className="w-4 h-4" />,
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => onStatusUpdate(order.id, 'received')
          });
        }
        break;
      
      case 'shipping':
        // Step 3: Shipping - Can track and receive if paid
        if (order.trackingNumber) {
          actions.push({
            type: 'track',
            label: 'Track',
            icon: <Truck className="w-4 h-4" />,
            color: 'bg-indigo-600 hover:bg-indigo-700',
            onClick: () => window.open(`https://tracking.com/${order.trackingNumber}`, '_blank')
          });
        }
        // Only show receive if fully paid
        if (paymentStatus === 'paid') {
          actions.push({
            type: 'receive',
            label: 'Receive',
            icon: <CheckSquare className="w-4 h-4" />,
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => onStatusUpdate(order.id, 'received')
          });
        }
        break;
      
      case 'shipped':
        // Step 4: Shipped - Can receive if paid
        if (order.trackingNumber) {
          actions.push({
            type: 'track',
            label: 'Track',
            icon: <Truck className="w-4 h-4" />,
            color: 'bg-indigo-600 hover:bg-indigo-700',
            onClick: () => window.open(`https://tracking.com/${order.trackingNumber}`, '_blank')
          });
        }
        // Only show receive if fully paid
        if (paymentStatus === 'paid') {
          actions.push({
            type: 'receive',
            label: 'Receive',
            icon: <CheckSquare className="w-4 h-4" />,
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => onStatusUpdate(order.id, 'received')
          });
        }
        break;
      
      case 'received':
        // Step 5: Received - Show receipt/invoice
        actions.push({
          type: 'receipt',
          label: 'Receipt',
          icon: <FileText className="w-4 h-4" />,
          color: 'bg-gray-600 hover:bg-gray-700',
          onClick: () => window.open(`/lats/purchase-orders/${order.id}/receipt`, '_blank')
        });
        break;
      
      case 'cancelled':
        // Cancelled - No actions available
        break;
    }

    return actions;
  };

  const availableStatuses = getAvailableStatuses(order.status as OrderStatus);

  return (
    <div className={`border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${
      viewMode === 'list' ? 'p-4' : 'p-5'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
            {order.currency && order.currency !== 'TZS' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                💱 {order.currency}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {order.supplier?.name || 'Unknown Supplier'} • {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getStatusColor(order.status as OrderStatus)}`}>
            {getStatusIcon(order.status as OrderStatus)}
            <span className="capitalize font-semibold">{order.status}</span>
          </div>
          <button
            onClick={onToggleExpanded}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total:</span>
          <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Items:</span>
          <span>{order.items.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Currency:</span>
          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
            {order.currency || 'TZS'}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Shipping Information */}
          {(['shipping', 'shipped', 'received'].includes(order.status)) && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Ship className="w-4 h-4" />
                  Shipping Information
                </h4>
                <button
                  onClick={() => onEditShipping(order.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  {isEditingShipping ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {isEditingShipping ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tracking Number</label>
                      <input
                        type="text"
                        value={tempShippingData.trackingNumber}
                        onChange={(e) => setTempShippingData({...tempShippingData, trackingNumber: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Shipping Status</label>
                      <select
                        value={tempShippingData.shippingStatus}
                        onChange={(e) => setTempShippingData({...tempShippingData, shippingStatus: e.target.value as ShippingStatus})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="returned">Returned</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Delivery</label>
                    <input
                      type="date"
                      value={tempShippingData.estimatedDelivery}
                      onChange={(e) => setTempShippingData({...tempShippingData, estimatedDelivery: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Shipping Notes</label>
                    <textarea
                      value={tempShippingData.shippingNotes}
                      onChange={(e) => setTempShippingData({...tempShippingData, shippingNotes: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      placeholder="Add shipping notes..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <GlassButton
                      onClick={() => onShippingUpdate(order.id, tempShippingData)}
                      size="sm"
                      className="bg-blue-600 text-white"
                    >
                      Save
                    </GlassButton>
                    <GlassButton
                      onClick={() => onEditShipping(order.id)}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </GlassButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {order.shippingStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShippingStatusColor(order.shippingStatus)}`}>
                        {order.shippingStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tracking:</span>
                      <span className="font-mono">{order.trackingNumber}</span>
                    </div>
                  )}
                  {order.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Delivery:</span>
                      <span>{formatDate(order.estimatedDelivery)}</span>
                    </div>
                  )}
                  {order.shippingNotes && (
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-800 mt-1">{order.shippingNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          {isExpanded && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Items ({order.items.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <span className="font-medium">
                        {item.product?.name || `Product ${item.productId}`}
                      </span>
                      {item.variant?.name && item.variant.name !== 'Default Variant' && (
                        <span className="text-gray-500 ml-1">({item.variant.name})</span>
                      )}
                      {item.product?.sku && (
                        <div className="text-xs text-gray-400 font-mono">SKU: {item.product.sku}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div>Qty: {item.quantity}</div>
                      <div className="text-gray-600">{formatCurrency(item.costPrice)}</div>
                      <div className="text-xs text-gray-500">Total: {formatCurrency(item.totalPrice || (item.quantity * item.costPrice))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            {/* Status Update Buttons - Only show next available actions */}
            {availableStatuses.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {availableStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => onStatusUpdate(order.id, status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-md ${getStatusColor(status)}`}
                    title={`Mark as ${status}`}
                  >
                    {getStatusIcon(status)}
                    <span className="ml-1 capitalize font-semibold">{status}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Smart Action Buttons - Only show relevant actions */}
            <div className="flex gap-1 ml-auto">
              {getSmartActionButtons(order).map((action, index) => (
                <button
                  key={`${action.type}-${index}`}
                  onClick={action.onClick}
                  className={`p-2 text-white rounded-lg transition-colors ${action.color}`}
                  title={action.label}
                >
                  {action.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagementModal;