import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../shared/components/ui/Modal';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { PurchaseOrder, PurchaseOrderItem } from '../../types/inventory';
import { toast } from 'react-hot-toast';
import {
  Package, Truck, CheckCircle, Clock, AlertTriangle, Edit, Save, X,
  Eye, Ship, ArrowRight, MapPin, Calendar, DollarSign, User, Phone,
  Mail, Building, FileText, Tag, Box, Hash
} from 'lucide-react';

interface OrderManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onOrderUpdated?: () => void;
}

// Extended status options including shipping states
const ORDER_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'text-yellow-600 bg-yellow-100', icon: FileText },
  { value: 'sent', label: 'Sent', color: 'text-blue-600 bg-blue-100', icon: ArrowRight },
  { value: 'confirmed', label: 'Confirmed', color: 'text-purple-600 bg-purple-100', icon: CheckCircle },
  { value: 'processing', label: 'Processing', color: 'text-indigo-600 bg-indigo-100', icon: Clock },
  { value: 'shipping', label: 'Shipping', color: 'text-orange-600 bg-orange-100', icon: Ship },
  { value: 'shipped', label: 'Shipped', color: 'text-cyan-600 bg-cyan-100', icon: Truck },
  { value: 'received', label: 'Received', color: 'text-green-600 bg-green-100', icon: Package },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600 bg-red-100', icon: X }
] as const;

const ITEM_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'processing', label: 'Processing', color: 'text-blue-600 bg-blue-100' },
  { value: 'shipping', label: 'Shipping', color: 'text-orange-600 bg-orange-100' },
  { value: 'shipped', label: 'Shipped', color: 'text-cyan-600 bg-cyan-100' },
  { value: 'delivered', label: 'Delivered', color: 'text-green-600 bg-green-100' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600 bg-red-100' }
] as const;

