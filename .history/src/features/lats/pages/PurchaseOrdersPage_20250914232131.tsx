import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Package, Search, Plus, Grid, List, Filter, SortAsc, RefreshCw,
  AlertCircle, Edit, Eye, Trash2, DollarSign, FileText, ShoppingCart, 
  Clock, CheckSquare, XSquare, Send, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';

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
  } = useInventoryStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'confirmed' | 'partial_received' | 'received' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'orderNumber' | 'totalAmount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Load purchase orders on component mount
  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Filter and sort purchase orders
  const filteredOrders = useMemo(() => {
    let filtered = purchaseOrders || [];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'confirmed': return 'text-purple-600 bg-purple-100';
      case 'partial_received': return 'text-orange-600 bg-orange-100';
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
      case 'partial_received': return <Clock className="w-4 h-4" />;
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
    <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header with Glass Effect */}
        <div className="relative overflow-hidden bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/30 to-transparent opacity-60 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-100/30 to-transparent opacity-60 rounded-full translate-y-36 -translate-x-36"></div>
          
          <div className="relative px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title Section */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Purchase Orders
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your purchase orders and inventory</p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                {filteredOrders.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                      <div className="text-2xl font-bold text-blue-600">{filteredOrders.length}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                      <div className="text-2xl font-bold text-green-600">TSh {filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Value</div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                      <div className="text-2xl font-bold text-orange-600">{filteredOrders.filter(order => order.status === 'draft' || order.status === 'sent' || order.status === 'partial_received').length}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                      <div className="text-2xl font-bold text-purple-600">{filteredOrders.filter(order => order.status === 'received').length}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/lats/purchase-order/create')}
                  className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Interactive PO</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={() => navigate('/lats/purchase-order/create')}
                  className="px-6 py-3 bg-white/80 backdrop-blur-sm text-purple-600 rounded-2xl font-semibold border border-purple-200 hover:bg-purple-50 transition-all duration-300 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span>Form PO</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/30 p-6 mb-8">
          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search orders, suppliers, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 text-gray-700 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="appearance-none bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-4 py-3 pr-10 text-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="partial_received">Partial Received</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl px-4 py-3 pr-10 text-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all duration-300 cursor-pointer"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="orderNumber">Order Number</option>
                  <option value="totalAmount">Total Amount</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* View Controls */}
              <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'list' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'grid' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={loadPurchaseOrders}
                  disabled={isLoading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Purchase Orders List */}
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading purchase orders...</span>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first purchase order'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <GlassButton onClick={() => navigate('/lats/purchase-order/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Purchase Order
              </GlassButton>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">Created {formatDate(order.createdAt)}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Total Amount:</span>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(order.totalAmount, order.currency)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Currency:</span>
                    <p className="text-sm font-medium text-gray-900">{order.currency || 'TZS'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Payment Terms:</span>
                    <p className="text-sm font-medium text-gray-900">{order.paymentTerms || 'Net 30'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Items:</span>
                    <p className="text-sm font-medium text-gray-900">{order.items.length} items</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/lats/purchase-orders/${order.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  
                  {order.status === 'draft' && (
                    <>
                      <button
                        onClick={() => navigate(`/lats/purchase-orders/${order.id}/edit`)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mt-6 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                Showing {filteredOrders.length} of {purchaseOrders?.length || 0} purchase orders
              </span>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">
                  Total Value: TSh {filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
