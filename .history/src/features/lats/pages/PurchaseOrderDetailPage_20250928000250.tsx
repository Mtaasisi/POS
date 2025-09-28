import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Package, Edit, Save, X, AlertCircle, 
  CheckSquare, PackageCheck, RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';
import { PurchaseOrderService } from '../services/purchaseOrderService';
import { supabase } from '../../../lib/supabaseClient';

interface PurchaseOrderDetailPageProps {
  editMode?: boolean;
}

const PurchaseOrderDetailPage: React.FC<PurchaseOrderDetailPageProps> = ({ editMode = false }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Database state management
  const { 
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder,
    approvePurchaseOrder,
  } = useInventoryStore();

  // Local state
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isEditing, setIsEditing] = useState(editMode);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Enhanced state
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<Array<{
    id: string;
    product?: { name: string };
    productName?: string;
    quantity: number;
    costPrice: number;
    variant?: { name: string };
    variantName?: string;
  }>>([]);
  const [receivedItems, setReceivedItems] = useState<Array<{
    id: string;
    quantity: number;
  }>>([]);

  // Load purchase order function
  const loadPurchaseOrder = useCallback(async () => {
    if (!id) {
      console.error('❌ No purchase order ID provided');
      setLoadingError('No purchase order ID provided');
      setIsLoadingOrder(false);
      return;
    }
    
    console.log('🔍 [PurchaseOrderDetailPage] Loading purchase order:', {
      id,
      type: typeof id,
      length: id.length,
      currentUser: currentUser?.id
    });
    setIsLoadingOrder(true);
    setLoadingError(null);
    
    try {
      // Test database connectivity first
      console.log('🔍 [PurchaseOrderDetailPage] Testing database connection...');
      const connectivityTest = await supabase.from('lats_purchase_orders').select('id').limit(1);
      console.log('🔍 [PurchaseOrderDetailPage] Database connectivity:', {
        hasData: !!connectivityTest.data,
        error: connectivityTest.error?.message || null
      });

      // Get purchase order from store
      console.log('🔍 [PurchaseOrderDetailPage] Calling store getPurchaseOrder...');
      const { getPurchaseOrder } = useInventoryStore.getState();
      const response = await getPurchaseOrder(id);
      
      console.log('🔍 [PurchaseOrderDetailPage] Store response:', {
        ok: response.ok,
        message: response.message,
        hasData: !!response.data,
        dataId: response.data?.id
      });
      
      if (response.ok && response.data) {
        console.log('✅ [PurchaseOrderDetailPage] Purchase order loaded successfully:', {
          id: response.data.id,
          orderNumber: response.data.orderNumber,
          status: response.data.status,
          supplierId: response.data.supplierId,
          totalAmount: response.data.totalAmount
        });
        
        setPurchaseOrder(response.data);
        
        // Set items if available
        if (response.data.items && response.data.items.length > 0) {
          console.log('✅ [PurchaseOrderDetailPage] Items loaded:', response.data.items.length);
          setPurchaseOrderItems(response.data.items);
        } else {
          console.log('ℹ️ [PurchaseOrderDetailPage] No items found in purchase order');
          setPurchaseOrderItems([]);
        }
        
        // Load received items if needed
        if (response.data.status === 'received') {
          console.log('🔍 [PurchaseOrderDetailPage] Loading received items...');
          try {
            const receivedResponse = await PurchaseOrderService.getReceivedItems(id);
            if (receivedResponse.success && receivedResponse.data) {
              setReceivedItems(receivedResponse.data);
              console.log('✅ [PurchaseOrderDetailPage] Received items loaded:', receivedResponse.data.length);
            }
          } catch (receivedError) {
            console.warn('⚠️ [PurchaseOrderDetailPage] Failed to load received items:', receivedError);
          }
        }
        
      } else {
        console.error('❌ [PurchaseOrderDetailPage] Failed to load purchase order:', {
          ok: response.ok,
          message: response.message,
          hasData: !!response.data
        });
        setLoadingError(response.message || 'Failed to load purchase order');
      }
    } catch (error) {
      console.error('❌ [PurchaseOrderDetailPage] Error loading purchase order:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLoadingError(`Failed to load purchase order: ${errorMessage}`);
    } finally {
      console.log('🔍 [PurchaseOrderDetailPage] Setting loading to false');
      setIsLoadingOrder(false);
    }
  }, [id, currentUser]);

  // Load purchase order on mount
  useEffect(() => {
    if (id) {
      loadPurchaseOrder();
    } else {
      setLoadingError('No purchase order ID found in URL');
      setIsLoadingOrder(false);
    }
  }, [id, loadPurchaseOrder]);

  // Handle edit mode changes
  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode]);

  // Handle save
  const handleSave = async () => {
    if (!purchaseOrder) return;
    
    setIsSaving(true);
    try {
      const response = await updatePurchaseOrder(purchaseOrder.id, {
        supplierId: purchaseOrder.supplierId,
        expectedDelivery: purchaseOrder.expectedDeliveryDate,
        notes: purchaseOrder.notes,
        items: purchaseOrder.items?.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          costPrice: item.costPrice,
        })) || []
      });
      
      if (response.ok) {
        toast.success('Purchase order updated successfully');
        setIsEditing(false);
      } else {
        toast.error(response.message || 'Failed to update purchase order');
      }
    } catch (error) {
      toast.error('Failed to update purchase order');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!purchaseOrder) return;
    
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      const response = await deletePurchaseOrder(purchaseOrder.id);
      if (response.ok) {
        toast.success('Purchase order deleted successfully');
        navigate('/lats/purchase-orders');
      } else {
        toast.error(response.message || 'Failed to delete purchase order');
      }
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    console.log('🔄 [PurchaseOrderDetailPage] Manual refresh triggered');
    setLoadingError(null);
    await loadPurchaseOrder();
  };

  // Handle approve order
  const handleApprove = async () => {
    if (!purchaseOrder) return;
    
    setIsSaving(true);
    try {
      const response = await approvePurchaseOrder(purchaseOrder.id);
      if (response.ok) {
        toast.success('Purchase order approved successfully');
        setPurchaseOrder({ ...purchaseOrder, status: 'sent' });
      } else {
        toast.error(response.message || 'Failed to approve purchase order');
      }
    } catch (error) {
      toast.error('Failed to approve purchase order');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle receive order
  const handleReceive = async () => {
    if (!purchaseOrder) return;
    
    setIsSaving(true);
    try {
      const response = await receivePurchaseOrder(purchaseOrder.id);
      if (response.ok) {
        toast.success('Purchase order received successfully');
        setPurchaseOrder({ ...purchaseOrder, status: 'received' });
        // Reload to get updated data
        await loadPurchaseOrder();
      } else {
        toast.error(response.message || 'Failed to receive purchase order');
      }
    } catch (error) {
      toast.error('Failed to receive purchase order');
    } finally {
      setIsSaving(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading purchase order...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!purchaseOrder && loadingError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Error</h2>
            <p className="text-gray-600 mb-4">{loadingError}</p>
            <div className="flex gap-3 justify-center">
              <GlassButton onClick={() => navigate('/lats/purchase-orders')}>
                Back to Purchase Orders
              </GlassButton>
              <GlassButton 
                onClick={handleRefresh}
                variant="outline"
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Try Again
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!purchaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Purchase Order Not Found</h2>
            <p className="text-gray-600 mb-4">The purchase order you're looking for doesn't exist.</p>
            <GlassButton onClick={() => navigate('/lats/purchase-orders')}>
              Back to Purchase Orders
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton onClick={() => navigate('/lats/purchase-orders')} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchase Order Details</h1>
              <p className="text-sm text-gray-600">Order #{purchaseOrder.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <GlassButton
              onClick={handleRefresh}
              disabled={isLoadingOrder}
              variant="outline"
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Refresh
            </GlassButton>

            {/* Status-based Actions */}
            {purchaseOrder.status === 'draft' && (
              <GlassButton
                onClick={handleApprove}
                disabled={isSaving}
                icon={<CheckSquare className="w-4 h-4" />}
              >
                {isSaving ? 'Approving...' : 'Approve'}
              </GlassButton>
            )}

            {purchaseOrder.status === 'sent' && (
              <GlassButton
                onClick={handleReceive}
                disabled={isSaving}
                icon={<PackageCheck className="w-4 h-4" />}
              >
                {isSaving ? 'Receiving...' : 'Receive'}
              </GlassButton>
            )}

            {/* Edit/Delete Actions */}
            {isEditing ? (
              <>
                <GlassButton
                  onClick={handleSave}
                  disabled={isSaving}
                  icon={<Save className="w-4 h-4" />}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </GlassButton>
                <GlassButton
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  icon={<X className="w-4 h-4" />}
                >
                  Cancel
                </GlassButton>
              </>
            ) : (
              <>
                <GlassButton
                  onClick={() => setIsEditing(true)}
                  icon={<Edit className="w-4 h-4" />}
                >
                  Edit
                </GlassButton>
                <GlassButton
                  onClick={handleDelete}
                  variant="danger"
                  icon={<X className="w-4 h-4" />}
                >
                  Delete
                </GlassButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Order Overview */}
          <GlassCard className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Order Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Order Number:</span>
                    <p className="font-medium">{purchaseOrder.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        purchaseOrder.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        purchaseOrder.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        purchaseOrder.status === 'confirmed' ? 'bg-indigo-100 text-indigo-800' :
                        purchaseOrder.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        purchaseOrder.status === 'received' ? 'bg-green-100 text-green-800' :
                        purchaseOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {purchaseOrder.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Created:</span>
                    <p className="font-medium">{formatDate(purchaseOrder.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Supplier:</span>
                    <p className="font-medium">{purchaseOrder.supplier?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Contact:</span>
                    <p className="font-medium">{purchaseOrder.supplier?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email:</span>
                    <p className="font-medium">{purchaseOrder.supplier?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Total Amount:</span>
                    <p className="font-medium text-lg">
                      {formatCurrency(purchaseOrder.totalAmount || 0, purchaseOrder.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Currency:</span>
                    <p className="font-medium">{purchaseOrder.currency || 'TZS'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Payment Terms:</span>
                    <p className="font-medium">{purchaseOrder.paymentTerms || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Items */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
              <span className="text-sm text-gray-500">
                {purchaseOrderItems.length} item{purchaseOrderItems.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {purchaseOrderItems.length > 0 ? (
              <div className="space-y-4">
                {purchaseOrderItems.map((item, index) => (
                  <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.product?.name || item.productName || 'Unknown Product'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} | 
                          Cost: {formatCurrency(item.costPrice || 0, purchaseOrder.currency)}
                        </p>
                        {item.variant && (
                          <p className="text-sm text-gray-500">
                            Variant: {item.variant.name || item.variantName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency((item.quantity || 0) * (item.costPrice || 0), purchaseOrder.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No items found for this purchase order</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
