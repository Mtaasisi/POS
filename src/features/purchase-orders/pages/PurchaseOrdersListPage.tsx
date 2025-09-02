// Purchase Orders List Page - Main page for viewing all purchase orders
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import { 
  Package, Search, Plus, Grid, List, Filter, Download, Upload,
  AlertCircle, Edit, Eye, Trash2, DollarSign, TrendingUp, 
  Activity, BarChart3, Settings, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Calendar, FileText, ShoppingCart, Clock, 
  CheckSquare, Send, Truck, Users, Command
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePurchaseOrderStore } from '../stores/usePurchaseOrderStore';
import { useInventoryStore } from '../../lats/stores/useInventoryStore';
import { formatMoney, formatDate, formatPOStatus, getStatusColor, SUPPORTED_CURRENCIES } from '../lib/utils';
import { PurchaseOrder } from '../types';

const PurchaseOrdersListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Purchase Order Store
  const { 
    purchaseOrders,
    isLoading,
    error,
    filters,
    selectedOrders,
    loadPurchaseOrders,
    deletePurchaseOrder,
    receivePurchaseOrder,
    updateFilters,
    toggleOrderSelection,
    selectAllOrders,
    deselectAllOrders,
    getFilteredPurchaseOrders
  } = usePurchaseOrderStore();

  // Inventory store for suppliers
  const { 
    suppliers,
    loadSuppliers
  } = useInventoryStore();

  // Local UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadPurchaseOrders(),
          loadSuppliers()
        ]);
      } catch (error) {
        console.error('Error loading purchase orders data:', error);
      }
    };
    
    loadData();
  }, [loadPurchaseOrders, loadSuppliers]);

  // Filter and paginate purchase orders
  const filteredPOs = getFilteredPurchaseOrders();
  const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);
  const paginatedPOs = filteredPOs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle purchase order actions
  const handleDeletePO = async (id: string) => {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      const result = await deletePurchaseOrder(id);
      if (result.ok) {
        toast.success('Purchase order deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete purchase order');
      }
    }
  };

  const handleReceivePO = async (id: string) => {
    if (confirm('Mark this purchase order as received?')) {
      const result = await receivePurchaseOrder(id);
      if (result.ok) {
        toast.success('Purchase order marked as received');
      } else {
        toast.error(result.message || 'Failed to update purchase order');
      }
    }
  };

  // Handle bulk actions
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    
    if (confirm(`Delete ${selectedOrders.length} selected purchase orders?`)) {
      for (const id of selectedOrders) {
        await deletePurchaseOrder(id);
      }
      deselectAllOrders();
      toast.success('Selected purchase orders deleted');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate('/lats')} />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Purchase Orders</h1>
                  <p className="text-sm text-gray-600">Manage supplier orders and shipments</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/purchase-orders/create')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Order
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-xl font-semibold text-gray-900">{purchaseOrders.length}</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-semibold text-gray-900">
                  {purchaseOrders.filter(po => po.status === 'sent' || po.status === 'approved').length}
                </p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Received</p>
                <p className="text-xl font-semibold text-gray-900">
                  {purchaseOrders.filter(po => po.status === 'received').length}
                </p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatMoney(
                    purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0),
                    SUPPORTED_CURRENCIES[0]
                  )}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters and Controls */}
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search and Filters */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search purchase orders..."
                  value={filters.searchQuery}
                  onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => loadPurchaseOrders()}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.statusFilter}
                    onChange={(e) => updateFilters({ statusFilter: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                  <select
                    value={filters.supplierFilter}
                    onChange={(e) => updateFilters({ supplierFilter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="orderNumber">Order Number</option>
                    <option value="totalAmount">Total Amount</option>
                    <option value="expectedDelivery">Expected Delivery</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedOrders.length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {selectedOrders.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                  <button
                    onClick={deselectAllOrders}
                    className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Purchase Orders List */}
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Loading purchase orders...</span>
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
              <p className="text-gray-600 mb-6">Create your first purchase order to get started</p>
              <GlassButton
                onClick={() => navigate('/purchase-orders/create')}
                icon={<Plus size={20} />}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              >
                Create Purchase Order
              </GlassButton>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === paginatedPOs.length && paginatedPOs.length > 0}
                    onChange={(e) => e.target.checked ? selectAllOrders() : deselectAllOrders()}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <div className="grid grid-cols-6 gap-4 flex-1">
                    <div className="font-medium text-gray-700">Order #</div>
                    <div className="font-medium text-gray-700">Supplier</div>
                    <div className="font-medium text-gray-700">Status</div>
                    <div className="font-medium text-gray-700">Total</div>
                    <div className="font-medium text-gray-700">Expected</div>
                    <div className="font-medium text-gray-700">Actions</div>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {paginatedPOs.map((po) => (
                  <div key={po.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(po.id)}
                        onChange={() => toggleOrderSelection(po.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <div className="grid grid-cols-6 gap-4 flex-1 items-center">
                        <div>
                          <div className="font-medium text-gray-900">{po.orderNumber}</div>
                          <div className="text-sm text-gray-600">{formatDate(po.createdAt)}</div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900">
                            {suppliers.find(s => s.id === po.supplierId)?.name || 'Unknown Supplier'}
                          </div>
                        </div>
                        
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                            {formatPOStatus(po.status)}
                          </span>
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatMoney(po.totalAmount, SUPPORTED_CURRENCIES.find(c => c.code === po.currency) || SUPPORTED_CURRENCIES[0])}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-900">{formatDate(po.expectedDelivery)}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/purchase-orders/${po.id}`)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {po.status !== 'received' && (
                            <button
                              onClick={() => handleReceivePO(po.id)}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                              title="Mark as received"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
                            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeletePO(po.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPOs.length)} of {filteredPOs.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="px-3 py-2 text-sm font-medium text-gray-700">
                        {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </GlassCard>

        {/* Quick Actions */}
        <div className="flex items-center gap-4">
          <GlassButton
            onClick={() => navigate('/purchase-orders/shipped-items')}
            icon={<Truck size={20} />}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
          >
            Manage Shipments
          </GlassButton>
          
          <GlassButton
            onClick={() => navigate('/purchase-orders/suppliers')}
            icon={<Users size={20} />}
            className="bg-gradient-to-r from-purple-500 to-violet-600 text-white"
          >
            Manage Suppliers
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersListPage;