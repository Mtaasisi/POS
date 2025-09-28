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
  Cpu, Palette, Ruler, Unplug, Battery, Monitor, Camera, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';
import { PurchaseOrderService } from '../services/purchaseOrderService';

// Import components directly for debugging
import PurchaseOrderPaymentModal from '../components/purchase-order/PurchaseOrderPaymentModal';

interface PurchaseOrderDetailPageProps {
  editMode?: boolean;
}

const PurchaseOrderDetailPage: React.FC<PurchaseOrderDetailPageProps> = ({ editMode = false }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Database state management
  const { 
    getPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder,
    isLoading,
    error,
  } = useInventoryStore();

  // Local state
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isEditing, setIsEditing] = useState(editMode);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState('overview');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPartialReceiveModal, setShowPartialReceiveModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showQualityControlModal, setShowQualityControlModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPurchaseOrderPaymentModal, setShowPurchaseOrderPaymentModal] = useState(false);
  
  // Draft management state
  const [savedDrafts, setSavedDrafts] = useState([
    {
      id: '1',
      name: 'Office Supplies Order',
      supplier: 'Stationery Plus Ltd',
      itemCount: 5,
      totalAmount: 45000,
      currency: 'TZS',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T14:45:00Z'
    },
    {
      id: '2',
      name: 'IT Equipment Purchase',
      supplier: 'Tech Solutions Co',
      itemCount: 3,
      totalAmount: 180000,
      currency: 'USD',
      createdAt: '2024-01-14T09:15:00Z',
      updatedAt: '2024-01-14T16:20:00Z'
    }
  ]);
  const [draftName, setDraftName] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Lazy load data only when needed
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [communicationHistory, setCommunicationHistory] = useState<any[]>([
    {
      id: 1,
      sender: 'System',
      content: 'Purchase order created and sent to supplier',
      timestamp: new Date().toISOString(),
      type: 'system'
    },
    {
      id: 2,
      sender: 'Supplier',
      content: 'Order confirmed. Expected delivery in 5-7 business days.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'supplier'
    }
  ]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([
    {
      id: 1,
      method: 'Bank Transfer',
      amount: 86400,
      currency: 'CNY',
      status: 'completed',
      timestamp: new Date().toISOString(),
      reference: 'TXN-123456789'
    }
  ]);
  const [qualityChecks, setQualityChecks] = useState<any[]>([]);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));

  // Load purchase order data on component mount
  useEffect(() => {
    if (id) {
      loadPurchaseOrder();
    }
    
  }, [id]);

  // Handle editMode prop changes
  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode]);

  // Handle tab switching with lazy loading
  const handleTabChange = useCallback(async (tabName: string) => {
    setActiveTab(tabName);
    
    // Load data only when tab is first accessed
    if (!loadedTabs.has(tabName)) {
      setLoadedTabs(prev => new Set(Array.from(prev).concat(tabName)));
      
      // Load specific data based on tab
      switch (tabName) {
        case 'analytics':
          // Load analytics data
          break;
        case 'history':
          // Load audit history from database
          if (purchaseOrder) {
            try {
              const auditData = await PurchaseOrderService.getAuditHistory(purchaseOrder.id);
              setAuditHistory(auditData);
            } catch (error) {
              console.error('Failed to load audit history:', error);
            }
          }
          break;
        case 'supplier':
          // Load supplier performance data
          break;
        default:
          break;
      }
    }
  }, [loadedTabs, currentUser]);

  const loadPurchaseOrder = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingOrder(true);
    
    try {
      const response = await getPurchaseOrder(id);
      
      if (response.ok) {
        console.log('🔍 [PurchaseOrderDetailPage] DEBUG - Purchase order data received:', {
          id: response.data.id,
          orderNumber: response.data.orderNumber,
          itemsCount: response.data.items?.length || 0,
          hasSupplier: !!response.data.supplier,
          supplierName: response.data.supplier?.name || 'No supplier',
          supplierId: response.data.supplierId,
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
  }, [id, getPurchaseOrder, navigate]);

  // Memoized refresh function to prevent infinite re-renders
  const handleRefresh = useCallback(() => {
    loadPurchaseOrder();
  }, [loadPurchaseOrder]); // Use loadPurchaseOrder dependency

  const handleSave = async () => {
    if (!purchaseOrder) return;
    
    setIsSaving(true);
    const response = await updatePurchaseOrder(purchaseOrder.id, {
      supplierId: purchaseOrder.supplierId,
      expectedDelivery: purchaseOrder.expectedDeliveryDate,
      notes: purchaseOrder.notes,
      items: purchaseOrder.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        costPrice: item.costPrice,
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


  const handleViewCommunication = async () => {
    setShowCommunicationModal(true);
    
    // Load communication history from database
    if (purchaseOrder) {
      try {
        const messages = await PurchaseOrderService.getMessages(purchaseOrder.id);
        setCommunicationHistory(messages);
      } catch (error) {
        console.error('Failed to load communication history:', error);
      }
    }
  };

  const handleQualityControl = () => {
    setShowQualityControlModal(true);
  };

  const handleViewPayments = async () => {
    setShowPaymentModal(true);
    
    // Load payment history from database
    if (purchaseOrder) {
      try {
        const payments = await PurchaseOrderService.getPayments(purchaseOrder.id);
        setPaymentHistory(payments);
      } catch (error) {
        console.error('Failed to load payment history:', error);
      }
    }
  };

  const handleMakePayment = () => {
    setShowPurchaseOrderPaymentModal(true);
  };

  const handlePurchaseOrderPaymentComplete = async (paymentData: any[]) => {
    try {
      // Import the payment service
      const { purchaseOrderPaymentService } = await import('../lib/purchaseOrderPaymentService');
      
      // Process each payment using the enhanced service
      const results = await Promise.all(
        paymentData.map(async (payment) => {
          const result = await purchaseOrderPaymentService.processPayment({
            purchaseOrderId: payment.purchaseOrderId,
            paymentAccountId: payment.paymentAccountId,
            amount: payment.amount,
            currency: purchaseOrder?.currency || 'TZS',
            paymentMethod: payment.paymentMethod,
            paymentMethodId: payment.paymentMethodId,
            reference: payment.reference,
            notes: payment.notes,
            createdBy: currentUser?.id || ''
          });
          return result;
        })
      );

      // Check if all payments were successful
      const failedPayments = results.filter(result => !result.success);
      
      if (failedPayments.length > 0) {
        const errorMessages = failedPayments.map(result => result.message).join('; ');
        toast.error(`Some payments failed: ${errorMessages}`);
      } else {
        toast.success('All payments processed successfully');
      }
      
      setShowPurchaseOrderPaymentModal(false);
      
      // Reload purchase order to reflect payment changes
      await loadPurchaseOrder();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
    }
  };

  // Enhanced handler functions with full functionality
  const handleApproveOrder = async () => {
    if (!purchaseOrder) return;
    
    try {
      setIsSaving(true);
      const response = await updatePurchaseOrder(purchaseOrder.id, {
        ...purchaseOrder,
        status: 'sent',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.id
      });
      
      if (response.ok) {
        toast.success('Purchase order approved successfully');
        setPurchaseOrder({ ...purchaseOrder, status: 'sent' });
        setShowApprovalModal(false);
      } else {
        toast.error(response.message || 'Failed to approve purchase order');
      }
    } catch (error) {
      toast.error('Failed to approve purchase order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReceive = async () => {
    if (!purchaseOrder) return;
    
    try {
      setIsSaving(true);
      
      // Use the enhanced PurchaseOrderService for complete receive
      const result = await PurchaseOrderService.completeReceive(
        purchaseOrder.id,
        currentUser?.id || '',
        'Complete receive of purchase order'
      );
      
      if (result.success) {
        toast.success(`Purchase order received successfully: ${result.message}`);
        if (result.summary) {
          console.log('Receive summary:', result.summary);
        }
        await loadPurchaseOrder(); // Reload to get updated data
      } else {
        toast.error(`Receive failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Receive error:', error);
      toast.error('Failed to receive purchase order');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePartialReceive = async (receivedItems: any[]) => {
    if (!purchaseOrder) return;
    
    try {
      setIsSaving(true);
      
      // Use the enhanced PurchaseOrderService to update received quantities
      const result = await PurchaseOrderService.updateReceivedQuantities(
        purchaseOrder.id,
        receivedItems.map(item => ({
          id: item.id,
          receivedQuantity: item.receivedQuantity
        })),
        currentUser?.id || ''
      );
      
      if (result.success) {
        // Update order status to partially_received
        const statusSuccess = await PurchaseOrderService.updateOrderStatus(
          purchaseOrder.id,
          'partial_received',
          currentUser?.id || ''
        );
        
        if (statusSuccess) {
          toast.success(`Partial receive completed: ${result.message}`);
          await loadPurchaseOrder(); // Reload to get updated data
          setShowPartialReceiveModal(false);
        } else {
          toast.error('Items updated but failed to update order status');
        }
      } else {
        toast.error(`Partial receive failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Partial receive error:', error);
      toast.error('Failed to process partial receive');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrder = async (updatedOrder: any) => {
    if (!purchaseOrder) return;
    
    try {
      setIsSaving(true);
      const response = await updatePurchaseOrder(purchaseOrder.id, updatedOrder);
      
      if (response.ok) {
        toast.success('Purchase order updated successfully');
        setPurchaseOrder(updatedOrder);
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

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !purchaseOrder) return;
    
    try {
      const success = await PurchaseOrderService.sendMessage({
        purchaseOrderId: purchaseOrder.id,
        sender: currentUser?.name || 'You',
        content: message,
        type: 'user'
      });
      
      if (success) {
        const newMessage = {
          id: Date.now().toString(),
          sender: currentUser?.name || 'You',
          content: message,
          timestamp: new Date().toISOString(),
          type: 'user'
        };
        
        setCommunicationHistory(prev => [newMessage, ...prev]);
        toast.success('Message sent successfully');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleAddPayment = async (paymentData: any) => {
    if (!purchaseOrder) return;
    
    try {
      const success = await PurchaseOrderService.addPayment({
        purchaseOrderId: purchaseOrder.id,
        method: paymentData.method,
        amount: paymentData.amount,
        currency: paymentData.currency || purchaseOrder.currency,
        status: 'pending',
        reference: paymentData.reference || `PAY-${Date.now()}`
      });
      
      if (success) {
        const newPayment = {
          id: Date.now().toString(),
          method: paymentData.method,
          amount: paymentData.amount,
          currency: paymentData.currency || purchaseOrder.currency,
          status: 'pending',
          timestamp: new Date().toISOString(),
          reference: paymentData.reference || `PAY-${Date.now()}`
        };
        
        setPaymentHistory(prev => [newPayment, ...prev]);
        toast.success('Payment added successfully');
      } else {
        toast.error('Failed to add payment');
      }
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };

  // Draft management functions
  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      toast.error('Please enter a draft name');
      return;
    }

    if (!purchaseOrder || purchaseOrder.items.length === 0) {
      toast.error('Cannot save empty draft');
      return;
    }

    setIsSavingDraft(true);
    try {
      // TODO: Save draft to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const newDraft = {
        id: Date.now().toString(),
        name: draftName,
        supplier: purchaseOrder.supplier?.name || 'No supplier',
        itemCount: purchaseOrder.items.length,
        totalAmount: purchaseOrder.totalAmount,
        currency: purchaseOrder.currency || 'TZS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSavedDrafts(prev => [newDraft, ...prev]);
      setDraftName('');
      setDraftNotes('');
      toast.success('Draft saved successfully!');
    } catch (error) {
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleLoadDraft = (draftId: string) => {
    const draft = savedDrafts.find(d => d.id === draftId);
    if (draft) {
      // TODO: Load draft data into current purchase order
      toast.success(`Loading draft: ${draft.name}`);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      setSavedDrafts(prev => prev.filter(d => d.id !== draftId));
      toast.success('Draft deleted successfully');
    }
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
            <p><strong>Expected Delivery:</strong> ${order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'N/A'}</p>
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
        <div className={`flex items-center justify-between p-6 border-b ${isEditing ? 'border-blue-200 bg-blue-50' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditing ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{purchaseOrder.orderNumber}</h2>
                {isEditing && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <Edit className="w-4 h-4" />
                    Editing Mode
                  </div>
                )}
              </div>
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
            <button
              onClick={() => handleTabChange('drafts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'drafts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Drafts
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Financial Overview - Enhanced Design */}
              <div className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Value</div>
                    <div className="text-xl font-bold text-emerald-900">{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Items Count</div>
                    <div className="text-xl font-bold text-blue-900">{purchaseOrder.items.length}</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Layers className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Total Quantity</div>
                    <div className="text-xl font-bold text-orange-900">
                      {purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Received</div>
                    <div className="text-xl font-bold text-purple-900">
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
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Expected Delivery</span>
                        {isEditing ? (
                          <input
                            type="date"
                            value={purchaseOrder.expectedDelivery ? new Date(purchaseOrder.expectedDelivery).toISOString().split('T')[0] : ''}
                            onChange={(e) => setPurchaseOrder(prev => prev ? { ...prev, expectedDelivery: e.target.value ? new Date(e.target.value).toISOString() : null } : null)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {purchaseOrder.expectedDelivery ? formatDate(purchaseOrder.expectedDelivery) : 'Not set'}
                          </p>
                        )}
                      </div>
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
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Notes</h3>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={purchaseOrder.notes || ''}
                        onChange={(e) => setPurchaseOrder(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm"
                        rows={4}
                        placeholder="Add notes for this purchase order..."
                      />
                    ) : (
                      purchaseOrder.notes ? (
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                          {purchaseOrder.notes}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No notes added</p>
                      )
                    )}
                  </div>
                </div>

                {/* Right Column - Actions & Summary */}
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Actions</h3>
                    </div>
                    
                    {/* Primary Actions */}
                    <div className="space-y-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancel Edit
                          </button>
                        </>
                      ) : (
                        <>
                          {purchaseOrder.status === 'draft' && (
                            <>
                              <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Order
                              </button>
                              <button
                                onClick={handleApproveOrder}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                              >
                                <CheckSquare className="w-4 h-4" />
                                Approve Order
                              </button>
                            </>
                          )}
                        </>
                      )}
                      
                      {purchaseOrder.status === 'sent' && (
                        <button
                          onClick={handleReceive}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <CheckSquare className="w-4 h-4" />
                          Receive Order
                        </button>
                      )}

                      <button
                        onClick={() => setShowPartialReceiveModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <PackageCheck className="w-4 h-4" />
                        Partial Receive
                      </button>

                      <button
                        onClick={handleMakePayment}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <CreditCard className="w-4 h-4" />
                        Make Payment
                      </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handlePrintOrder}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Printer className="w-4 h-4" />
                          Print
                        </button>
                        
                        <button
                          onClick={handleExportPDF}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Export PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800">Order Summary</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{purchaseOrder.items.length}</div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide">Items</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                          </div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide">Quantity</div>
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">
                          {purchaseOrder.items.reduce((sum, item) => sum + item.receivedQuantity, 0)}
                        </div>
                        <div className="text-xs text-green-700 uppercase tracking-wide">Received</div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 mb-1">Total Amount</div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}
                          </div>
                          
                          {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && purchaseOrder.totalAmountBaseCurrency && (
                            <div className="mt-2 text-sm text-blue-600">
                              TZS {purchaseOrder.totalAmountBaseCurrency.toLocaleString()}
                            </div>
                          )}
                        </div>
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
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 1;
                                      const updatedItems = [...purchaseOrder.items];
                                      updatedItems[index] = { ...item, quantity: newQuantity };
                                      setPurchaseOrder(prev => prev ? { ...prev, items: updatedItems } : null);
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  <span className="font-medium text-sm text-gray-900">{item.quantity}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm hidden md:table-cell">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.costPrice}
                                    onChange={(e) => {
                                      const newCostPrice = parseFloat(e.target.value) || 0;
                                      const updatedItems = [...purchaseOrder.items];
                                      updatedItems[index] = { ...item, costPrice: newCostPrice };
                                      setPurchaseOrder(prev => prev ? { ...prev, items: updatedItems } : null);
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  formatCurrency(item.costPrice, purchaseOrder.currency)
                                )}
                              </td>
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

          {/* Shipping Tab - Completely Removed */}
          {false && false && (
            <div className="space-y-6">
              {(purchaseOrder.status === 'shipping' || purchaseOrder.status === 'shipped' || purchaseOrder.status === 'received') && purchaseOrder.shippingInfo ? (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Shipping Information</h3>
                  </div>
                  <ShippingTracker 
                    shippingInfo={purchaseOrder.shippingInfo}
                    purchaseOrder={purchaseOrder}
                    compact={false}
                    debugMode={process.env.NODE_ENV === 'development'}
                    onRefresh={handleRefresh}
                    onStatusUpdate={async (status: string, data: any) => {
                      console.log('🚚 [PurchaseOrderDetailPage] Status update requested:', { status, data });
                      try {
                        const response = await updatePurchaseOrderShipping(purchaseOrder.id, {
                          status,
                          ...data
                        });
                        if (response.ok) {
                          toast.success(`Status updated to ${status.replace('_', ' ')}`);
                          loadPurchaseOrder(); // Reload to get updated data
                        } else {
                          toast.error(response.message || 'Failed to update status');
                        }
                      } catch (error) {
                        console.error('Status update error:', error);
                        toast.error('Failed to update status');
                      }
                    }}
                    onInventoryUpdate={async (products: any[]) => {
                      console.log('🚚 [PurchaseOrderDetailPage] Inventory update requested:', products);
                      try {
                        // Handle inventory updates here
                        toast.success(`${products.length} products updated in inventory`);
                      } catch (error) {
                        console.error('Inventory update error:', error);
                        toast.error('Failed to update inventory');
                      }
                    }}
                  />
                  
                  <div className="flex gap-2 pt-2">
                    <GlassButton
                      onClick={() => navigate(`/lats/shipping/${purchaseOrder.shippingInfo.id}`)}
                      variant="primary"
                      size="sm"
                      className="flex-1"
                    >
                      <Truck size={16} />
                      View Full Details
                    </GlassButton>
                    
                    <GlassButton
                      onClick={handleViewShipping}
                      variant="secondary"
                      size="sm"
                    >
                      <Eye size={16} />
                      Quick View
                    </GlassButton>
                    
                    <GlassButton
                      onClick={() => setShowShippingModal(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit Shipping
                    </GlassButton>
                  </div>
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
          {activeTab === 'analytics' && !loadedTabs.has('analytics') && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            </div>
          )}
          {activeTab === 'analytics' && loadedTabs.has('analytics') && (
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
          {activeTab === 'history' && !loadedTabs.has('history') && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading history...</p>
              </div>
            </div>
          )}
          {activeTab === 'history' && loadedTabs.has('history') && (
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
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-600">{payment.amount}</p>
                            {payment.currency && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {payment.currency}
                              </span>
                            )}
                          </div>
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

          {/* Drafts Tab */}
          {activeTab === 'drafts' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Save Current Draft */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Archive className="w-5 h-5 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Save Current Draft</h3>
                  </div>
                  
                  {purchaseOrder && purchaseOrder.items.length > 0 ? (
                    <div className="space-y-4">
                      {/* Current Draft Summary */}
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Items:</span>
                            <span className="font-medium">{purchaseOrder.items.length} products</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Supplier:</span>
                            <span className="font-medium">{purchaseOrder.supplier?.name || 'Not selected'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="font-semibold text-orange-600">{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Currency:</span>
                            <span className="font-medium">{purchaseOrder.currency || 'TZS'}</span>
                          </div>
                          {purchaseOrder.expectedDelivery && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Expected:</span>
                              <span className="font-medium">{formatDate(purchaseOrder.expectedDelivery)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Draft Name Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Draft Name *
                        </label>
                        <input
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          placeholder="Enter a name for this draft..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Draft Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          placeholder="Add any notes about this draft..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows={3}
                        />
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft || !draftName.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors font-medium text-sm"
                      >
                        <Save className="w-4 h-4" />
                        {isSavingDraft ? 'Saving...' : 'Save Draft'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No items in order to save</p>
                      <p className="text-sm text-gray-500">Add products to create a draft</p>
                    </div>
                  )}
                </div>

                {/* Saved Drafts */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Archive className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Saved Drafts</h3>
                  </div>
                  
                  {savedDrafts.length > 0 ? (
                    <div className="space-y-3">
                      {savedDrafts.map((draft) => (
                        <div 
                          key={draft.id}
                          className="p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-300 transition-all duration-200 bg-white"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{draft.name}</h4>
                              <p className="text-sm text-gray-600">{draft.supplier}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-orange-600">
                                {formatCurrency(draft.totalAmount, draft.currency)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {draft.itemCount} items
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Created: {formatDate(draft.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Edit className="w-3 h-3" />
                              <span>Updated: {formatDate(draft.updatedAt)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleLoadDraft(draft.id)}
                              className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                            >
                              Load Draft
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(draft.id)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No drafts saved</p>
                      <p className="text-sm text-gray-500">Save your first draft to see it here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleViewCommunication}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Communication
            </button>
            
            <button
              onClick={handleViewPayments}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <CreditCard className="w-4 h-4" />
              Payments
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/lats/purchase-orders')}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
            
            {purchaseOrder.status === 'draft' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
            )}
          </div>
        </div>

        {/* Shipping Assignment Modal - Removed */}

        {/* Shipping Tracker Modal - Completely Removed */}
        {false && false && purchaseOrder?.shippingInfo && (
          <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${showShippingTracker ? 'block' : 'hidden'}`}>
            <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ShippingTracker 
                shippingInfo={purchaseOrder.shippingInfo}
                purchaseOrder={purchaseOrder}
                compact={false}
                debugMode={process.env.NODE_ENV === 'development'}
                onRefresh={handleRefresh}
                onStatusUpdate={async (status: string, data: any) => {
                  console.log('🚚 [PurchaseOrderDetailPage] Status update requested:', { status, data });
                  try {
                    const response = await updatePurchaseOrderShipping(purchaseOrder.id, {
                      status,
                      ...data
                    });
                    if (response.ok) {
                      toast.success(`Status updated to ${status.replace('_', ' ')}`);
                      loadPurchaseOrder(); // Reload to get updated data
                    } else {
                      toast.error(response.message || 'Failed to update status');
                    }
                  } catch (error) {
                    console.error('Status update error:', error);
                    toast.error('Failed to update status');
                  }
                }}
                onInventoryUpdate={async (products: any[]) => {
                  console.log('🚚 [PurchaseOrderDetailPage] Inventory update requested:', products);
                  try {
                    // Handle inventory updates here
                    toast.success(`${products.length} products updated in inventory`);
                  } catch (error) {
                    console.error('Inventory update error:', error);
                    toast.error('Failed to update inventory');
                  }
                }}
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

        {/* Purchase Order Payment Modal */}
        {purchaseOrder && (
          <PurchaseOrderPaymentModal
            isOpen={showPurchaseOrderPaymentModal}
            onClose={() => setShowPurchaseOrderPaymentModal(false)}
            purchaseOrder={purchaseOrder}
            onPaymentComplete={handlePurchaseOrderPaymentComplete}
          />
        )}

        {/* Approval Confirmation Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Approve Purchase Order</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to approve this purchase order? This action will change the status to "Sent" and notify the supplier.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveOrder}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Approving...' : 'Approve Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Partial Receive Modal */}
        {showPartialReceiveModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 p-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <PackageCheck className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Partial Receive</h3>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Select the items and quantities you have received:
                </p>
                
                <div className="space-y-3">
                  {purchaseOrder?.items.map((item, index) => (
                    <div key={item.id || index} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">Ordered: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Received:</label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.receivedQuantity || 0}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            // Update the item's received quantity
                            const updatedItems = [...(purchaseOrder?.items || [])];
                            updatedItems[index] = { ...item, receivedQuantity: value };
                            setPurchaseOrder(prev => prev ? { ...prev, items: updatedItems } : null);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPartialReceiveModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const receivedItems = purchaseOrder?.items.filter(item => (item.receivedQuantity || 0) > 0) || [];
                      handlePartialReceive(receivedItems);
                    }}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {isSaving ? 'Processing...' : 'Confirm Receive'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Communication Modal */}
        {showCommunicationModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 p-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {communicationHistory.length > 0 ? (
                    communicationHistory.map((message, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{message.sender}</span>
                          <span className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No communication history available</p>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <textarea
                    id="messageInput"
                    placeholder="Add a new message..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setShowCommunicationModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => {
                        const messageInput = document.getElementById('messageInput') as HTMLTextAreaElement;
                        if (messageInput && messageInput.value.trim()) {
                          handleSendMessage(messageInput.value);
                          messageInput.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment History Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 p-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {paymentHistory.length > 0 ? (
                    paymentHistory.map((payment, index) => (
                      <div key={payment.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium text-gray-900">{payment.method}</span>
                          </div>
                          <span className="text-sm text-gray-500">{new Date(payment.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Amount</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Status</p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {payment.status}
                            </span>
                          </div>
                        </div>
                        {payment.reference && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-1">Reference</p>
                            <p className="text-sm text-gray-900 font-mono">{payment.reference}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                      <p className="text-sm">No payments have been made for this purchase order yet.</p>
                      <button
                        onClick={() => {
                          setShowPaymentModal(false);
                          handleMakePayment();
                        }}
                        className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Make First Payment
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Use the "Make Payment" button to add new payments with full validation and account integration.
                    </p>
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        handleMakePayment();
                      }}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      Make New Payment
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