const OrderManagementModal: React.FC<OrderManagementModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onOrderUpdated
}) => {
  const {
    getPurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderStatus,
    isLoading
  } = useInventoryStore();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'shipping'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState<string>('');
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>({});
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  // Load order data when modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderData();
    }
  }, [isOpen, orderId]);

  const loadOrderData = async () => {
    if (!orderId) return;
    
    setLoadingOrder(true);
    try {
      const response = await getPurchaseOrder(orderId);
      if (response.ok && response.data) {
        setOrder(response.data);
        setEditedStatus(response.data.status);
        // Initialize shipping fields
        setTrackingNumber(response.data.trackingNumber || '');
        setCarrier(response.data.carrier || '');
        setShippingNotes(response.data.shippingNotes || '');
        setEstimatedDelivery(response.data.expectedDeliveryDate?.split('T')[0] || '');
        // Initialize item statuses
        const itemStatusesMap: Record<string, string> = {};
        response.data.items.forEach(item => {
          itemStatusesMap[item.id] = item.status || 'pending';
        });
        setItemStatuses(itemStatusesMap);
      } else {
        toast.error('Failed to load order details');
      }
    } catch (error) {
      toast.error('Error loading order');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || !editedStatus) return;

    try {
      const response = await updatePurchaseOrderStatus(order.id, editedStatus as any);
      if (response.ok) {
        setOrder(prev => prev ? { ...prev, status: editedStatus as any } : null);
        setIsEditing(false);
        toast.success('Order status updated successfully');
        onOrderUpdated?.();
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      toast.error('Error updating order status');
    }
  };

  const handleItemStatusUpdate = async (itemId: string, newStatus: string) => {
    setItemStatuses(prev => ({
      ...prev,
      [itemId]: newStatus
    }));
    toast.success('Item status updated');
  };

  const handleShippingUpdate = async () => {
    if (!order) return;

    try {
      const response = await updatePurchaseOrder(order.id, {
        trackingNumber: trackingNumber || undefined,
        carrier: carrier || undefined,
        shippingNotes: shippingNotes || undefined,
        expectedDeliveryDate: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : undefined,
        shippedDate: ['shipped', 'received'].includes(editedStatus) ? new Date().toISOString() : undefined
      });
      
      if (response.ok) {
        toast.success('Shipping details updated successfully');
        onOrderUpdated?.();
        loadOrderData(); // Refresh order data
      } else {
        toast.error('Failed to update shipping details');
      }
    } catch (error) {
      toast.error('Error updating shipping details');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
  };

  const getItemStatusConfig = (status: string) => {
    return ITEM_STATUSES.find(s => s.value === status) || ITEM_STATUSES[0];
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span>Order Management</span>
          {order && (
            <span className="text-lg font-normal text-gray-600">#{order.orderNumber}</span>
          )}
        </div>
      }
    >
      {loadingOrder ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="w-6 h-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600">Loading order details...</span>
        </div>
      ) : !order ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Order not found</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'items', label: 'Items', icon: Box },
              { id: 'shipping', label: 'Shipping', icon: Truck }
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Order Status */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <GlassButton
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Status
                      </GlassButton>
                    ) : (
                      <>
                        <GlassButton
                          onClick={handleStatusUpdate}
                          variant="primary"
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </GlassButton>
                        <GlassButton
                          onClick={() => {
                            setIsEditing(false);
                            setEditedStatus(order.status);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </GlassButton>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {ORDER_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    
                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'draft' && (
                        <GlassButton
                          onClick={() => setEditedStatus('sent')}
                          variant="outline"
                          size="sm"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Mark as Sent
                        </GlassButton>
                      )}
                      {order.status === 'sent' && (
                        <GlassButton
                          onClick={() => setEditedStatus('confirmed')}
                          variant="outline"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirm Order
                        </GlassButton>
                      )}
                      {['confirmed', 'processing'].includes(order.status) && (
                        <GlassButton
                          onClick={() => setEditedStatus('shipping')}
                          variant="outline"
                          size="sm"
                        >
                          <Ship className="w-4 h-4 mr-1" />
                          Start Shipping
                        </GlassButton>
                      )}
                      {order.status === 'shipping' && (
                        <GlassButton
                          onClick={() => setEditedStatus('shipped')}
                          variant="outline"
                          size="sm"
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          Mark as Shipped
                        </GlassButton>
                      )}
                      {order.status === 'shipped' && (
                        <GlassButton
                          onClick={() => setEditedStatus('received')}
                          variant="outline"
                          size="sm"
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Mark as Received
                        </GlassButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getStatusConfig(order.status).color}`}>
                      <getStatusConfig(order.status).icon className="w-4 h-4" />
                      <span className="capitalize">{getStatusConfig(order.status).label}</span>
                    </div>
                    
                    {/* Quick Status Change Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'draft' && (
                        <GlassButton
                          onClick={() => {
                            setEditedStatus('sent');
                            setIsEditing(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Send Order
                        </GlassButton>
                      )}
                      {order.status === 'sent' && (
                        <GlassButton
                          onClick={() => {
                            setEditedStatus('shipping');
                            setIsEditing(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Ship className="w-4 h-4 mr-1" />
                          Start Shipping
                        </GlassButton>
                      )}
                      {['confirmed', 'processing', 'shipping'].includes(order.status) && (
                        <GlassButton
                          onClick={() => {
                            setEditedStatus('shipped');
                            setIsEditing(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          Ship Now
                        </GlassButton>
                      )}
                      {order.status === 'shipped' && (
                        <GlassButton
                          onClick={() => {
                            setEditedStatus('received');
                            setIsEditing(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Mark Received
                        </GlassButton>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* Order Details */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">{formatDate(order.orderDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-lg">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {order.expectedDeliveryDate && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Expected Delivery:</span>
                        <span className="font-medium">{formatDate(order.expectedDeliveryDate)}</span>
                      </div>
                    )}
                    {order.receivedDate && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600">Received Date:</span>
                        <span className="font-medium">{formatDate(order.receivedDate)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-medium">{order.items.length}</span>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                    <p className="text-gray-600">{order.notes}</p>
                  </div>
                )}
              </GlassCard>

              {/* Shipping Status Cards */}
              {(['shipping', 'shipped', 'received'].includes(order.status)) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <GlassCard className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center gap-3">
                      <Ship className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-600">Shipping Status</p>
                        <p className="text-lg font-bold text-orange-900 capitalize">{order.status}</p>
                      </div>
                    </div>
                  </GlassCard>
                  
                  {order.trackingNumber && (
                    <GlassCard className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <div className="flex items-center gap-3">
                        <Hash className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-600">Tracking Number</p>
                          <p className="text-lg font-bold text-blue-900">{order.trackingNumber}</p>
                        </div>
                      </div>
                    </GlassCard>
                  )}
                  
                  {order.carrier && (
                    <GlassCard className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <div className="flex items-center gap-3">
                        <Truck className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-purple-600">Carrier</p>
                          <p className="text-lg font-bold text-purple-900 capitalize">{order.carrier}</p>
                        </div>
                      </div>
                    </GlassCard>
                  )}
                </div>
              )}

              {/* Supplier Information */}
              {order.supplier && (
                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{order.supplier.name}</span>
                      </div>
                      {order.supplier.contactPerson && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{order.supplier.contactPerson}</span>
                        </div>
                      )}
                      {order.supplier.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{order.supplier.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {order.supplier.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{order.supplier.email}</span>
                        </div>
                      )}
                      {order.supplier.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{order.supplier.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Lead Time: {order.supplier.leadTimeDays} days</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                <span className="text-sm text-gray-600">{order.items.length} items total</span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {order.items.map((item) => {
                  const itemStatusConfig = getItemStatusConfig(itemStatuses[item.id] || 'pending');
                  
                  return (
                    <GlassCard key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Package className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {item.product?.name || 'Product Name'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${itemStatusConfig.color}`}>
                              {itemStatusConfig.label}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Quantity:</span>
                              <span className="ml-1 font-medium">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Cost:</span>
                              <span className="ml-1 font-medium">{formatCurrency(item.costPrice)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Received:</span>
                              <span className="ml-1 font-medium">{item.receivedQuantity || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <span className="ml-1 font-medium">{formatCurrency(item.quantity * item.costPrice)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={itemStatuses[item.id] || 'pending'}
                            onChange={(e) => handleItemStatusUpdate(item.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {ITEM_STATUSES.map(status => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6">
              {/* Shipping Status Overview */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Status</h3>
                
                {/* Shipping Progress */}
                <div className="space-y-4">
                  {[
                    { status: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
                    { status: 'processing', label: 'Processing', icon: Clock },
                    { status: 'shipping', label: 'Shipping', icon: Ship },
                    { status: 'shipped', label: 'Shipped', icon: Truck },
                    { status: 'received', label: 'Received', icon: Package }
                  ].map((step, index) => {
                    const isActive = ORDER_STATUSES.findIndex(s => s.value === order.status) >= ORDER_STATUSES.findIndex(s => s.value === step.status);
                    const isCurrent = order.status === step.status;
                    const IconComponent = step.icon;
                    
                    return (
                      <div key={step.status} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive ? 'bg-green-500 text-white' : 
                          isCurrent ? 'bg-blue-500 text-white' : 
                          'bg-gray-200 text-gray-500'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${
                          isActive ? 'text-green-700' : 
                          isCurrent ? 'text-blue-700' : 
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Shipping Details */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Details</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                      <input
                        type="text"
                        placeholder="Enter tracking number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                      <select 
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select carrier</option>
                        <option value="dhl">DHL</option>
                        <option value="fedex">FedEx</option>
                        <option value="ups">UPS</option>
                        <option value="local">Local Delivery</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                      <input
                        type="date"
                        value={estimatedDelivery}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Add shipping notes..."
                        value={shippingNotes}
                        onChange={(e) => setShippingNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <GlassButton 
                    onClick={handleShippingUpdate}
                    variant="primary" 
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Update Shipping
                  </GlassButton>
                </div>
              </GlassCard>

              {/* Items Shipping Status */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Shipping Status</h3>
                
                <div className="space-y-3">
                  {Object.entries(
                    order.items.reduce((acc, item) => {
                      const status = itemStatuses[item.id] || 'pending';
                      if (!acc[status]) acc[status] = [];
                      acc[status].push(item);
                      return acc;
                    }, {} as Record<string, PurchaseOrderItem[]>)
                  ).map(([status, items]) => {
                    const statusConfig = getItemStatusConfig(status);
                    
                    return (
                      <div key={status} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                          <span className="text-gray-600">{items.length} items</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default OrderManagementModal;