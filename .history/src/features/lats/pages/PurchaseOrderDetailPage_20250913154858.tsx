import React, { useState, useEffect, useCallback } from 'react';
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
import ShippingAssignmentModal from '../components/shipping/ShippingAssignmentModal';
import ShippingTracker from '../components/shipping/ShippingTracker';

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
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [communicationHistory, setCommunicationHistory] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [qualityChecks, setQualityChecks] = useState<any[]>([]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-6">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      <div className="container mx-auto px-4 py-6">
        <LATSBreadcrumb 
          items={[
            { label: 'LATS', href: '/lats' },
            { label: 'Purchase Orders', href: '/lats/purchase-orders' },
            { label: purchaseOrder.orderNumber, href: `/lats/purchase-orders/${purchaseOrder.id}` }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{purchaseOrder.orderNumber}</h1>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchaseOrder.status)}`}>
                {getStatusIcon(purchaseOrder.status)}
                <span className="capitalize">{purchaseOrder.status}</span>
              </div>
              <span className="text-gray-500">Created {formatDate(purchaseOrder.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {purchaseOrder.status === 'draft' && (
              <>
                <GlassButton
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {isEditing ? 'Cancel Edit' : 'Edit'}
                </GlassButton>
                <GlassButton
                  onClick={handleDelete}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  Delete
                </GlassButton>
              </>
            )}
            
            {purchaseOrder.status === 'sent' && (
              <GlassButton
                onClick={handleReceive}
                className="flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Receive Order
              </GlassButton>
            )}
            
            {(purchaseOrder.status === 'draft' || purchaseOrder.status === 'sent' || purchaseOrder.status === 'confirmed') && (
              <GlassButton
                onClick={handleAssignShipping}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              >
                <Truck className="w-4 h-4" />
                Assign Shipping
              </GlassButton>
            )}
            
            {(purchaseOrder.status === 'shipping' || purchaseOrder.status === 'shipped' || purchaseOrder.status === 'received') && (
              <GlassButton
                onClick={handleViewShipping}
                className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <Ship className="w-4 h-4" />
                View Shipping
              </GlassButton>
            )}
            
            <GlassButton
              onClick={() => navigate('/lats/purchase-orders')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Details */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Number
                    </label>
                    <p className="text-gray-900 font-medium">{purchaseOrder.orderNumber}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(purchaseOrder.status)}`}>
                      {getStatusIcon(purchaseOrder.status)}
                      <span className="capitalize">{purchaseOrder.status}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created Date
                    </label>
                    <p className="text-gray-900">{formatDate(purchaseOrder.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Updated
                    </label>
                    <p className="text-gray-900">{formatDate(purchaseOrder.updatedAt)}</p>
                  </div>
                  
                  {purchaseOrder.expectedDelivery && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Delivery
                      </label>
                      <p className="text-gray-900">{formatDate(purchaseOrder.expectedDelivery)}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <p className="text-gray-900 font-medium">{purchaseOrder.currency || 'TZS'}</p>
                  </div>
                  
                  {purchaseOrder.paymentTerms && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms
                      </label>
                      <p className="text-gray-900">{purchaseOrder.paymentTerms}</p>
                    </div>
                  )}
                  
                  {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exchange Rate
                      </label>
                      <p className="text-gray-900">
                        1 {purchaseOrder.currency} = {parseFloat(purchaseOrder.exchangeRate.toString()).toString()} TZS
                        {purchaseOrder.exchangeRateSource && purchaseOrder.exchangeRateSource !== 'default' && (
                          <span className="text-sm text-gray-500 ml-2">({purchaseOrder.exchangeRateSource})</span>
                        )}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <p className="text-gray-900 font-semibold text-lg">{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}</p>
                    {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && purchaseOrder.totalAmountBaseCurrency && (
                      <p className="text-sm text-gray-600 mt-1">
                        TZS {purchaseOrder.totalAmountBaseCurrency.toLocaleString()} 
                        <span className="text-xs text-gray-500 ml-2">
                          (Rate: 1 {purchaseOrder.currency} = {parseFloat(purchaseOrder.exchangeRate.toString()).toString()} TZS)
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                
                {purchaseOrder.notes && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{purchaseOrder.notes}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Order Items */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
                
                {purchaseOrder.items.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No items in this order</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Variant</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Quantity</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Cost Price</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                          {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                            <th className="text-right py-3 px-4 font-medium text-gray-700">TZS Total</th>
                          )}
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Received</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrder.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{item.product?.name || `Product ${item.productId}`}</p>
                                <p className="text-sm text-gray-500">SKU: {item.product?.sku || item.productId}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-gray-900">{item.variant?.name || `Variant ${item.variantId}`}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="text-gray-900">{item.quantity}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="text-gray-900">{formatCurrency(item.costPrice, purchaseOrder.currency)}</p>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <p className="font-medium text-gray-900">{formatCurrency(item.quantity * item.costPrice, purchaseOrder.currency)}</p>
                            </td>
                            {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                              <td className="py-3 px-4 text-right">
                                <p className="text-sm text-gray-600">
                                  TZS {((item.quantity * item.costPrice) * purchaseOrder.exchangeRate).toLocaleString()}
                                </p>
                              </td>
                            )}
                            <td className="py-3 px-4 text-right">
                              <p className="text-gray-900">{item.receivedQuantity}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Shipping Information */}
            {(purchaseOrder.status === 'shipping' || purchaseOrder.status === 'shipped' || purchaseOrder.status === 'received') && purchaseOrder.shippingInfo && (
              <GlassCard>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Information</h2>
                  <ShippingTracker 
                    shippingInfo={purchaseOrder.shippingInfo} 
                    compact={true}
                    debugMode={process.env.NODE_ENV === 'development'}
                    onRefresh={handleRefresh}
                  />
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <GlassButton
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </GlassButton>
                      
                      <GlassButton
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel Edit
                      </GlassButton>
                    </>
                  ) : (
                    <>
                      {purchaseOrder.status === 'draft' && (
                        <GlassButton
                          onClick={() => setIsEditing(true)}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Order
                        </GlassButton>
                      )}
                      
                      {purchaseOrder.status === 'sent' && (
                        <GlassButton
                          onClick={handleReceive}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <CheckSquare className="w-4 h-4" />
                          Receive Order
                        </GlassButton>
                      )}
                    </>
                  )}
                  
                  <GlassButton
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Order
                  </GlassButton>
                  
                  <GlassButton
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </GlassButton>
                </div>
              </div>
            </GlassCard>

            {/* Order Summary */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                
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
            </GlassCard>
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
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${showShippingTracker ? 'block' : 'hidden'}`}>
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
