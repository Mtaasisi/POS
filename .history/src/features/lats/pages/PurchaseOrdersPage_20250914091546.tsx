import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Package, Search, Plus, Grid, List, Filter, SortAsc, Download, Upload,
  AlertCircle, Edit, Eye, Trash2, Star, Tag, DollarSign, TrendingUp, 
  Activity, BarChart3, Settings, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Users, Crown, Calendar, RotateCcw, RefreshCw as RefreshCwIcon,
  FileText, ShoppingCart, Clock, CheckSquare, XSquare, Send, Truck, Ship, PackageCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';
import OrderManagementModal from '../components/purchase-order/OrderManagementModal';

const PurchaseOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Database state management
  const { 
    purchaseOrders, 
    isLoading, 
    error,
    loadPurchaseOrders,
    deletePurchaseOrder,
    receivePurchaseOrder,
    updatePurchaseOrderShipping,
    shippingAgents,
    loadShippingAgents
  } = useInventoryStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'confirmed' | 'shipping' | 'shipped' | 'received' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'orderNumber' | 'totalAmount' | 'expectedDelivery'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOrderManagementModal, setShowOrderManagementModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<PurchaseOrder | null>(null);

  // Load purchase orders and shipping data on component mount
  useEffect(() => {
    loadPurchaseOrders();
    loadShippingAgents();
  }, []);

  // Test function to verify complete workflow
  const testPurchaseOrderWorkflow = async () => {
    try {
      console.log('🧪 TESTING: Complete Purchase Order Workflow from UI');
      
      // Test 1: Check current data in store
      console.log('📊 Current purchase orders in store:', purchaseOrders);
      console.log('📊 Current loading state:', isLoading);
      console.log('📊 Current error state:', error);
      
      // Test 2: Reload data
      console.log('🔄 Reloading purchase orders...');
      await loadPurchaseOrders();
      
      // Test 3: Check updated data
      console.log('📊 Updated purchase orders in store:', purchaseOrders);
      
    } catch (error) {
      console.error('❌ Error in workflow test:', error);
    }
  };

  // Filter and sort purchase orders
  const filteredOrders = useMemo(() => {
    let filtered = purchaseOrders || [];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
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
          aValue = a.expectedDelivery || '';
          bValue = b.expectedDelivery || '';
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
  }, [purchaseOrders, searchQuery, statusFilter, sortBy, sortOrder]);

  // Handle order actions
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

  const handleReceiveOrder = async (orderId: string) => {
    const response = await receivePurchaseOrder(orderId);
    if (response.ok) {
      toast.success('Purchase order received successfully');
    } else {
      toast.error(response.message || 'Failed to receive purchase order');
    }
  };

  const handleAssignShipping = (order: PurchaseOrder) => {
    setSelectedOrderForShipping(order);
    setShowShippingModal(true);
  };

  const handleShippingAssigned = async (shippingData: any) => {
    if (!selectedOrderForShipping) return;
    
    try {
      // Update the purchase order with shipping information
      const response = await updatePurchaseOrderShipping(selectedOrderForShipping.id, shippingData);
      if (response.success) {
        toast.success('Shipping assigned successfully');
        setShowShippingModal(false);
        setSelectedOrderForShipping(null);
        // Reload purchase orders to reflect the changes
        loadPurchaseOrders();
      } else {
        toast.error(response.message || 'Failed to assign shipping');
      }
    } catch (error) {
      console.error('Error assigning shipping:', error);
      toast.error('Failed to assign shipping');
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'confirmed': return <CheckSquare className="w-4 h-4" />;
      case 'shipping': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'received': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number, currencyCode: string = 'TZS') => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <div className="container mx-auto px-4 py-6">
        <LATSBreadcrumb 
          items={[
            { label: 'LATS', href: '/lats' },
            { label: 'Purchase Orders', href: '/lats/purchase-orders' }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
            <p className="text-gray-600">Manage your purchase orders and inventory</p>
          </div>
          
          {/* Test Button */}
          <button
            onClick={testPurchaseOrderWorkflow}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            🧪 Test Workflow
          </button>
          
          <div className="flex gap-2 flex-wrap">
            <GlassButton
              onClick={() => setShowOrderManagementModal(true)}
              icon={<ShoppingCart size={18} />}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold"
            >
              Manage Orders
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/lats/purchase-order/create')}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold"
            >
              Interactive PO
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/lats/purchase-order/create')}
              icon={<FileText size={18} />}
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              Form-based PO
            </GlassButton>
          </div>
        </div>

        {/* Filters and Search */}
        <GlassCard className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search purchase orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Date Created</option>
              <option value="orderNumber">Order Number</option>
              <option value="totalAmount">Total Amount</option>
              <option value="expectedDelivery">Expected Delivery</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <SortAsc className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>

            {/* View Mode */}
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

            {/* Refresh */}
            <button
              onClick={loadPurchaseOrders}
              disabled={isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <GlassCard className="mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </GlassCard>
        )}

        {/* Purchase Orders List */}
        {isLoading ? (
          <GlassCard className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading purchase orders...</span>
            </div>
          </GlassCard>
        ) : filteredOrders.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first purchase order'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <GlassButton onClick={() => navigate('/lats/purchase-orders/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Purchase Order
              </GlassButton>
            )}
          </GlassCard>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredOrders.map((order) => (
              <GlassCard key={order.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500">Created {formatDate(order.createdAt)}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">{formatCurrency(order.totalAmount, order.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Currency:</span>
                      <span className="font-medium">{order.currency || 'TZS'}</span>
                    </div>
                    {order.paymentTerms && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Terms:</span>
                        <span>{order.paymentTerms}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{order.items.length} items</span>
                    </div>
                    {order.expectedDelivery && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Delivery:</span>
                        <span>{formatDate(order.expectedDelivery)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <GlassButton
                      onClick={() => navigate(`/lats/purchase-orders/${order.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </GlassButton>
                    
                    {order.status === 'draft' && (
                      <GlassButton
                        onClick={() => navigate(`/lats/purchase-orders/${order.id}/edit`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </GlassButton>
                    )}
                    
                    {order.status === 'sent' && (
                      <GlassButton
                        onClick={() => handleReceiveOrder(order.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <CheckSquare className="w-4 h-4 mr-1" />
                        Receive
                      </GlassButton>
                    )}
                    
                    {(order.status === 'draft' || order.status === 'sent' || order.status === 'confirmed') && (
                      <GlassButton
                        onClick={() => handleAssignShipping(order)}
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Ship
                      </GlassButton>
                    )}
                    
                    {(order.status === 'shipping' || order.status === 'shipped' || order.status === 'received') && (
                      <GlassButton
                        onClick={() => navigate(`/lats/purchase-orders/${order.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                      >
                        <Ship className="w-4 h-4 mr-1" />
                        Track
                      </GlassButton>
                    )}
                    
                    {order.status === 'draft' && (
                      <GlassButton
                        onClick={() => handleDeleteOrder(order.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </GlassButton>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <GlassCard className="mt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Showing {filteredOrders.length} of {purchaseOrders?.length || 0} purchase orders
              </span>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">
                  Total Value: {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0))}
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Order Management Modal */}
        <OrderManagementModal
          isOpen={showOrderManagementModal}
          onClose={() => setShowOrderManagementModal(false)}
        />

        {/* Shipping Assignment Modal */}
        {selectedOrderForShipping && (
          <ShippingAssignmentModal
            isOpen={showShippingModal}
            onClose={() => {
              setShowShippingModal(false);
              setSelectedOrderForShipping(null);
            }}
            purchaseOrder={selectedOrderForShipping}
            agents={shippingAgents || []}
            settings={{
              defaultAgentId: '',
              defaultShippingCost: 0,
              maxShippingCost: 100000,
              requireSignature: false,
              enableInsurance: false,
              autoAssignAgents: false
            }}
            onAssignShipping={handleShippingAssigned}
          />
        )}
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
