// Shipped Items Management Page - Track and manage purchase order shipments
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';

import {
  Truck, Package, Search, Filter, Eye, Edit, CheckCircle, XCircle,
  AlertTriangle, MapPin, Calendar, Hash, FileText, RefreshCw,
  Plus, Clock, ShoppingBag, TrendingUp, Activity, Settings,
  Download, Upload, Send, Star, DollarSign
} from 'lucide-react';

import { toast } from 'react-hot-toast';
import { usePurchaseOrderStore } from '../stores/usePurchaseOrderStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { 
  formatMoney, 
  formatDate, 
  formatTime, 
  SUPPORTED_CURRENCIES
} from '../lib/utils';
import { ShippedItem, PurchaseOrder } from '../types';

interface ShippedItemWithDetails extends ShippedItem {
  product?: any;
  variant?: any;
  purchaseOrder?: PurchaseOrder;
}

const ShippedItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { purchaseOrderId } = useParams<{ purchaseOrderId?: string }>();

  // Store state
  const {
    purchaseOrders,
    shippedItems,
    isLoading,
    error,
    loadPurchaseOrders,
    loadShippedItems,
    updateShippedItem,
    markItemAsReceived,
    reportDamage
  } = usePurchaseOrderStore();

  const {
    products,
    suppliers,
    loadProducts,
    loadSuppliers
  } = useInventoryStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'shipped' | 'in_transit' | 'delivered' | 'damaged'>('all');
  const [selectedPOFilter, setSelectedPOFilter] = useState<string>(purchaseOrderId || '');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedShippedItem, setSelectedShippedItem] = useState<ShippedItem | null>(null);
  const [receiveData, setReceiveData] = useState({ quantity: 0, notes: '' });
  const [damageReport, setDamageReport] = useState('');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadPurchaseOrders(),
          loadProducts({ page: 1, limit: 100 }),
          loadSuppliers()
        ]);
        
        if (purchaseOrderId) {
          await loadShippedItems(purchaseOrderId);
        }
      } catch (error) {
        console.error('Error loading shipped items data:', error);
      }
    };

    loadData();
  }, [loadPurchaseOrders, loadProducts, loadSuppliers, loadShippedItems, purchaseOrderId]);

  // Create mock shipped items for demonstration (replace with real data)
  const mockShippedItems: ShippedItemWithDetails[] = useMemo(() => {
    return purchaseOrders.flatMap(po => 
      po.items?.map((item, index) => ({
        id: `shipped-${item.id}`,
        purchaseOrderId: po.id,
        purchaseOrderItemId: item.id,
        quantity: item.quantity,
        shippedDate: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        trackingNumber: `TRK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        notes: '',
        status: ['shipped', 'in_transit', 'delivered'][Math.floor(Math.random() * 3)] as any,
        product: products.find(p => p.id === item.productId),
        variant: products.find(p => p.id === item.productId)?.variants?.find(v => v.id === item.variantId),
        purchaseOrder: po
      })) || []
    );
  }, [purchaseOrders, products]);

  // Filter shipped items
  const filteredShippedItems = useMemo(() => {
    let filtered = mockShippedItems;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.product?.name?.toLowerCase().includes(query) ||
        item.variant?.sku?.toLowerCase().includes(query) ||
        item.trackingNumber?.toLowerCase().includes(query) ||
        item.purchaseOrder?.orderNumber.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Purchase order filter
    if (selectedPOFilter) {
      filtered = filtered.filter(item => item.purchaseOrderId === selectedPOFilter);
    }

    return filtered;
  }, [mockShippedItems, searchQuery, statusFilter, selectedPOFilter]);

  // Paginate results
  const totalPages = Math.ceil(filteredShippedItems.length / itemsPerPage);
  const paginatedItems = filteredShippedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle receive item
  const handleReceiveItem = async (item: ShippedItem) => {
    setSelectedShippedItem(item);
    setReceiveData({ quantity: item.quantity, notes: '' });
    setShowReceiveModal(true);
  };

  const handleConfirmReceive = async () => {
    if (!selectedShippedItem) return;

    try {
      await markItemAsReceived(selectedShippedItem.id, receiveData.quantity, receiveData.notes);
      toast.success('Item marked as received successfully');
      setShowReceiveModal(false);
      setSelectedShippedItem(null);
    } catch (error) {
      toast.error('Failed to mark item as received');
    }
  };

  // Handle damage report
  const handleReportDamage = async (item: ShippedItem) => {
    setSelectedShippedItem(item);
    setDamageReport('');
    setShowDamageModal(true);
  };

  const handleConfirmDamage = async () => {
    if (!selectedShippedItem || !damageReport.trim()) return;

    try {
      await reportDamage(selectedShippedItem.id, damageReport);
      toast.success('Damage report submitted successfully');
      setShowDamageModal(false);
      setSelectedShippedItem(null);
    } catch (error) {
      toast.error('Failed to submit damage report');
    }
  };

  // Get status color for shipped items
  const getShippedItemStatusColor = (status: string) => {
    const colorMap = {
      'shipped': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-yellow-100 text-yellow-800',
      'delivered': 'bg-green-100 text-green-800',
      'damaged': 'bg-red-100 text-red-800',
      'lost': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-violet-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate('/lats/purchase-orders')} />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Shipped Items</h1>
                  <p className="text-sm text-gray-600">Track and manage purchase order shipments</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <GlassButton
                onClick={() => navigate('/purchase-orders/create')}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-purple-500 to-violet-600 text-white"
              >
                New Order
              </GlassButton>
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
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Shipments</p>
                <p className="text-xl font-semibold text-gray-900">{filteredShippedItems.length}</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-xl font-semibold text-gray-900">
                  {filteredShippedItems.filter(item => item.status === 'in_transit').length}
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
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-xl font-semibold text-gray-900">
                  {filteredShippedItems.filter(item => item.status === 'delivered').length}
                </p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Issues</p>
                <p className="text-xl font-semibold text-gray-900">
                  {filteredShippedItems.filter(item => item.status === 'damaged').length}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search shipments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="shipped">Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Order</label>
                  <select
                    value={selectedPOFilter}
                    onChange={(e) => setSelectedPOFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Orders</option>
                    {purchaseOrders.map(po => (
                      <option key={po.id} value={po.id}>
                        {po.orderNumber} - {suppliers.find(s => s.id === po.supplierId)?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setSelectedPOFilter('');
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Shipped Items List */}
        <GlassCard className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
              <span className="ml-3 text-gray-600">Loading shipments...</span>
            </div>
          ) : filteredShippedItems.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' || selectedPOFilter 
                  ? 'No shipments match your current filters'
                  : 'No shipments have been created yet'
                }
              </p>
              <GlassButton
                onClick={() => navigate('/purchase-orders/create')}
                icon={<Plus size={20} />}
                className="bg-gradient-to-r from-purple-500 to-violet-600 text-white"
              >
                Create Purchase Order
              </GlassButton>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-8 gap-4">
                  <div className="font-medium text-gray-700">Product</div>
                  <div className="font-medium text-gray-700">PO Number</div>
                  <div className="font-medium text-gray-700">Tracking</div>
                  <div className="font-medium text-gray-700">Quantity</div>
                  <div className="font-medium text-gray-700">Shipped Date</div>
                  <div className="font-medium text-gray-700">Status</div>
                  <div className="font-medium text-gray-700">Progress</div>
                  <div className="font-medium text-gray-700">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {paginatedItems.map((item) => (
                  <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-8 gap-4 items-center">
                      <div>
                        <div className="font-medium text-gray-900">{item.product?.name || 'Unknown Product'}</div>
                        <div className="text-sm text-gray-600">SKU: {item.variant?.sku || 'N/A'}</div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">{item.purchaseOrder?.orderNumber}</div>
                        <div className="text-sm text-gray-600">
                          {suppliers.find(s => s.id === item.purchaseOrder?.supplierId)?.name}
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-mono text-sm text-gray-900">{item.trackingNumber}</div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">{item.quantity}</div>
                        {item.receivedQuantity && (
                          <div className="text-sm text-green-600">Received: {item.receivedQuantity}</div>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-900">{formatDate(item.shippedDate)}</div>
                      </div>
                      
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShippedItemStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.status === 'delivered' ? 'bg-green-500' :
                              item.status === 'in_transit' ? 'bg-yellow-500' :
                              item.status === 'damaged' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}
                            style={{ 
                              width: `${
                                item.status === 'delivered' ? 100 :
                                item.status === 'in_transit' ? 60 :
                                item.status === 'damaged' ? 100 :
                                30
                              }%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/purchase-orders/${item.purchaseOrderId}`)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="View purchase order"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {item.status !== 'delivered' && item.status !== 'damaged' && (
                          <button
                            onClick={() => handleReceiveItem(item)}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            title="Mark as received"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleReportDamage(item)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Report damage"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredShippedItems.length)} of {filteredShippedItems.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        ‹
                      </button>
                      <span className="px-3 py-1 text-sm font-medium text-gray-700">
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>

      {/* Receive Item Modal */}
      {showReceiveModal && selectedShippedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark Item as Received</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                  <p className="text-gray-900">{selectedShippedItem.product?.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Received</label>
                  <input
                    type="number"
                    max={selectedShippedItem.quantity}
                    min={0}
                    value={receiveData.quantity}
                    onChange={(e) => setReceiveData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Expected: {selectedShippedItem.quantity}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={receiveData.notes}
                    onChange={(e) => setReceiveData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any notes about the received items..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <GlassButton
                  onClick={handleConfirmReceive}
                  icon={<CheckCircle size={18} />}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                >
                  Confirm Received
                </GlassButton>
                <GlassButton
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Damage Report Modal */}
      {showDamageModal && selectedShippedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Report Damage
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                  <p className="text-gray-900">{selectedShippedItem.product?.name}</p>
                  <p className="text-sm text-gray-600">Tracking: {selectedShippedItem.trackingNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Damage Report</label>
                  <textarea
                    value={damageReport}
                    onChange={(e) => setDamageReport(e.target.value)}
                    placeholder="Describe the damage or issue with the shipment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows={4}
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <GlassButton
                  onClick={handleConfirmDamage}
                  icon={<AlertTriangle size={18} />}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white"
                  disabled={!damageReport.trim()}
                >
                  Submit Report
                </GlassButton>
                <GlassButton
                  onClick={() => setShowDamageModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ShippedItemsPage;
