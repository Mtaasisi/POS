import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
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
    isLoading,
    error,
  } = useInventoryStore();

  // Local state
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isEditing, setIsEditing] = useState(editMode);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Enhanced state
  const [activeTab, setActiveTab] = useState('overview');
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<any[]>([]);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);

  // Load purchase order function
  const loadPurchaseOrder = useCallback(async () => {
    if (!id) {
      console.error('❌ No purchase order ID provided');
      setLoadingError('No purchase order ID provided');
      setIsLoadingOrder(false);
      return;
    }
    
    console.log('🔍 Loading purchase order:', id);
    setIsLoadingOrder(true);
    setLoadingError(null);
    
    try {
      // Get purchase order from store
      const { getPurchaseOrder } = useInventoryStore.getState();
      const response = await getPurchaseOrder(id);
      
      if (response.ok && response.data) {
        console.log('✅ Purchase order loaded:', response.data.id);
        setPurchaseOrder(response.data);
        
        // Set items if available
        if (response.data.items && response.data.items.length > 0) {
          setPurchaseOrderItems(response.data.items);
        }
        
      } else {
        console.error('❌ Failed to load purchase order:', response.message);
        setLoadingError(response.message || 'Failed to load purchase order');
      }
    } catch (error) {
      console.error('❌ Error loading purchase order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLoadingError(`Failed to load purchase order: ${errorMessage}`);
    } finally {
      setIsLoadingOrder(false);
    }
  }, [id]);

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
                onClick={() => {
                  setLoadingError(null);
                  loadPurchaseOrder();
                }}
                variant="outline"
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
                    <p className="font-medium capitalize">{purchaseOrder.status}</p>
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
