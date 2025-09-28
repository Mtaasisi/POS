import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Package, Edit, Save, X, AlertCircle, 
  FileText, ShoppingCart, Clock, CheckSquare, XSquare, Send,
  DollarSign, Calendar, Printer, Download, ArrowLeft, ArrowRight,
  Ship, PackageCheck, Building, Phone, Mail, MapPin, Star, 
  TrendingUp, BarChart3, Target, Calculator, Banknote, Receipt,
  Copy, Share2, Archive, History, Store, Info, Plus, Minus,
  RotateCcw, Shield, Percent, Layers, QrCode, Eye, MessageSquare,
  FileImage, Upload, CheckCircle2, AlertTriangle, ThumbsUp,
  ThumbsDown, ExternalLink, Zap, Users, CreditCard, Calendar as CalendarIcon,
  Hash, Tag, Scale, Hand, Fingerprint, Radio, XCircle, HardDrive,
  Cpu, Palette, Ruler, Unplug, Battery, Monitor, Camera, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';
import { PurchaseOrderService } from '../services/purchaseOrderService';

// Import new inventory components
import InventoryItemActions from '../components/inventory/InventoryItemActions';
import StatusUpdateModal from '../components/inventory/StatusUpdateModal';
import LocationAssignmentModal from '../components/inventory/LocationAssignmentModal';
import ItemDetailsModal from '../components/inventory/ItemDetailsModal';
import ItemHistoryModal from '../components/inventory/ItemHistoryModal';
import BulkActionsToolbar from '../components/inventory/BulkActionsToolbar';
import InventorySearchFilters from '../components/inventory/InventorySearchFilters';

interface PurchaseOrderDetailPageProps {
  editMode?: boolean;
}

