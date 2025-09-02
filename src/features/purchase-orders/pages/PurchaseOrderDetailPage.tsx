// Purchase Order Detail Page - View and manage individual purchase order
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';

import {
  Package, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Truck, 
  User, Phone, Mail, MapPin, Calendar, DollarSign, FileText,
  AlertCircle, Download, Send, Clock, CheckSquare, Eye,
  ShoppingBag, Coins, Star, TrendingUp
} from 'lucide-react';

import { toast } from 'react-hot-toast';
import { usePurchaseOrderStore } from '../stores/usePurchaseOrderStore';
import { useInventoryStore } from '../../lats/stores/useInventoryStore';
import { 
  formatMoney, 
  formatDate, 
  formatTime, 
  formatPOStatus, 
  getStatusColor,
  getDaysUntilDelivery,
  isDeliveryOverdue,
  SUPPORTED_CURRENCIES,
  PAYMENT_TERMS
} from '../lib/utils';

const PurchaseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Purchase Order Store
  const {
    currentPO,
    isLoading,
    isUpdating,
    error,
    getPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder
  } = usePurchaseOrderStore();

  // Inventory store for additional data
  const {
    suppliers,
    products,
    categories,
    loadSuppliers,
    loadProducts,
    loadCategories
  } = useInventoryStore();

  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showShippedItems, setShowShippedItems] = useState(false);

  // Load purchase order and related data
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        await Promise.all([
          getPurchaseOrder(id),
          loadSuppliers(),
          loadProducts({ page: 1, limit: 100 }),
          loadCategories()
        ]);
      } catch (error) {
        console.error('Error loading purchase order data:', error);
      }
    };

    loadData();
  }, [id, getPurchaseOrder, loadSuppliers, loadProducts, loadCategories]);

  // Initialize edit data when PO loads
  useEffect(() => {
    if (currentPO) {
      setEditData({
        expectedDelivery: currentPO.expectedDelivery,
        paymentTerms: currentPO.paymentTerms,
        notes: currentPO.notes || '',
        status: currentPO.status
      });
    }
  }, [currentPO]);

  // Get supplier details
  const supplier = useMemo(() => {
    return suppliers.find(s => s.id === currentPO?.supplierId);
  }, [suppliers, currentPO]);

  // Get currency details
  const currency = useMemo(() => {
    return SUPPORTED_CURRENCIES.find(c => c.code === currentPO?.currency) || SUPPORTED_CURRENCIES[0];
  }, [currentPO]);

  // Get payment terms details
  const paymentTermsDetails = useMemo(() => {
    return PAYMENT_TERMS.find(pt => pt.id === currentPO?.paymentTerms);
  }, [currentPO]);

  // Calculate delivery status
  const deliveryStatus = useMemo(() => {
    if (!currentPO) return null;
    
    const daysUntil = getDaysUntilDelivery(currentPO.expectedDelivery);
    const isOverdue = isDeliveryOverdue(currentPO.expectedDelivery, currentPO.status);
    
    return {
      daysUntil,
      isOverdue,
      message: isOverdue 
        ? `${Math.abs(daysUntil)} days overdue` 
        : daysUntil === 0 
          ? 'Due today' 
          : `${daysUntil} days remaining`
    };
  }, [currentPO]);

  // Handle update purchase order
  const handleUpdate = async () => {
    if (!currentPO) return;

    try {
      const result = await updatePurchaseOrder(currentPO.id, editData);
      if (result.ok) {
        toast.success('Purchase order updated successfully');
        setIsEditing(false);
      } else {
        toast.error(result.message || 'Failed to update purchase order');
      }
    } catch (error) {
      console.error('Error updating purchase order:', error);
      toast.error('Error updating purchase order');
    }
  };

  // Handle delete purchase order
  const handleDelete = async () => {
    if (!currentPO) return;

    if (confirm('Are you sure you want to delete this purchase order?')) {
      const result = await deletePurchaseOrder(currentPO.id);
      if (result.ok) {
        toast.success('Purchase order deleted successfully');
        navigate('/purchase-orders');
      } else {
        toast.error(result.message || 'Failed to delete purchase order');
      }
    }
  };

  // Handle receive purchase order
  const handleReceive = async () => {
    if (!currentPO) return;

    if (confirm('Mark this purchase order as received?')) {
      const result = await receivePurchaseOrder(currentPO.id);
      if (result.ok) {
        toast.success('Purchase order marked as received');
      } else {
        toast.error(result.message || 'Failed to update purchase order');
      }
    }
  };

  if (!currentUser || !id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (error || !currentPO) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-100 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Purchase Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested purchase order could not be found.'}</p>
          <GlassButton onClick={() => navigate('/purchase-orders')}>
            Back to Purchase Orders
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => navigate('/purchase-orders')} />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Purchase Order {currentPO.orderNumber}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Created {formatDate(currentPO.createdAt)} at {formatTime(currentPO.createdAt)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(currentPO.status)}`}>
                {formatPOStatus(currentPO.status)}
              </span>
              
              {currentPO.status !== 'received' && currentPO.status !== 'cancelled' && (
                <GlassButton
                  onClick={handleReceive}
                  icon={<CheckCircle size={18} />}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  disabled={isUpdating}
                >
                  Mark Received
                </GlassButton>
              )}
              
              <GlassButton
                onClick={() => setIsEditing(!isEditing)}
                icon={<Edit size={18} />}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              >
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Information */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Supplier Information
              </h3>
              
              {supplier ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {supplier.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900">{supplier.name}</h4>
                      {supplier.company_name && (
                        <p className="text-gray-600">{supplier.company_name}</p>
                      )}
                      {supplier.contactPerson && (
                        <p className="text-sm text-gray-600">Contact: {supplier.contactPerson}</p>
                      )}
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {supplier.address}
                          </div>
                        )}
                        {supplier.country && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>📍</span>
                            {supplier.country}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Supplier information not available
                </div>
              )}
            </GlassCard>

            {/* Order Items */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                Order Items ({currentPO.items?.length || 0})
              </h3>
              
              <div className="space-y-4">
                {currentPO.items?.map((item, index) => {
                  const product = products.find(p => p.id === item.productId);
                  const variant = product?.variants?.find(v => v.id === item.variantId);
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{product?.name || 'Unknown Product'}</h4>
                            {variant?.name && (
                              <p className="text-sm text-gray-600">Variant: {variant.name}</p>
                            )}
                            <p className="text-sm text-gray-600">SKU: {variant?.sku || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {item.quantity} × {formatMoney(item.costPrice, currency)}
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatMoney(item.totalPrice, currency)}
                          </div>
                          {item.receivedQuantity !== undefined && (
                            <div className="text-sm text-green-600">
                              Received: {item.receivedQuantity}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mt-3 p-3 bg-white rounded-lg">
                          <p className="text-sm text-gray-600">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Status & Quick Actions */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(currentPO.status)}`}>
                    {formatPOStatus(currentPO.status)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Expected Delivery</span>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatDate(currentPO.expectedDelivery)}
                    </div>
                    {deliveryStatus && (
                      <div className={`text-sm ${deliveryStatus.isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                        {deliveryStatus.message}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Terms</span>
                  <span className="font-medium text-gray-900">
                    {paymentTermsDetails?.name || currentPO.paymentTerms}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 space-y-3">
                {currentPO.status !== 'received' && currentPO.status !== 'cancelled' && (
                  <GlassButton
                    onClick={handleReceive}
                    icon={<CheckCircle size={18} />}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    disabled={isUpdating}
                  >
                    Mark as Received
                  </GlassButton>
                )}
                
                <GlassButton
                  onClick={() => navigate(`/purchase-orders/${currentPO.id}/shipped-items`)}
                  icon={<Truck size={18} />}
                  className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white"
                >
                  Manage Shipments
                </GlassButton>
                
                <GlassButton
                  onClick={() => {/* TODO: Print/Export */}}
                  icon={<Download size={18} />}
                  className="w-full bg-gradient-to-r from-gray-500 to-slate-600 text-white"
                >
                  Export PDF
                </GlassButton>
              </div>
            </GlassCard>

            {/* Financial Summary */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Financial Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(currentPO.subtotal, currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(currentPO.tax || 0, currency)}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatMoney(currentPO.totalAmount, currency)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Coins className="w-4 h-4" />
                    Currency: {currency.name} ({currency.symbol})
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Order Notes */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Order Notes
              </h3>
              
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add notes about this purchase order..."
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                  />
                  
                  <div className="flex gap-3">
                    <GlassButton
                      onClick={handleUpdate}
                      icon={<CheckCircle size={16} />}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      disabled={isUpdating}
                    >
                      Save Changes
                    </GlassButton>
                    <GlassButton
                      onClick={() => setIsEditing(false)}
                      icon={<XCircle size={16} />}
                      className="flex-1 bg-gray-100 text-gray-700"
                    >
                      Cancel
                    </GlassButton>
                  </div>
                </div>
              ) : (
                <div>
                  {currentPO.notes ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{currentPO.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added</p>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Danger Zone */}
            {currentPO.status === 'draft' && (
              <GlassCard className="p-6 border-red-200">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Danger Zone
                </h3>
                
                <p className="text-gray-600 mb-4">
                  This action cannot be undone. This will permanently delete the purchase order.
                </p>
                
                <GlassButton
                  onClick={handleDelete}
                  icon={<Trash2 size={18} />}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white"
                >
                  Delete Purchase Order
                </GlassButton>
              </GlassCard>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <GlassCard className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {currentPO.items?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Items Ordered</div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatMoney(currentPO.totalAmount, currency)}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {deliveryStatus?.daysUntil || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {deliveryStatus?.isOverdue ? 'Days Overdue' : 'Days Until Delivery'}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;