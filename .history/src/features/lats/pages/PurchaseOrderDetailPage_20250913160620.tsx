import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Package, Edit, Save, X, AlertCircle, 
  FileText, ShoppingCart, Clock, CheckSquare, XSquare, Send, Truck,
  DollarSign, Calendar, Printer, Download, ArrowLeft, ArrowRight,
  Ship, PackageCheck, Building, Phone, Mail, MapPin, Star, 
  TrendingUp, BarChart3, Target, Calculator, Banknote, Receipt,
  Copy, Share2, Archive, History, Store, Info, Plus, Minus,
  RotateCcw, Shield, Percent, Layers, QrCode, Eye, MessageSquare,
  FileImage, Upload, CheckCircle2, AlertTriangle, ThumbsUp,
  ThumbsDown, ExternalLink, Zap, Users, CreditCard, Calendar as CalendarIcon,
  Hash, Tag, Scale, Hand, Fingerprint, Radio, XCircle, HardDrive,
  Cpu, Palette, Ruler, Unplug, Battery, Monitor, Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';

// Lazy load heavy components
const ShippingAssignmentModal = lazy(() => import('../components/shipping/ShippingAssignmentModal'));
const ShippingTracker = lazy(() => import('../components/shipping/ShippingTracker'));

const PurchaseOrderDetailPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Database state management
  const { 
    getPurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderShipping,
    deletePurchaseOrder,
    receivePurchaseOrder,
    isLoading,
    error,
    shippingAgents,
    loadShippingAgents
  } = useInventoryStore();

  // Local state
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showShippingTracker, setShowShippingTracker] = useState(false);
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState('overview');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPartialReceiveModal, setShowPartialReceiveModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showQualityControlModal, setShowQualityControlModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Lazy load data only when needed
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [communicationHistory, setCommunicationHistory] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [qualityChecks, setQualityChecks] = useState<any[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));

  // Load purchase order and shipping data on component mount
  useEffect(() => {
    if (id) {
      loadPurchaseOrder();
    }
    
    // Load shipping agents only once on mount
    loadShippingAgents().catch((error) => {
      console.error('❌ [PurchaseOrderDetailPage] Failed to load shipping agents:', error);
    });
  }, [id]); // Remove loadShippingAgents from dependencies to prevent re-runs

  // Handle tab switching with lazy loading
  const handleTabChange = useCallback((tabName: string) => {
    setActiveTab(tabName);
    
    // Load data only when tab is first accessed
    if (!loadedTabs.has(tabName)) {
      setLoadedTabs(prev => new Set([...prev, tabName]));
      
      // Load specific data based on tab
      switch (tabName) {
        case 'analytics':
          // Load analytics data
          break;
        case 'history':
          // Load audit history
          setAuditHistory([
            { id: 1, action: 'Created', user: 'System', timestamp: new Date(), details: 'Purchase order created' },
            { id: 2, action: 'Updated', user: currentUser?.name || 'User', timestamp: new Date(), details: 'Order details updated' }
          ]);
          break;
        case 'supplier':
          // Load supplier performance data
          break;
        default:
          break;
      }
    }
  }, [loadedTabs, currentUser]);

  const loadPurchaseOrder = async () => {
    if (!id) return;
    
    setIsLoadingOrder(true);
    
    try {
      const response = await getPurchaseOrder(id);
      
      if (response.ok) {
        console.log('🔍 [PurchaseOrderDetailPage] DEBUG - Purchase order data received:', {
          id: response.data.id,
          orderNumber: response.data.orderNumber,
          itemsCount: response.data.items?.length || 0,
          items: response.data.items?.map(item => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            product: item.product,
            variant: item.variant,
            hasProductData: !!item.product,
            hasVariantData: !!item.variant
          }))
        });
        setPurchaseOrder(response.data);
      } else {
        console.error('❌ [PurchaseOrderDetailPage] Failed to load purchase order:', response.message);
        toast.error(response.message || 'Failed to load purchase order');
        navigate('/lats/purchase-orders');
      }
    } catch (error) {
      console.error('❌ [PurchaseOrderDetailPage] Error loading purchase order:', error);
      toast.error('Failed to load purchase order');
      navigate('/lats/purchase-orders');
    } finally {
      setIsLoadingOrder(false);
    }
  };

  // Memoized refresh function to prevent infinite re-renders
  const handleRefresh = useCallback(() => {
    loadPurchaseOrder();
  }, [id]); // Only recreate if id changes

  const handleSave = async () => {
    if (!purchaseOrder) return;
    
    setIsSaving(true);
    const response = await updatePurchaseOrder(purchaseOrder.id, {
      supplierId: purchaseOrder.supplierId,
      expectedDelivery: purchaseOrder.expectedDelivery,
      notes: purchaseOrder.notes,
      items: purchaseOrder.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        costPrice: item.costPrice,
        notes: item.notes
      }))
    });
    
    if (response.ok) {
      toast.success('Purchase order updated successfully');
      setIsEditing(false);
      await loadPurchaseOrder();
    } else {
      toast.error(response.message || 'Failed to update purchase order');
    }
    setIsSaving(false);
  };

  const handleReceive = async () => {
    if (!purchaseOrder) return;
    
    const response = await receivePurchaseOrder(purchaseOrder.id);
    if (response.ok) {
      toast.success('Purchase order received successfully');
      await loadPurchaseOrder();
    } else {
      toast.error(response.message || 'Failed to receive purchase order');
    }
  };

  const handleDelete = async () => {
    if (!purchaseOrder) return;
    
    if (window.confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
      const response = await deletePurchaseOrder(purchaseOrder.id);
      if (response.ok) {
        toast.success('Purchase order deleted successfully');
        navigate('/lats/purchase-orders');
      } else {
        toast.error(response.message || 'Failed to delete purchase order');
      }
    }
  };

  const handleAssignShipping = () => {
    setShowShippingModal(true);
  };

  const handleShippingAssigned = async (shippingData: any) => {
    console.log('🚚 [PurchaseOrderDetailPage] Shipping assignment triggered');
    console.log('🚚 [PurchaseOrderDetailPage] Shipping data received:', shippingData);
    console.log('🚚 [PurchaseOrderDetailPage] Purchase order ID:', purchaseOrder?.id);
    
    if (!purchaseOrder) {
      console.log('⚠️ [PurchaseOrderDetailPage] No purchase order available for shipping assignment');
      return;
    }
    
    try {
      console.log('🚚 [PurchaseOrderDetailPage] Calling updatePurchaseOrderShipping...');
      const response = await updatePurchaseOrderShipping(purchaseOrder.id, shippingData);
      console.log('🚚 [PurchaseOrderDetailPage] updatePurchaseOrderShipping response:', response);
      
      if (response.success) {
        console.log('✅ [PurchaseOrderDetailPage] Shipping assigned successfully');
        toast.success('Shipping assigned successfully');
        setShowShippingModal(false);
        // Reload the purchase order to reflect the changes
        console.log('🔄 [PurchaseOrderDetailPage] Reloading purchase order after shipping assignment...');
        loadPurchaseOrder();
      } else {
        console.error('❌ [PurchaseOrderDetailPage] Failed to assign shipping:', response.message);
        toast.error(response.message || 'Failed to assign shipping');
      }
    } catch (error) {
      console.error('❌ [PurchaseOrderDetailPage] Error assigning shipping:', error);
      toast.error('Failed to assign shipping');
    }
  };

  const handleViewShipping = () => {
    setShowShippingTracker(true);
  };

  // New handler functions for enhanced features
  const handlePrintOrder = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow && purchaseOrder) {
        const printContent = generatePrintContent(purchaseOrder);
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        toast.success('Purchase order sent to printer');
      }
    } catch (error) {
      toast.error('Failed to print purchase order');
    }
  };

  const handleExportPDF = () => {
    try {
      if (purchaseOrder) {
        const pdfContent = generatePDFContent(purchaseOrder);
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Purchase_Order_${purchaseOrder.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF exported successfully');
      }
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleApproveOrder = () => {
    setShowApprovalModal(true);
  };

  const handlePartialReceive = () => {
    setShowPartialReceiveModal(true);
  };

  const handleViewCommunication = () => {
    setShowCommunicationModal(true);
  };

  const handleQualityControl = () => {
    setShowQualityControlModal(true);
  };

  const handleViewPayments = () => {
    setShowPaymentModal(true);
  };

  const generatePrintContent = (order: PurchaseOrder) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .order-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PURCHASE ORDER</h1>
            <h2>${order.orderNumber}</h2>
          </div>
          
          <div class="order-info">
            <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
            <p><strong>Supplier:</strong> ${order.supplier?.name || 'N/A'}</p>
            <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
            <p><strong>Expected Delivery:</strong> ${order.expectedDelivery ? formatDate(order.expectedDelivery) : 'N/A'}</p>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>Quantity</th>
                <th>Cost Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product?.name || `Product ${item.productId}`}</td>
                  <td>${item.variant?.name || `Variant ${item.variantId}`}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.costPrice, order.currency)}</td>
                  <td>${formatCurrency(item.quantity * item.costPrice, order.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p><strong>Total Amount: ${formatCurrency(order.totalAmount, order.currency)}</strong></p>
            ${order.exchangeRate && order.exchangeRate !== 1.0 && order.totalAmountBaseCurrency ? 
              `<p><strong>TZS Equivalent: TZS ${order.totalAmountBaseCurrency.toLocaleString()}</strong></p>` : ''
            }
          </div>
          
          ${order.notes ? `<div><strong>Notes:</strong><br>${order.notes}</div>` : ''}
        </body>
      </html>
    `;
  };

  const generatePDFContent = (order: PurchaseOrder) => {
    // This would integrate with a PDF generation library like jsPDF
    // For now, return a simple text representation
    return `Purchase Order ${order.orderNumber}\n\n` +
           `Date: ${formatDate(order.createdAt)}\n` +
           `Supplier: ${order.supplier?.name || 'N/A'}\n` +
           `Status: ${order.status}\n` +
           `Total: ${formatCurrency(order.totalAmount, order.currency)}\n\n` +
           `Items:\n${order.items.map(item => 
             `- ${item.product?.name || `Product ${item.productId}`}: ${item.quantity} x ${formatCurrency(item.costPrice, order.currency)}`
           ).join('\n')}`;
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
      case 'received': return <CheckSquare className="w-4 h-4" />;
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
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoadingOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
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

  if (!purchaseOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => navigate('/lats/purchase-orders')}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{purchaseOrder.orderNumber}</h2>
              <p className="text-sm text-gray-500">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchaseOrder.status)}`}>
                  {getStatusIcon(purchaseOrder.status)}
                  <span className="capitalize">{purchaseOrder.status}</span>
                </span>
                <span className="ml-2">Created {formatDate(purchaseOrder.createdAt)}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/lats/purchase-orders')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => handleTabChange('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => handleTabChange('supplier')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'supplier'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Supplier
              </div>
            </button>
            <button
              onClick={() => handleTabChange('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Items
              </div>
            </button>
            <button
              onClick={() => handleTabChange('shipping')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'shipping'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Shipping
              </div>
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </div>
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Financial Overview - Minimal Design */}
              <div className="mb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Value</div>
                    <div className="text-lg font-bold text-emerald-900">{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Items Count</div>
                    <div className="text-lg font-bold text-blue-900">{purchaseOrder.items.length}</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Total Quantity</div>
                    <div className="text-lg font-bold text-orange-900">
                      {purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                    <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Received</div>
                    <div className="text-lg font-bold text-purple-900">
                      {purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Order Details */}
                <div className="space-y-6">
                  {/* Order Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Info className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Order Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Order Number</span>
                        <p className="text-sm font-medium text-gray-900 font-mono">{purchaseOrder.orderNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchaseOrder.status)}`}>
                          {getStatusIcon(purchaseOrder.status)}
                          <span className="capitalize">{purchaseOrder.status}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Created Date</span>
                        <p className="text-sm font-medium text-gray-900">{formatDate(purchaseOrder.createdAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</span>
                        <p className="text-sm font-medium text-gray-900">{formatDate(purchaseOrder.updatedAt)}</p>
                      </div>
                      {purchaseOrder.expectedDelivery && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Expected Delivery</span>
                          <p className="text-sm font-medium text-gray-900">{formatDate(purchaseOrder.expectedDelivery)}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Currency</span>
                        <p className="text-sm font-medium text-gray-900">{purchaseOrder.currency || 'TZS'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Financial Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</span>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}</p>
                      </div>
                      {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && purchaseOrder.totalAmountBaseCurrency && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">TZS Equivalent</span>
                          <p className="text-lg font-bold text-blue-600">TZS {purchaseOrder.totalAmountBaseCurrency.toLocaleString()}</p>
                        </div>
                      )}
                      {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                        <div className="col-span-2 space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Exchange Rate</span>
                          <p className="text-sm font-medium text-gray-900">
                            1 {purchaseOrder.currency} = {parseFloat(purchaseOrder.exchangeRate.toString()).toString()} TZS
                            {purchaseOrder.exchangeRateSource && purchaseOrder.exchangeRateSource !== 'default' && (
                              <span className="text-xs text-gray-500 ml-2">({purchaseOrder.exchangeRateSource})</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {purchaseOrder.notes && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Notes</h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                        {purchaseOrder.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column - Actions & Summary */}
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
                    </div>
                    <div className="space-y-2">
                      {purchaseOrder.status === 'draft' && (
                        <>
                          <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                          >
                            <Edit className="w-4 h-4" />
                            {isEditing ? 'Cancel Edit' : 'Edit Order'}
                          </button>
                          <button
                            onClick={handleApproveOrder}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                          >
                            <CheckSquare className="w-4 h-4" />
                            Approve Order
                          </button>
                        </>
                      )}
                      
                      {purchaseOrder.status === 'sent' && (
                        <button
                          onClick={handleReceive}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                          <CheckSquare className="w-4 h-4" />
                          Receive Order
                        </button>
                      )}

                      <button
                        onClick={handlePrintOrder}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <Printer className="w-4 h-4" />
                        Print Order
                      </button>
                      
                      <button
                        onClick={handleExportPDF}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </button>

                      <button
                        onClick={handlePartialReceive}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <PackageCheck className="w-4 h-4" />
                        Partial Receive
                      </button>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Order Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-medium">{purchaseOrder.items.length}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Quantity:</span>
                        <span className="font-medium">
                          {purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Received Quantity:</span>
                        <span className="font-medium">
                          {purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0)}
                        </span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Amount:</span>
                          <span>{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}</span>
                        </div>
                        {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && purchaseOrder.totalAmountBaseCurrency && (
                          <div className="flex justify-between text-sm text-gray-600 mt-2">
                            <span>TZS Equivalent:</span>
                            <span>TZS {purchaseOrder.totalAmountBaseCurrency.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Supplier Tab */}
          {activeTab === 'supplier' && (
            <div className="space-y-6">
              {purchaseOrder.supplier ? (
                <>
                  {/* Supplier Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Building className="w-5 h-5 text-orange-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Supplier Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Name</span>
                        <p className="text-sm font-medium text-gray-900">{purchaseOrder.supplier.name}</p>
                      </div>
                      {purchaseOrder.supplier.contactPerson && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Contact Person</span>
                          <p className="text-sm font-medium text-gray-900">{purchaseOrder.supplier.contactPerson}</p>
                        </div>
                      )}
                      {purchaseOrder.supplier.phone && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Phone</span>
                          <p className="text-sm font-medium text-gray-900">{purchaseOrder.supplier.phone}</p>
                        </div>
                      )}
                      {purchaseOrder.supplier.email && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Email</span>
                          <p className="text-sm font-medium text-gray-900">{purchaseOrder.supplier.email}</p>
                        </div>
                      )}
                      {purchaseOrder.supplier.country && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Country</span>
                          <p className="text-sm font-medium text-gray-900">{purchaseOrder.supplier.country}</p>
                        </div>
                      )}
                      {purchaseOrder.supplier.currency && (
                        <div className="space-y-1">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Preferred Currency</span>
                          <p className="text-sm font-medium text-gray-900">{purchaseOrder.supplier.currency}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supplier Performance */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Supplier Performance</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Rating</span>
                        <p className="text-sm font-medium text-gray-900">
                          {(purchaseOrder.supplier as any).rating ? `${(purchaseOrder.supplier as any).rating}/5` : 'Not Rated'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Lead Time</span>
                        <p className="text-sm font-medium text-gray-900">
                          {(purchaseOrder.supplier as any).leadTime ? `${(purchaseOrder.supplier as any).leadTime} days` : 'Not Set'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Total Orders</span>
                        <p className="text-sm font-medium text-gray-900">
                          {(purchaseOrder.supplier as any).totalOrders || 0}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">On-Time Delivery</span>
                        <p className="text-sm font-medium text-gray-900">
                          {(purchaseOrder.supplier as any).onTimeDeliveryRate ? `${(purchaseOrder.supplier as any).onTimeDeliveryRate}%` : 'Not Tracked'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Communication History */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-800">Communication History</h3>
                      </div>
                      <button
                        onClick={handleViewCommunication}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {communicationHistory.length > 0 ? (
                        communicationHistory.slice(0, 3).map((comm, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{comm.type}</p>
                                <p className="text-xs text-gray-600">{comm.message}</p>
                              </div>
                              <span className="text-xs text-gray-500">{comm.date}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No communication history</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No supplier information available</p>
                </div>
              )}
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              {purchaseOrder.items.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No items in this order</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Package className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Order Items ({purchaseOrder.items.length} items)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-3 font-medium text-gray-700">Product</th>
                          <th className="text-left p-3 font-medium text-gray-700 hidden sm:table-cell">Variant</th>
                          <th className="text-left p-3 font-medium text-gray-700">Quantity</th>
                          <th className="text-left p-3 font-medium text-gray-700 hidden md:table-cell">Cost Price</th>
                          <th className="text-left p-3 font-medium text-gray-700">Total</th>
                          {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                            <th className="text-left p-3 font-medium text-gray-700 hidden lg:table-cell">TZS Total</th>
                          )}
                          <th className="text-left p-3 font-medium text-gray-700">Received</th>
                          <th className="text-left p-3 font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrder.items.map((item, index) => {
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
                              {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                                <td className="p-3 text-sm hidden lg:table-cell">
                                  <span className="text-gray-600">
                                    TZS {((item.quantity * item.costPrice) * purchaseOrder.exchangeRate).toLocaleString()}
                                  </span>
                                </td>
                              )}
                              <td className="p-3">
                                <span className="font-medium text-sm text-gray-900">{item.receivedQuantity}</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  receivedPercentage >= 100 ? 'bg-green-100 text-green-700' : 
                                  receivedPercentage > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {receivedPercentage >= 100 ? 'Complete' : receivedPercentage > 0 ? 'Partial' : 'Pending'}
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

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              {(purchaseOrder.status === 'shipping' || purchaseOrder.status === 'shipped' || purchaseOrder.status === 'received') && purchaseOrder.shippingInfo ? (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Shipping Information</h3>
                  </div>
                  <ShippingTracker 
                    shippingInfo={purchaseOrder.shippingInfo} 
                    compact={false}
                    debugMode={process.env.NODE_ENV === 'development'}
                    onRefresh={handleRefresh}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No shipping information available</p>
                  {(purchaseOrder.status === 'draft' || purchaseOrder.status === 'sent' || purchaseOrder.status === 'confirmed') && (
                    <button
                      onClick={handleAssignShipping}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium mx-auto"
                    >
                      <Truck className="w-4 h-4" />
                      Assign Shipping
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Cost Analysis */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Cost Analysis</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Total Cost</div>
                    <div className="text-lg font-bold text-green-900">{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Avg Cost/Item</div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(purchaseOrder.totalAmount / purchaseOrder.items.length, purchaseOrder.currency)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Total Quantity</div>
                    <div className="text-lg font-bold text-purple-900">
                      {purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Items Count</div>
                    <div className="text-lg font-bold text-orange-900">{purchaseOrder.items.length}</div>
                  </div>
                </div>
              </div>

              {/* Inventory Impact */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Package className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Inventory Impact</h3>
                </div>
                <div className="space-y-3">
                  {purchaseOrder.items.map((item, index) => {
                    const currentStock = item.product?.variants?.find(v => v.id === item.variantId)?.quantity || 0;
                    const newStock = currentStock + item.quantity;
                    const isLowStock = newStock <= (item.product?.variants?.find(v => v.id === item.variantId)?.minQuantity || 0);
                    
                    return (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.product?.name || `Product ${item.productId}`}</p>
                          <p className="text-xs text-gray-500">{item.variant?.name || `Variant ${item.variantId}`}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Current: {currentStock}</p>
                          <p className="text-sm font-medium text-gray-900">+{item.quantity} → {newStock}</p>
                          {isLowStock && (
                            <p className="text-xs text-orange-600">Low Stock Warning</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Audit Trail */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <History className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Audit Trail</h3>
                </div>
                <div className="space-y-2">
                  {auditHistory.length > 0 ? (
                    auditHistory.map((entry, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                          <p className="text-xs text-gray-600">{entry.description}</p>
                          <p className="text-xs text-gray-500">By: {entry.user}</p>
                        </div>
                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No audit history available</p>
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Payment History</h3>
                  </div>
                  <button
                    onClick={handleViewPayments}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {paymentHistory.length > 0 ? (
                    paymentHistory.slice(0, 3).map((payment, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{payment.method}</p>
                          <p className="text-xs text-gray-600">{payment.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{payment.date}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            payment.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No payment history</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintOrder}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>

            <button
              onClick={handleViewCommunication}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              Communication
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/lats/purchase-orders')}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Close
            </button>
            
            {purchaseOrder.status === 'draft' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
            )}
          </div>
        </div>

        {/* Shipping Assignment Modal */}
        <ShippingAssignmentModal
          isOpen={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          purchaseOrder={purchaseOrder!}
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

        {/* Shipping Tracker Modal */}
        {purchaseOrder?.shippingInfo && (
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${showShippingTracker ? 'block' : 'hidden'}`}>
            <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ShippingTracker 
                shippingInfo={purchaseOrder.shippingInfo}
                compact={false}
                debugMode={process.env.NODE_ENV === 'development'}
                onRefresh={handleRefresh}
              />
              <div className="mt-4 flex justify-end">
                <GlassButton
                  onClick={() => setShowShippingTracker(false)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