const EnhancedPurchaseOrderDetailPage: React.FC<PurchaseOrderDetailPageProps> = ({ editMode = false }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Database state management
  const { 
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder,
    approvePurchaseOrder,
    isLoading,
    error,
  } = useInventoryStore();

  // Local state
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<any[]>([]);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [filteredReceivedItems, setFilteredReceivedItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingReceivedItems, setIsLoadingReceivedItems] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'received' | 'payments' | 'messages'>('items');
  const [isEditing, setIsEditing] = useState(editMode);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);

  // Enhanced inventory management state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [inventoryStats, setInventoryStats] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    location: '',
    dateFrom: '',
    dateTo: ''
  });

  // Load purchase order data
  const loadPurchaseOrder = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoadingItems(true);
      const response = await PurchaseOrderService.getPurchaseOrderItemsWithProducts(id);
      
      if (response.success && response.data) {
        setPurchaseOrderItems(response.data);
        
        // Extract purchase order from first item
        if (response.data.length > 0) {
          setPurchaseOrder(response.data[0].purchaseOrder);
        }
      }
    } catch (error) {
      console.error('Failed to load purchase order:', error);
      toast.error('Failed to load purchase order');
    } finally {
      setIsLoadingItems(false);
    }
  }, [id]);

  // Load received items
  const loadReceivedItems = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoadingReceivedItems(true);
      const response = await PurchaseOrderService.getReceivedItems(id);
      
      if (response.success && response.data) {
        setReceivedItems(response.data);
        setFilteredReceivedItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load received items:', error);
      toast.error('Failed to load received items');
    } finally {
      setIsLoadingReceivedItems(false);
    }
  }, [id]);

  // Load inventory stats
  const loadInventoryStats = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await PurchaseOrderService.getPurchaseOrderInventoryStats(id);
      if (response.success && response.data) {
        setInventoryStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load inventory stats:', error);
    }
  }, [id]);

  // Apply filters to received items
  useEffect(() => {
    let filtered = receivedItems;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.serial_number?.toLowerCase().includes(searchLower) ||
        item.imei?.toLowerCase().includes(searchLower) ||
        item.product?.name?.toLowerCase().includes(searchLower) ||
        item.product?.sku?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(item => 
        new Date(item.created_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(item => 
        new Date(item.created_at) <= new Date(filters.dateTo)
      );
    }

    setFilteredReceivedItems(filtered);
  }, [receivedItems, filters]);

  // Initial load
  useEffect(() => {
    loadPurchaseOrder();
    loadReceivedItems();
    loadInventoryStats();
  }, [loadPurchaseOrder, loadReceivedItems, loadInventoryStats]);

  // Handle status update
  const handleStatusUpdate = async (itemId: string, newStatus: string, reason?: string) => {
    try {
      const response = await PurchaseOrderService.updateInventoryItemStatus(
        itemId, newStatus, reason
      );
      
      if (response.success) {
        toast.success('Status updated successfully');
        loadReceivedItems();
        loadInventoryStats();
        setShowStatusModal(false);
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle location update
  const handleLocationUpdate = async (itemId: string, location: string, shelf?: string, bin?: string) => {
    try {
      const response = await PurchaseOrderService.updateInventoryItemStatus(
        itemId, undefined, undefined, location, shelf, bin
      );
      
      if (response.success) {
        toast.success('Location updated successfully');
        loadReceivedItems();
        setShowLocationModal(false);
      } else {
        toast.error(response.error || 'Failed to update location');
      }
    } catch (error) {
      console.error('Location update failed:', error);
      toast.error('Failed to update location');
    }
  };

  // Handle export
  const handleExport = async (exportFilters?: any) => {
    if (!id) return;
    
    try {
      const response = await PurchaseOrderService.exportInventoryToCSV(id, exportFilters || filters);
      
      if (response.success && response.data) {
        // Create and download CSV file
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Export completed successfully');
      } else {
        toast.error(response.error || 'Failed to export data');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  // Handle item actions
  const handleEditStatus = (item: any) => {
    setCurrentItem(item);
    setShowStatusModal(true);
  };

  const handleEditLocation = (item: any) => {
    setCurrentItem(item);
    setShowLocationModal(true);
  };

  const handleViewDetails = (item: any) => {
    setCurrentItem(item);
    setShowDetailsModal(true);
  };

  const handleViewHistory = (item: any) => {
    setCurrentItem(item);
    setShowHistoryModal(true);
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    }
    return `TZS ${amount.toLocaleString()}`;
  };

  if (!purchaseOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <LATSBreadcrumb 
          items={[
            { label: 'Purchase Orders', href: '/lats/purchase-orders' },
            { label: `PO-${purchaseOrder.po_number}`, href: '#' }
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => navigate('/lats/purchase-orders')} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Purchase Order {purchaseOrder.po_number}
              </h1>
              <p className="text-gray-600">
                {purchaseOrder.supplier?.name} • {purchaseOrder.status}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <GlassButton
              onClick={() => setShowReceiveModal(true)}
              variant="primary"
              size="sm"
            >
              <PackageCheck size={16} />
              Receive Items
            </GlassButton>
            
            <GlassButton
              onClick={() => setShowPaymentsModal(true)}
              variant="secondary"
              size="sm"
            >
              <CreditCard size={16} />
              Payments
            </GlassButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'items', label: 'Order Items', icon: Package },
                { id: 'received', label: 'Received Items', icon: PackageCheck },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'messages', label: 'Messages', icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'received' && receivedItems.length > 0 && (
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                        {receivedItems.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Order Items Tab */}
            {activeTab === 'items' && (
              <div className="space-y-6">
                {isLoadingItems ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading order items...</p>
                    </div>
                  </div>
                ) : purchaseOrderItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No items found</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left p-3 font-medium text-gray-700">Product</th>
                            <th className="text-left p-3 font-medium text-gray-700 hidden sm:table-cell">Variant</th>
                            <th className="text-left p-3 font-medium text-gray-700">Quantity</th>
                            <th className="text-left p-3 font-medium text-gray-700 hidden md:table-cell">Cost Price</th>
                            <th className="text-left p-3 font-medium text-gray-700">Total</th>
                            <th className="text-left p-3 font-medium text-gray-700">TZS Total</th>
                            <th className="text-left p-3 font-medium text-gray-700">Received</th>
                            <th className="text-left p-3 font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseOrderItems.map((item, index) => {
                            const receivedPercentage = item.quantity > 0 ? (item.receivedQuantity / item.quantity) * 100 : 0;
                            return (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium text-sm text-gray-900">{item.product?.name || `Product ${item.productId}`}</p>
                                    <p className="text-xs text-gray-500 sm:hidden">{item.variant?.name || `Variant ${item.variantId}`}</p>
                                    <p className="text-xs text-gray-500">SKU: {item.product?.sku || item.productId}</p>
                                  </div>
                                </td>
                                <td className="p-3 text-sm hidden sm:table-cell">{item.variant?.name || `Variant ${item.variantId}`}</td>
                                <td className="p-3">
                                  <span className="font-medium text-sm text-gray-900">{item.quantity}</span>
                                </td>
                                <td className="p-3 text-sm hidden md:table-cell">{formatCurrency(item.costPrice, purchaseOrder.currency)}</td>
                                <td className="p-3">
                                  <span className="font-medium text-sm text-gray-900">{formatCurrency(item.quantity * item.costPrice, purchaseOrder.currency)}</span>
                                </td>
                                <td className="p-3">
                                  <span className="font-medium text-sm text-gray-900">{formatCurrency(item.quantity * item.costPrice, 'TZS')}</span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-900">{item.receivedQuantity}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(receivedPercentage, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    receivedPercentage === 100 ? 'bg-green-100 text-green-700' :
                                    receivedPercentage > 0 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {receivedPercentage === 100 ? 'Complete' : 
                                     receivedPercentage > 0 ? 'Partial' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Received Items Tab */}
            {activeTab === 'received' && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <InventorySearchFilters
                  onFiltersChange={setFilters}
                  isLoading={isLoadingReceivedItems}
                />

                {/* Bulk Actions */}
                <BulkActionsToolbar
                  items={filteredReceivedItems}
                  selectedItems={selectedItems}
                  onSelectionChange={setSelectedItems}
                  onItemsUpdate={loadReceivedItems}
                  onExport={handleExport}
                  purchaseOrderId={id || ''}
                />

                {/* Inventory Stats */}
                {inventoryStats.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {inventoryStats.map((stat, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className={`text-2xl font-bold ${
                          stat.status === 'available' ? 'text-green-600' :
                          stat.status === 'sold' ? 'text-blue-600' :
                          stat.status === 'damaged' ? 'text-red-600' :
                          stat.status === 'reserved' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {stat.count}
                        </div>
                        <div className="text-sm text-gray-500 uppercase tracking-wide">{stat.status}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatCurrency(stat.total_value)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Received Items Table */}
                {isLoadingReceivedItems ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading received items...</p>
                    </div>
                  </div>
                ) : filteredReceivedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <PackageCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No received items found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {receivedItems.length === 0 
                        ? 'Items will appear here once they are received and added to inventory'
                        : 'No items match your current filters'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left p-3 font-medium text-gray-700">Product</th>
                            <th className="text-left p-3 font-medium text-gray-700 hidden sm:table-cell">Variant</th>
                            <th className="text-left p-3 font-medium text-gray-700">Serial Number</th>
                            <th className="text-left p-3 font-medium text-gray-700 hidden md:table-cell">IMEI</th>
                            <th className="text-left p-3 font-medium text-gray-700">Status</th>
                            <th className="text-left p-3 font-medium text-gray-700 hidden lg:table-cell">Location</th>
                            <th className="text-left p-3 font-medium text-gray-700">Cost Price</th>
                            <th className="text-left p-3 font-medium text-gray-700">Received Date</th>
                            <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReceivedItems.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium text-sm text-gray-900">{item.product?.name || `Product ${item.product_id}`}</p>
                                  <p className="text-xs text-gray-500 sm:hidden">{item.variant?.name || `Variant ${item.variant_id}`}</p>
                                  <p className="text-xs text-gray-500">SKU: {item.product?.sku || item.product_id}</p>
                                </div>
                              </td>
                              <td className="p-3 text-sm hidden sm:table-cell">{item.variant?.name || `Variant ${item.variant_id}`}</td>
                              <td className="p-3">
                                <div className="font-mono text-sm text-gray-900">{item.serial_number || '-'}</div>
                                {item.barcode && (
                                  <div className="text-xs text-gray-500">Barcode: {item.barcode}</div>
                                )}
                              </td>
                              <td className="p-3 text-sm hidden md:table-cell">
                                {item.imei ? (
                                  <span className="font-mono text-xs text-gray-600">{item.imei}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'available' ? 'bg-green-100 text-green-700' :
                                  item.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                                  item.status === 'damaged' ? 'bg-red-100 text-red-700' :
                                  item.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-3 text-sm hidden lg:table-cell">
                                {item.location ? (
                                  <div>
                                    <div className="text-gray-900">{item.location}</div>
                                    {item.shelf && (
                                      <div className="text-xs text-gray-500">Shelf: {item.shelf}</div>
                                    )}
                                    {item.bin && (
                                      <div className="text-xs text-gray-500">Bin: {item.bin}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Not assigned</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="text-sm text-gray-900">
                                  {item.cost_price ? formatCurrency(item.cost_price, 'TZS') : 'N/A'}
                                </div>
                                {item.selling_price && (
                                  <div className="text-xs text-gray-500">
                                    Sell: {formatCurrency(item.selling_price, 'TZS')}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="text-sm text-gray-900">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(item.created_at).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="p-3">
                                <InventoryItemActions
                                  item={item}
                                  onEditStatus={handleEditStatus}
                                  onEditLocation={handleEditLocation}
                                  onViewDetails={handleViewDetails}
                                  onViewHistory={handleViewHistory}
                                  compact={true}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other tabs content... */}
            {activeTab === 'payments' && (
              <div className="text-center py-8">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Payments functionality coming soon</p>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="text-center py-8">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Messages functionality coming soon</p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          item={currentItem}
          onStatusUpdate={handleStatusUpdate}
        />

        <LocationAssignmentModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          item={currentItem}
          onLocationUpdate={handleLocationUpdate}
        />

        <ItemDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          item={currentItem}
          onItemUpdate={loadReceivedItems}
        />

        <ItemHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          item={currentItem}
        />
      </div>
    </div>
  );
};

export default EnhancedPurchaseOrderDetailPage;
