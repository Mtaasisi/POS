import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Package, Search, Plus, RefreshCw,
  AlertCircle, Edit, Eye, Trash2, DollarSign, FileText, 
  Clock, CheckSquare, XSquare, Send, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';
import { useDialog } from '../../shared/hooks/useDialog';

const PurchaseOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useDialog();
  
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Enhanced load function with timestamp
  const handleLoadPurchaseOrders = async () => {
    try {
      await loadPurchaseOrders();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  // Load purchase orders on component mount and set up auto-refresh
  useEffect(() => {
    // Initial load
    handleLoadPurchaseOrders();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      handleLoadPurchaseOrders();
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Show success message when orders are loaded
  useEffect(() => {
    if (purchaseOrders && purchaseOrders.length > 0 && !isLoading) {
      console.log('🔍 [PurchaseOrdersPage] Purchase orders data:', purchaseOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        currency: order.currency,
        exchangeRate: order.exchangeRate,
        totalAmountBaseCurrency: order.totalAmountBaseCurrency,
        itemsCount: order.items?.length || 0,
        items: order.items?.map(item => ({
          id: item.id,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalPrice: item.totalPrice,
          productName: item.product?.name,
          variantName: item.variant?.name
        })),
        supplier: order.supplier ? {
          id: order.supplier.id,
          name: order.supplier.name,
          country: order.supplier.country
        } : null
      })));
      
      // Show success message for initial load
      if (purchaseOrders.length > 0) {
        toast.success(`Loaded ${purchaseOrders.length} purchase orders`, {
          duration: 2000,
          position: 'top-right'
        });
      }
    }
  }, [purchaseOrders, isLoading]);

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
    const confirmed = await confirm('Are you sure you want to delete this purchase order?');
    if (confirmed) {
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
    if (!amount || amount === 0) return 'TSh 0';
    
    // Handle different currencies
    if (currencyCode === 'TZS' || !currencyCode) {
      return `TSh ${amount.toLocaleString()}`;
    }
    
    try {
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    } catch (error) {
      // Fallback for unsupported currencies
      return `${currencyCode} ${amount.toLocaleString()}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Smart action buttons - enforce proper workflow: Approve → Pay → Receive
  const getSmartActionButtons = (order: any) => {
    const actions = [];
    const paymentStatus = order.payment_status || 'unpaid';
    
    // Always show View Details
    actions.push({
      type: 'view',
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => navigate(`/lats/purchase-orders/${order.id}`)
    });

    // Workflow sequence: Draft → Approve → Pay → Receive
    switch (order.status) {
      case 'draft':
        // Step 1: Draft - Can edit, approve, or delete
        actions.push({
          type: 'edit',
          label: 'Edit Order',
          icon: <Edit className="w-4 h-4" />,
          color: 'bg-gray-600 hover:bg-gray-700',
          onClick: () => navigate(`/lats/purchase-orders/${order.id}/edit`)
        });
        actions.push({
          type: 'approve',
          label: 'Approve',
          icon: <CheckSquare className="w-4 h-4" />,
          color: 'bg-green-600 hover:bg-green-700',
          onClick: () => handleApproveOrder(order.id)
        });
        actions.push({
          type: 'delete',
          label: 'Delete Order',
          icon: <Trash2 className="w-4 h-4" />,
          color: 'bg-red-600 hover:bg-red-700',
          onClick: () => handleDeleteOrder(order.id)
        });
        break;
      
      case 'sent':
      case 'confirmed':
        // Step 2: Approved - Must pay before receiving
        if (paymentStatus === 'unpaid' || paymentStatus === 'partial') {
          actions.push({
            type: 'pay',
            label: 'Pay',
            icon: <CreditCard className="w-4 h-4" />,
            color: 'bg-orange-600 hover:bg-orange-700',
            onClick: () => navigate(`/lats/purchase-orders/${order.id}?action=pay`)
          });
        }
        // Only show receive if fully paid
        if (paymentStatus === 'paid') {
          actions.push({
            type: 'receive',
            label: 'Receive',
            icon: <CheckSquare className="w-4 h-4" />,
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => handleReceiveOrder(order.id)
          });
        }
        break;
      
      case 'shipping':
      case 'shipped':
        // Step 3-4: Shipping/Shipped - Can receive if paid
        if (paymentStatus === 'paid') {
          actions.push({
            type: 'receive',
            label: 'Receive',
            icon: <CheckSquare className="w-4 h-4" />,
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => handleReceiveOrder(order.id)
          });
        }
        break;
      
      case 'received':
        // Step 5: Received - No additional actions needed
        break;
      
      case 'cancelled':
        // Cancelled - No additional actions needed
        break;
    }

    return actions;
  };

  // Add approve order handler
  const handleApproveOrder = async (orderId: string) => {
    const response = await updatePurchaseOrderStatus(orderId, 'sent');
    if (response.ok) {
      toast.success('Purchase order approved successfully');
    } else {
      toast.error(response.message || 'Failed to approve purchase order');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Minimal Header - Matching PurchaseOrderDetailPage style */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
          <div className="px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title Section */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Purchase Orders
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Manage your purchase orders and inventory
                      <span className="ml-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Auto-refresh enabled
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Quick Stats - Minimal Style */}
                {filteredOrders.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                      <div className="text-2xl font-bold text-blue-900">{filteredOrders.length}</div>
                      <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Orders</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                      <div className="text-2xl font-bold text-green-900">
                        TSh {filteredOrders.reduce((sum, order) => {
                          // Use totalAmount if available
                          if (order.totalAmount && order.totalAmount > 0) {
                            return sum + order.totalAmount;
                          }
                          
                          // Calculate from items
                          if (order.items && order.items.length > 0) {
                            const totalFromItems = order.items.reduce((itemSum, item) => {
                              return itemSum + (item.totalPrice || (item.quantity * item.costPrice));
                            }, 0);
                            return sum + totalFromItems;
                          }
                          
                          return sum;
                        }, 0).toLocaleString()}
                      </div>
                      <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Total Value</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                      <div className="text-2xl font-bold text-orange-900">{filteredOrders.filter(order => order.status === 'draft' || order.status === 'sent' || order.status === 'partial_received').length}</div>
                      <div className="text-xs font-medium text-orange-700 uppercase tracking-wide">Pending</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                      <div className="text-2xl font-bold text-purple-900">{filteredOrders.filter(order => order.status === 'received').length}</div>
                      <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">Completed</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons - Minimal Style */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/lats/purchase-order/create')}
                  className="flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create PO</span>
                </button>
                
                <button
                  onClick={() => navigate('/lats/purchase-order/create')}
                  className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <FileText className="w-5 h-5" />
                  <span>Form PO</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters - Minimal Style */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
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

              {/* Refresh Button */}
              <button
                onClick={handleLoadPurchaseOrders}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl text-gray-700 hover:text-gray-900 hover:bg-white/80 transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              {/* Last Updated Timestamp */}
              {lastUpdated && (
                <div className="text-xs text-gray-500 bg-gray-100/50 px-3 py-2 rounded-xl">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-3xl p-6 mb-8 shadow-xl">
            <div className="flex items-center gap-3 text-red-700">
              <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Error</h4>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Orders List - Minimal Style */}
        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12">
            <div className="flex items-center justify-center">
              <div className="relative">
                <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-blue-200 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="ml-4 text-gray-600 text-lg font-medium">Loading purchase orders...</span>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-12 text-center">
            <div className="relative inline-block mb-6">
              <Package className="w-20 h-20 text-gray-300" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <Search className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No purchase orders found</h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'Get started by creating your first purchase order'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => navigate('/lats/purchase-order/create')}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5" />
                  <span>Create Purchase Order</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Table Header - Minimal Style */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                <div className="col-span-3">Order Details</div>
                <div className="col-span-2">Supplier</div>
                <div className="col-span-2">Financial</div>
                <div className="col-span-2">Status & Items</div>
                <div className="col-span-2">Created Date</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>
            </div>

            {/* Table Body - Minimal Style */}
            <div className="divide-y divide-gray-100">
              {filteredOrders.map((order, index) => (
                <div key={order.id} className="group hover:bg-gray-50 transition-colors duration-200">
                  <div className="grid grid-cols-12 gap-4 items-center px-6 py-6">
                    {/* Order Details */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {order.paymentTerms || 'Net 30'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Supplier */}
                    <div className="col-span-2">
                      {order.supplier ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {order.supplier.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{order.supplier.name}</p>
                            <p className="text-xs text-gray-500">{order.supplier.country || 'Tanzania'}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No supplier</span>
                      )}
                    </div>

                    {/* Financial */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-gray-900">
                            {(() => {
                              // Use totalAmount if available
                              if (order.totalAmount && order.totalAmount > 0) {
                                return formatCurrency(order.totalAmount, order.currency);
                              }
                              
                              // Calculate from items totalPrice if available
                              if (order.items && order.items.length > 0) {
                                const totalFromItems = order.items.reduce((sum, item) => {
                                  // Use totalPrice if available, otherwise calculate from quantity * costPrice
                                  const itemTotal = item.totalPrice || (item.quantity * item.costPrice);
                                  return sum + itemTotal;
                                }, 0);
                                
                                if (totalFromItems > 0) {
                                  return formatCurrency(totalFromItems, order.currency);
                                }
                              }
                              
                              return 'TSh 0';
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {order.currency || 'TZS'}
                          </span>
                          {order.exchangeRate && order.exchangeRate !== 1.0 && order.totalAmountBaseCurrency && (
                            <span className="text-xs text-blue-600">
                              TZS {order.totalAmountBaseCurrency.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Items */}
                    <div className="col-span-2">
                      <div className="space-y-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-2xl text-sm font-semibold shadow-lg ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Package className="w-4 h-4" />
                          <span>{order.items.length} items</span>
                        </div>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Smart Actions - Only show relevant actions */}
                    <div className="col-span-1">
                      <div className="flex items-center justify-center gap-1">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Summary - Minimal Style */}
        {filteredOrders.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Showing {filteredOrders.length} of {purchaseOrders?.length || 0} purchase orders
                  </h3>
                  <p className="text-sm text-gray-600">Filtered results</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    TSh {filteredOrders.reduce((sum, order) => {
                      // Use totalAmount if available
                      if (order.totalAmount && order.totalAmount > 0) {
                        return sum + order.totalAmount;
                      }
                      
                      // Calculate from items
                      if (order.items && order.items.length > 0) {
                        const totalFromItems = order.items.reduce((itemSum, item) => {
                          return itemSum + (item.totalPrice || (item.quantity * item.costPrice));
                        }, 0);
                        return sum + totalFromItems;
                      }
                      
                      return sum;
                    }, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredOrders.reduce((sum, order) => sum + order.items.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
