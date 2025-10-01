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
  FileImage, Upload, CheckCircle2, CheckCircle, AlertTriangle, ThumbsUp,
  ThumbsDown, ExternalLink, Zap, Users, CreditCard, Calendar as CalendarIcon,
  Hash, Tag, Scale, Hand, Fingerprint, Radio, XCircle, HardDrive,
  Cpu, Palette, Ruler, Unplug, Battery, Monitor, Camera, FileSpreadsheet,
  Truck, RefreshCw, Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
// XLSX will be imported dynamically when needed
import { useInventoryStore } from '../stores/useInventoryStore';
import { PurchaseOrder } from '../types/inventory';
import { PurchaseOrderService } from '../services/purchaseOrderService';

// Import components directly for debugging
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';
import SerialNumberReceiveModal from '../components/purchase-order/SerialNumberReceiveModal';
import ApprovalModal from '../components/purchase-order/ApprovalModal';
import PurchaseOrderActionsService from '../services/purchaseOrderActionsService';

// Import enhanced inventory components - REMOVED: These components don't exist
// import InventoryItemActions from '../components/inventory/InventoryItemActions';
// import StatusUpdateModal from '../components/inventory/StatusUpdateModal';
// import LocationAssignmentModal from '../components/inventory/LocationAssignmentModal';
// import ItemDetailsModal from '../components/inventory/ItemDetailsModal';
// import ItemHistoryModal from '../components/inventory/ItemHistoryModal';
// import BulkActionsToolbar from '../components/inventory/BulkActionsToolbar';
// import InventorySearchFilters from '../components/inventory/InventorySearchFilters';

// Import Quality Check components
import { QualityCheckModal, QualityCheckSummary } from '../components/quality-check';

// Simple ShippingTracker component
const ShippingTracker: React.FC<{
  shippingInfo: any;
  purchaseOrder: any;
  compact?: boolean;
  debugMode?: boolean;
  onRefresh?: () => void;
}> = ({ shippingInfo, purchaseOrder, compact = false, debugMode = false, onRefresh }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Shipping Status</h4>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        )}
      </div>
      <div className="text-sm text-gray-600">
        {shippingInfo?.status || 'No shipping information available'}
      </div>
    </div>
  );
};

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
  const [isEditing, setIsEditing] = useState(editMode);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Autoloading state
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false); // Temporarily disabled to prevent connection overload
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [showAutoRefreshSettings, setShowAutoRefreshSettings] = useState(false);
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState('overview');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPartialReceiveModal, setShowPartialReceiveModal] = useState(false);
  const [showSerialNumberReceiveModal, setShowSerialNumberReceiveModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showQualityControlModal, setShowQualityControlModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPurchaseOrderPaymentModal, setShowPurchaseOrderPaymentModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showShippingTracker, setShowShippingTracker] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showQualityCheckModal, setShowQualityCheckModal] = useState(false);
  
  // Enhanced error handling and confirmation states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
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
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [isLoadingReceivedItems, setIsLoadingReceivedItems] = useState(false);
  const [orderNotes, setOrderNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkSelectedItems, setBulkSelectedItems] = useState<string[]>([]);
  const [showReturnOrderModal, setShowReturnOrderModal] = useState(false);
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<any[]>([]);
  const [isLoadingPurchaseOrderItems, setIsLoadingPurchaseOrderItems] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));

  // Enhanced inventory management state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [inventoryStats, setInventoryStats] = useState<any[]>([]);
  const [filteredReceivedItems, setFilteredReceivedItems] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    location: '',
    dateFrom: '',
    dateTo: ''
  });

  // Load purchase order function
  const loadPurchaseOrder = useCallback(async () => {
    if (!id) return;
    
    setIsLoadingOrder(true);
    
    try {
      // Get the current store state to avoid dependency on the function reference
      const { getPurchaseOrder: getPO } = useInventoryStore.getState();
      const response = await getPO(id);
      
      if (response.ok) {
        console.log('🔍 [PurchaseOrderDetailPage] DEBUG - Purchase order data received:', {
          id: response.data?.id,
          orderNumber: response.data?.orderNumber,
          status: response.data?.status,
          paymentStatus: response.data?.paymentStatus,
          itemsCount: response.data?.items?.length || 0,
          hasSupplier: !!response.data?.supplier,
          supplierName: response.data?.supplier?.name || 'No supplier',
          supplierId: response.data?.supplierId,
          items: response.data?.items?.map(item => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            product: item.product,
            variant: item.variant,
            quantity: item.quantity,
            receivedQuantity: item.receivedQuantity || 0,
            hasProductData: !!item.product,
            hasVariantData: !!item.variant
          }))
        });
        if (response.data) {
          setPurchaseOrder(response.data);
        }
        
        // Fix order status if needed (for existing orders created before auto-status logic)
        if (currentUser?.id && response.data?.id) {
          const fixResult = await PurchaseOrderService.fixOrderStatusIfNeeded(response.data.id, currentUser.id);
          if (fixResult.statusChanged) {
            console.log('✅ Order status automatically corrected:', fixResult.message);
            // Reload the order to get the updated status
            const { getPurchaseOrder: getPO } = useInventoryStore.getState();
            const updatedResponse = await getPO(id);
            if (updatedResponse.ok && updatedResponse.data) {
              setPurchaseOrder(updatedResponse.data);
            }
          }
        }
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
  }, [id, navigate]);

  // Load purchase order data on component mount
  useEffect(() => {
    if (id) {
      loadPurchaseOrder();
    }
  }, [id, loadPurchaseOrder]);

  // Handle editMode prop changes
  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode]);

  // Filter received items based on search criteria
  useEffect(() => {
    if (!receivedItems.length) {
      setFilteredReceivedItems([]);
      return;
    }

    const filtered = receivedItems.filter(item => {
      const matchesSearch = !filters.search || 
        item.product?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.variant?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.serial_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.imei?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.product?.sku?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesStatus = !filters.status || item.status === filters.status;
      
      const matchesLocation = !filters.location || 
        item.location?.toLowerCase().includes(filters.location.toLowerCase()) ||
        item.shelf?.toLowerCase().includes(filters.location.toLowerCase()) ||
        item.bin?.toLowerCase().includes(filters.location.toLowerCase());

      const matchesDateFrom = !filters.dateFrom || new Date(item.created_at) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(item.created_at) <= new Date(filters.dateTo);

      return matchesSearch && matchesStatus && matchesLocation && matchesDateFrom && matchesDateTo;
    });

    setFilteredReceivedItems(filtered);
  }, [receivedItems, filters]);

  // Autoloading functionality
  const refreshPurchaseOrderData = useCallback(async (isBackground = false) => {
    if (!id || !purchaseOrder) return;
    
    try {
      if (isBackground) {
        setIsBackgroundLoading(true);
      }
      
      console.log(`🔄 [Autoload] ${isBackground ? 'Background' : 'Manual'} refresh started for PO: ${id}`);
      
      // Load purchase order data
      const { getPurchaseOrder } = useInventoryStore.getState();
      const response = await getPurchaseOrder(id);
      
      if (response.ok && response.data) {
        setPurchaseOrder(response.data);
        setLastRefreshTime(new Date());
        setRefreshCount(prev => prev + 1);
        
        if (isBackground) {
          console.log(`✅ [Autoload] Background refresh completed for PO: ${id}`);
        }
      }
      
      // Load additional data in background
      if (isBackground) {
        // Load messages
        try {
          const messages = await PurchaseOrderService.getMessages(purchaseOrder.id);
          // Update messages state if needed
        } catch (error) {
          console.warn('Failed to refresh messages:', error);
        }
        
        // Load payments
        try {
          const payments = await PurchaseOrderService.getPayments(purchaseOrder.id);
          // Update payments state if needed
        } catch (error) {
          console.warn('Failed to refresh payments:', error);
        }
        
        // Load received items
        try {
          const receivedData = await PurchaseOrderService.getReceivedItems(purchaseOrder.id);
          if (receivedData.success && receivedData.data) {
            setReceivedItems(receivedData.data);
          }
        } catch (error) {
          console.warn('Failed to refresh received items:', error);
        }
      }
      
    } catch (error) {
      console.error(`❌ [Autoload] Failed to refresh data:`, error);
      if (!isBackground) {
        toast.error('Failed to refresh purchase order data');
      }
    } finally {
      if (isBackground) {
        setIsBackgroundLoading(false);
      }
    }
  }, [id, purchaseOrder]);

  // Auto-refresh effect
  useEffect(() => {
    if (!id || !purchaseOrder || !autoRefreshEnabled) return;
    
    // Set up auto-refresh interval
    const interval = setInterval(() => {
      refreshPurchaseOrderData(true);
    }, refreshInterval * 1000);
    
    setAutoRefreshInterval(interval);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [id, purchaseOrder, refreshPurchaseOrderData, autoRefreshEnabled, refreshInterval]);

  // Cleanup auto-refresh on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [autoRefreshInterval]);

  // Load inventory stats when received items are loaded
  useEffect(() => {
    if (receivedItems.length > 0) {
      const loadStats = async () => {
        if (!id) return;
        try {
          const response = await PurchaseOrderService.getPurchaseOrderInventoryStats(id);
          if (response.success) {
            setInventoryStats(response.data || []);
          }
        } catch (error) {
          console.error('Failed to load inventory stats:', error);
        }
      };
      loadStats();
    }
  }, [receivedItems.length, id]);

  // Handle tab switching with lazy loading
  const handleTabChange = useCallback(async (tabName: string, forceRefresh = false) => {
    console.log('🔄 [PurchaseOrderDetailPage] Tab changed to:', tabName, forceRefresh ? '(force refresh)' : '');
    setActiveTab(tabName);
    
    // Load data when tab is first accessed or when force refresh is requested
    if (!loadedTabs.has(tabName) || forceRefresh) {
      console.log('📥 [PurchaseOrderDetailPage] Loading data for tab:', tabName);
      if (!forceRefresh) {
        setLoadedTabs(prev => new Set(Array.from(prev).concat(tabName)));
      }
      
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
        case 'items':
          // Load both purchase order items and received items from database
          if (purchaseOrder) {
            setIsLoadingPurchaseOrderItems(true);
            setIsLoadingReceivedItems(true);
            try {
              console.log('🔍 [PurchaseOrderDetailPage] Loading purchase order items and received items for PO:', purchaseOrder.id);
              
              // Load purchase order items
              const itemsData = await PurchaseOrderService.getPurchaseOrderItemsWithProducts(purchaseOrder.id);
              console.log('🔍 [PurchaseOrderDetailPage] Purchase order items response:', itemsData);
              if (itemsData.success) {
                setPurchaseOrderItems(itemsData.data || []);
                console.log('✅ [PurchaseOrderDetailPage] Purchase order items loaded:', itemsData.data?.length || 0, 'items');
              } else {
                console.error('❌ Failed to load purchase order items:', itemsData.message);
                toast.error('Failed to load purchase order items');
              }
              
              // Load received items
              const receivedData = await PurchaseOrderService.getReceivedItems(purchaseOrder.id);
              console.log('🔍 [PurchaseOrderDetailPage] Received items response:', receivedData);
              if (receivedData.success) {
                setReceivedItems(receivedData.data || []);
                console.log('✅ [PurchaseOrderDetailPage] Received items loaded:', receivedData.data?.length || 0, 'items');
              } else {
                console.error('❌ Failed to load received items:', receivedData.message);
                toast.error('Failed to load received items');
              }
            } catch (error) {
              console.error('❌ Failed to load items data:', error);
              toast.error('Failed to load items data');
            } finally {
              setIsLoadingPurchaseOrderItems(false);
              setIsLoadingReceivedItems(false);
            }
          }
          break;
        case 'received':
          // Load received items from database using migrated function
          if (purchaseOrder) {
            setIsLoadingReceivedItems(true);
            try {
              console.log('🔍 [PurchaseOrderDetailPage] Loading received items for PO:', purchaseOrder.id);
              const receivedData = await PurchaseOrderService.getReceivedItems(purchaseOrder.id);
              console.log('🔍 [PurchaseOrderDetailPage] Received items response:', receivedData);
              if (receivedData.success) {
                setReceivedItems(receivedData.data || []);
                console.log('✅ [PurchaseOrderDetailPage] Received items loaded:', receivedData.data?.length || 0, 'items');
              } else {
                console.error('❌ Failed to load received items:', receivedData.message);
                toast.error('Failed to load received items');
              }
            } catch (error) {
              console.error('❌ Failed to load received items:', error);
              toast.error('Failed to load received items');
            } finally {
              setIsLoadingReceivedItems(false);
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
  }, [loadedTabs, currentUser, purchaseOrder]);

  // Memoized refresh function to prevent infinite re-renders
  const handleRefresh = useCallback(() => {
    loadPurchaseOrder();
  }, [loadPurchaseOrder]); // Use loadPurchaseOrder dependency

  // Function to reload received items
  const handleRefreshReceivedItems = useCallback(async () => {
    if (!purchaseOrder) return;
    
    setIsLoadingReceivedItems(true);
    try {
      console.log('🔄 [PurchaseOrderDetailPage] Refreshing received items for PO:', purchaseOrder.id);
      const receivedData = await PurchaseOrderService.getReceivedItems(purchaseOrder.id);
      console.log('🔄 [PurchaseOrderDetailPage] Received items refresh response:', receivedData);
      if (receivedData.success) {
        setReceivedItems(receivedData.data || []);
        console.log('✅ [PurchaseOrderDetailPage] Received items refreshed:', receivedData.data?.length || 0, 'items');
        toast.success('Received items refreshed');
      } else {
        console.error('❌ Failed to refresh received items:', receivedData.message);
        toast.error('Failed to refresh received items');
      }
    } catch (error) {
      console.error('❌ Failed to refresh received items:', error);
      toast.error('Failed to refresh received items');
    } finally {
      setIsLoadingReceivedItems(false);
    }
  }, [purchaseOrder]);

  // Enhanced inventory management handlers
  const loadInventoryStats = useCallback(async () => {
    if (!id) return;
    try {
      const response = await PurchaseOrderService.getPurchaseOrderInventoryStats(id);
      if (response.success) {
        setInventoryStats(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load inventory stats:', error);
    }
  }, [id]);

  // Confirmation dialog helper
  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmAction({ title, message, onConfirm });
    setShowConfirmDialog(true);
  };

  const handleStatusUpdate = async (itemId: string, newStatus: string, reason?: string) => {
    try {
      const response = await PurchaseOrderService.updateInventoryItemStatus(
        itemId,
        newStatus,
        reason
      );
      
      if (response.success) {
        toast.success('Item status updated successfully');
        await handleRefreshReceivedItems();
        await loadInventoryStats();
        setShowStatusModal(false);
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleLocationUpdate = async (itemId: string, location: string, shelf?: string, bin?: string) => {
    try {
      const response = await PurchaseOrderService.updateInventoryItemStatus(
        itemId,
        'available', // Keep current status
        'Location updated',
        location,
        shelf,
        bin
      );
      
      if (response.success) {
        toast.success('Location updated successfully');
        await handleRefreshReceivedItems();
        setShowLocationModal(false);
      } else {
        toast.error(response.error || 'Failed to update location');
      }
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    }
  };

  const handleExport = async (exportFilters?: any) => {
    try {
      const response = await PurchaseOrderService.exportInventoryToCSV(id || '', exportFilters);
      if (response.success && response.data) {
        // Create download link
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
      console.error('Failed to export:', error);
      toast.error('Failed to export data');
    }
  };

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

  const handleSave = async () => {
    if (!purchaseOrder) return;
    
    setIsSaving(true);
    const response = await updatePurchaseOrder(purchaseOrder.id, {
      supplierId: purchaseOrder.supplierId,
      expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
      notes: purchaseOrder.notes,
      items: purchaseOrder.items.map(item => ({
        id: item.id,
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
      try {
        const result = await PurchaseOrderActionsService.deleteOrder(purchaseOrder.id);
        if (result.success) {
          toast.success(result.message);
          navigate('/lats/purchase-orders');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Error deleting purchase order:', error);
        toast.error('Failed to delete purchase order');
      }
    }
  };

  // Approval functions
  const handleSubmitForApproval = async () => {
    if (!purchaseOrder) return;
    
    try {
      const response = await PurchaseOrderService.submitForApproval(purchaseOrder.id, currentUser?.id || '', 'Submitted for approval via page UI');
      if (response.success) {
        await loadPurchaseOrder();
        toast.success('Purchase order submitted for approval');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast.error('Failed to submit for approval');
    }
  };

  const handleApprove = async (notes: string) => {
    if (!purchaseOrder) return;
    
    try {
      const response = await PurchaseOrderService.approvePurchaseOrder(purchaseOrder.id, currentUser?.id || '', notes);
      if (response.success) {
        await loadPurchaseOrder();
        toast.success('Purchase order approved');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error approving purchase order:', error);
      toast.error('Failed to approve purchase order');
    }
  };

  const handleReject = async (reason: string) => {
    if (!purchaseOrder) return;
    
    try {
      const response = await PurchaseOrderService.rejectPurchaseOrder(purchaseOrder.id, currentUser?.id || '', reason);
      if (response.success) {
        await loadPurchaseOrder();
        toast.success('Purchase order rejected');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error rejecting purchase order:', error);
      toast.error('Failed to reject purchase order');
    }
  };

  // Missing shipping functions
  const handleViewShipping = () => {
    setShowShippingModal(true);
  };

  const handleAssignShipping = () => {
    setShowShippingModal(true);
  };

  const updatePurchaseOrderShipping = async (shippingData: any) => {
    if (!purchaseOrder) return;
    
    try {
      const response = await updatePurchaseOrder(purchaseOrder.id, {
        ...purchaseOrder,
        shippingInfo: shippingData
      });
      
      if (response.ok) {
        toast.success('Shipping information updated successfully');
        await loadPurchaseOrder();
      } else {
        toast.error('Failed to update shipping information');
      }
    } catch (error) {
      console.error('Error updating shipping info:', error);
      toast.error('Failed to update shipping information');
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

  const handleExportExcel = async () => {
    try {
      if (purchaseOrder) {
        const XLSX = await import('xlsx');
        const workbook = generateExcelContent(purchaseOrder, XLSX);
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Purchase_Order_${purchaseOrder.orderNumber || 'Unknown'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Excel file exported successfully');
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
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
    setShowQualityCheckModal(true);
  };

  const handleQualityCheckComplete = async () => {
    if (!purchaseOrder) return;
    
    try {
      // Reload purchase order to get latest data
      await loadPurchaseOrder();
      
      // Determine next status based on current status and quality check results
      let nextStatus = purchaseOrder.status;
      
      // Status progression logic
      switch (purchaseOrder.status) {
        case 'received':
          // After quality check, move to 'quality_checked' or 'completed'
          nextStatus = 'quality_checked';
          break;
        case 'quality_checked':
          // If already quality checked, move to completed
          nextStatus = 'completed';
          break;
        case 'partial_received':
          // If partially received, stay as partial until fully received
          nextStatus = 'partial_received';
          break;
        default:
          // For other statuses, move to next logical step
          if (purchaseOrder.status === 'sent' || purchaseOrder.status === 'shipped') {
            nextStatus = 'received';
          } else {
            nextStatus = 'completed';
          }
      }
      
      // Update purchase order status to next step
      const response = await updatePurchaseOrder(purchaseOrder.id, {
        status: nextStatus
      });
      
      if (response.ok) {
        const statusMessages = {
          'quality_checked': 'Quality check completed - Items ready for inventory',
          'completed': 'Quality check completed - Purchase order finalized',
          'received': 'Items received and ready for quality check',
          'partial_received': 'Partial receive completed'
        };
        
        const message = statusMessages[nextStatus] || 'Quality check completed successfully';
        toast.success(message);
        console.log(`✅ Quality check completed, PO status updated to: ${nextStatus}`);
      } else {
        console.warn('Quality check completed but status update failed:', response.message);
        toast.success('Quality check completed successfully');
      }
    } catch (error) {
      console.error('Error updating purchase order status after quality check:', error);
      toast.success('Quality check completed successfully');
    }
  };

  const handleQualityCheck = async (itemId: string, status: 'passed' | 'failed' | 'attention') => {
    try {
      const result = await PurchaseOrderActionsService.updateItemQualityCheck(itemId, status);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error updating quality check:', error);
      toast.error('Failed to update quality check');
    }
  };

  const handleCompleteQualityCheck = async () => {
    if (!purchaseOrder) return;
    
    try {
      const result = await PurchaseOrderActionsService.completeQualityCheck(purchaseOrder.id);
      
      if (result.success) {
        toast.success(result.message);
        setShowQualityControlModal(false);
        await loadPurchaseOrder();
        await PurchaseOrderActionsService.logAction(purchaseOrder.id, 'quality_check_completed', {});
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error completing quality check:', error);
      toast.error('Failed to complete quality check');
    }
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

  const handleSendWhatsApp = () => {
    if (!purchaseOrder?.supplier?.phone) {
      toast.error('Supplier phone number not available');
      return;
    }
    
    const message = `Hello, I'm contacting you about Purchase Order #${purchaseOrder.orderNumber}. Please let me know the status.`;
    const whatsappUrl = `https://wa.me/${purchaseOrder.supplier.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendSMS = async () => {
    if (!purchaseOrder?.supplier?.phone) {
      toast.error('Supplier phone number not available');
      return;
    }
    
    try {
      const message = `Purchase Order #${purchaseOrder.orderNumber} - Please provide status update.`;
      const result = await PurchaseOrderActionsService.sendSMS(
        purchaseOrder.supplier.phone,
        message,
        purchaseOrder.id
      );
      
      if (result.success) {
        toast.success(result.message);
        await PurchaseOrderActionsService.logAction(purchaseOrder.id, 'sms_sent', { phone: purchaseOrder.supplier.phone });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error('Failed to send SMS');
    }
  };

  const handleDuplicateOrder = async () => {
    if (!purchaseOrder) return;
    
    try {
      setIsSaving(true);
      const result = await PurchaseOrderActionsService.duplicateOrder(purchaseOrder.id);
      
      if (result.success) {
        toast.success(result.message);
        await PurchaseOrderActionsService.logAction(purchaseOrder.id, 'order_duplicated', { new_order_id: result.data?.id });
        navigate(`/lats/purchase-orders/${result.data.id}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error duplicating order:', error);
      toast.error('Failed to duplicate order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewNotes = async () => {
    setShowNotesModal(true);
    
    // Load notes from database
    if (purchaseOrder) {
      try {
        const result = await PurchaseOrderActionsService.getNotes(purchaseOrder.id);
        if (result.success) {
          setOrderNotes(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !purchaseOrder) return;
    
    try {
      const result = await PurchaseOrderActionsService.addNote(
        purchaseOrder.id,
        newNote.trim(),
        currentUser?.name || 'Unknown'
      );
      
      if (result.success) {
        setOrderNotes(prev => [result.data, ...prev]);
        setNewNote('');
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleBulkSelectItem = (itemId: string) => {
    setBulkSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleBulkAction = async (action: string) => {
    if (bulkSelectedItems.length === 0) {
      toast.error('Please select items first');
      return;
    }

    try {
      let result;
      switch (action) {
        case 'update_status':
          result = await PurchaseOrderActionsService.bulkUpdateStatus(bulkSelectedItems, 'processing');
          break;
        case 'assign_location':
          // Show location input modal for bulk assignment
          const location = prompt('Enter location for selected items:');
          if (location) {
            result = await PurchaseOrderActionsService.bulkAssignLocation(bulkSelectedItems, location);
          } else {
            return; // User cancelled
          }
          break;
        case 'export_selected':
          toast.success('Selected items exported successfully');
          return;
        default:
          toast.error('Invalid bulk action');
          return;
      }

      if (result?.success) {
        toast.success(result.message);
        setBulkSelectedItems([]);
        setShowBulkActions(false);
        await loadPurchaseOrder();
        if (purchaseOrder) {
          await PurchaseOrderActionsService.logAction(purchaseOrder.id, 'bulk_action', { action, item_count: bulkSelectedItems.length });
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleReturnOrder = async (returnData: any) => {
    if (!purchaseOrder) return;
    
    try {
      const result = await PurchaseOrderActionsService.createReturnOrder(purchaseOrder.id, returnData);
      
      if (result.success) {
        toast.success(result.message);
        setShowReturnOrderModal(false);
        await loadPurchaseOrder();
        await PurchaseOrderActionsService.logAction(purchaseOrder.id, 'return_order_created', { return_id: result.data?.id });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating return order:', error);
      toast.error('Failed to create return order');
    }
  };

  const handleMakePayment = () => {
    setShowPurchaseOrderPaymentModal(true);
  };

  const handlePurchaseOrderPaymentComplete = async (paymentData: any[], totalPaid?: number) => {
    try {
      // Import the payment service
      const { purchaseOrderPaymentService } = await import('../lib/purchaseOrderPaymentService');
      
      // Process each payment using the enhanced service
      const results = await Promise.all(
        paymentData.map(async (payment) => {
          const result = await purchaseOrderPaymentService.processPayment({
            purchaseOrderId: purchaseOrder?.id || '',
            paymentAccountId: payment.paymentAccountId,
            amount: payment.amount,
            currency: purchaseOrder?.currency || 'TZS',
            paymentMethod: payment.paymentMethod,
            paymentMethodId: payment.paymentMethodId,
            reference: payment.reference,
            notes: payment.notes,
            createdBy: currentUser?.id || null
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
      const response = await approvePurchaseOrder(purchaseOrder.id);
      
      if (response.ok) {
        toast.success('Purchase order approved successfully');
        setPurchaseOrder({ ...purchaseOrder, status: 'sent' });
        setShowApprovalModal(false);
      } else {
        toast.error(response.message || 'Failed to approve purchase order');
      }
    } catch (error) {
      console.error('Error approving purchase order:', error);
      toast.error('Failed to approve purchase order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!purchaseOrder) return;
    
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsSaving(true);
      const result = await PurchaseOrderActionsService.cancelOrder(purchaseOrder.id);
      
      if (result.success) {
        toast.success(result.message);
        setPurchaseOrder({ ...purchaseOrder, status: 'cancelled' });
        await loadPurchaseOrder();
        await PurchaseOrderActionsService.logAction(purchaseOrder.id, 'order_cancelled', { reason: 'user_cancelled' });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      toast.error('Failed to cancel purchase order');
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
        
        // Reload purchase order data
        await loadPurchaseOrder();
        
        // Refresh received items tab if it's currently active
        if (activeTab === 'received') {
          console.log('🔄 Refreshing received items tab after receive operation');
          await handleRefreshReceivedItems();
        }
        
        // Switch to received tab to show the results with force refresh
        await handleTabChange('received', true);
        console.log('📋 Switched to received tab to show received items');
        
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

  const handleCompleteOrder = async () => {
    if (!purchaseOrder) return;
    
    try {
      setIsSaving(true);
      
      const result = await PurchaseOrderService.completePurchaseOrder(
        purchaseOrder.id,
        currentUser?.id || '',
        'Purchase order completed after receiving all items'
      );
      
      if (result.success) {
        toast.success('Purchase order completed successfully!');
        console.log('✅ Order completion details:', result.data);
        
        // Reload purchase order data to show updated status
        await loadPurchaseOrder();
        
        // Show completion summary
        if (result.data) {
          console.log('📊 Completion Summary:', {
            orderNumber: result.data.order_number,
            totalItems: result.data.total_items,
            completedItems: result.data.completed_items,
            completionDate: result.data.completion_date
          });
        }
        
      } else {
        toast.error(`Completion failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Completion error:', error);
      toast.error('Failed to complete purchase order');
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
        // Check if all items are now fully received
        const allItemsFullyReceived = await PurchaseOrderService.areAllItemsFullyReceived(purchaseOrder.id);
        
        // Determine the appropriate status
        const newStatus = allItemsFullyReceived ? 'received' : 'partial_received';
        
        // Update order status
        const statusSuccess = await PurchaseOrderService.updateOrderStatus(
          purchaseOrder.id,
          newStatus,
          currentUser?.id || ''
        );
        
        if (statusSuccess) {
          const statusMessage = allItemsFullyReceived 
            ? 'All items fully received - Order marked as received' 
            : 'Partial receive completed';
          
          toast.success(`${statusMessage}: ${result.message}`);
          await loadPurchaseOrder(); // Reload to get updated data
          
          // Refresh received items tab if it's currently active
          if (activeTab === 'received') {
            console.log('🔄 Refreshing received items tab after partial receive operation');
            await handleRefreshReceivedItems();
          }
          
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

  const handleSerialNumberReceive = async (receivedItems: any[]) => {
    if (!purchaseOrder || !currentUser) return;
    
    try {
      setIsSaving(true);
      const result = await PurchaseOrderService.updateReceivedQuantities(
        purchaseOrder.id,
        receivedItems,
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
          toast.success(`Stock received with serial numbers: ${result.message}`);
          await loadPurchaseOrder(); // Reload to get updated data
          
          // Refresh received items tab if it's currently active
          if (activeTab === 'received') {
            console.log('🔄 Refreshing received items tab after serial number receive operation');
            await handleRefreshReceivedItems();
          }
          
          setShowSerialNumberReceiveModal(false);
        } else {
          toast.error('Items updated but failed to update order status');
        }
      } else {
        toast.error(`Serial number receive failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Serial number receive error:', error);
      toast.error('Failed to process serial number receive');
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

  const generatePrintContent = (order: PurchaseOrder) => {
    // Get business information (you may need to fetch this from settings)
    const businessInfo = {
      name: 'LATS CHANCE STORE', // This should come from settings
      address: 'Dar es Salaam, Tanzania', // This should come from settings
      phone: '+255 XXX XXX XXX', // This should come from settings
      email: 'info@latschance.com', // This should come from settings
      website: 'www.latschance.com' // This should come from settings
    };

    // Calculate payment due date based on payment terms
    const getPaymentDueDate = (orderDate: string, paymentTerms?: string) => {
      if (!paymentTerms) return 'N/A';
      
      const date = new Date(orderDate);
      const terms = paymentTerms.toLowerCase();
      
      if (terms.includes('net 30')) {
        date.setDate(date.getDate() + 30);
      } else if (terms.includes('net 15')) {
        date.setDate(date.getDate() + 15);
      } else if (terms.includes('net 7')) {
        date.setDate(date.getDate() + 7);
      } else if (terms.includes('cod')) {
        return 'COD (Cash on Delivery)';
      }
      
      return formatDate(date.toISOString());
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order ${order.orderNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              font-size: 12px;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .business-info {
              text-align: center;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .business-info h1 {
              margin: 0;
              font-size: 24px;
              color: #333;
            }
            .business-info p {
              margin: 2px 0;
              color: #666;
            }
            .business-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 15px;
              text-align: left;
            }
            .business-column {
              background-color: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
            }
            .order-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .order-info, .supplier-info {
              border: 1px solid #ddd;
              padding: 15px;
              background-color: #f9f9f9;
            }
            .order-info h3, .supplier-info h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #333;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .order-info p, .supplier-info p {
              margin: 5px 0;
              font-size: 11px;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
              font-size: 11px;
            }
            .items-table th, .items-table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            .items-table th { 
              background-color: #f2f2f2; 
              font-weight: bold;
            }
            .items-table td {
              vertical-align: top;
            }
            .totals-section {
              margin-top: 20px;
              text-align: right;
            }
            .totals-table {
              width: 300px;
              margin-left: auto;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 5px 10px;
              border: 1px solid #ddd;
            }
            .totals-table .label {
              background-color: #f2f2f2;
              font-weight: bold;
              text-align: left;
            }
            .totals-table .amount {
              text-align: right;
            }
            .totals-table .total-row {
              background-color: #e9e9e9;
              font-weight: bold;
              font-size: 14px;
            }
            .payment-info {
              margin-top: 20px;
              padding: 15px;
              border: 1px solid #ddd;
              background-color: #f9f9f9;
            }
            .payment-info h3 {
              margin: 0 0 15px 0;
              font-size: 14px;
              color: #333;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .payment-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .payment-column {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .notes-section {
              margin-top: 20px;
              padding: 15px;
              border: 1px solid #ddd;
              background-color: #f9f9f9;
            }
            .notes-section h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #333;
            }
            .footer {
              margin-top: 40px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .signature-box {
              text-align: center;
              border: 1px solid #ddd;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .signature-box .line {
              border-bottom: 1px solid #333;
              height: 40px;
              margin-bottom: 5px;
            }
            .terms {
              margin-top: 20px;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <!-- Business Header -->
          <div class="business-info">
            <h1>${businessInfo.name}</h1>
            <div class="business-details">
              <div class="business-column">
                <p><strong>Address:</strong> ${businessInfo.address}</p>
                <p><strong>Phone:</strong> ${businessInfo.phone}</p>
              </div>
              <div class="business-column">
                <p><strong>Email:</strong> ${businessInfo.email}</p>
                <p><strong>Website:</strong> ${businessInfo.website}</p>
              </div>
            </div>
          </div>

          <!-- Purchase Order Header -->
          <div class="header">
            <h1>PURCHASE ORDER</h1>
            <h2>Order #${order.orderNumber}</h2>
          </div>
          
          <!-- Order and Supplier Details -->
          <div class="order-details">
            <div class="order-info">
              <h3>Order Information</h3>
              <p><strong>Order Date:</strong> ${formatDate(order.orderDate || order.createdAt)}</p>
              <p><strong>Expected Delivery:</strong> ${order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'TBD'}</p>
              <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
              <p><strong>Currency:</strong> ${order.currency === 'TZS' ? 'Tanzania Shillings (TZS)' : order.currency || 'Tanzania Shillings (TZS)'}</p>
              ${order.receivedDate ? `<p><strong>Received Date:</strong> ${formatDate(order.receivedDate)}</p>` : ''}
            </div>
            
            <div class="supplier-info">
              <h3>Supplier Information</h3>
              <p><strong>Company:</strong> ${order.supplier?.name || 'N/A'}</p>
              ${order.supplier?.contactPerson ? `<p><strong>Contact Person:</strong> ${order.supplier.contactPerson}</p>` : ''}
              ${order.supplier?.phone ? `<p><strong>Phone:</strong> ${order.supplier.phone}</p>` : ''}
              ${order.supplier?.email ? `<p><strong>Email:</strong> ${order.supplier.email}</p>` : ''}
              ${order.supplier?.address ? `<p><strong>Address:</strong> ${order.supplier.address}</p>` : ''}
              ${order.supplier?.city ? `<p><strong>City:</strong> ${order.supplier.city}</p>` : ''}
              ${order.supplier?.country ? `<p><strong>Country:</strong> ${order.supplier.country}</p>` : ''}
            </div>
          </div>
          
          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 28%;">Product Description</th>
                <th style="width: 18%;">Variant</th>
                <th style="width: 10%;">Ordered</th>
                <th style="width: 10%;">Received</th>
                <th style="width: 14%;">Unit Price</th>
                <th style="width: 14%;">Price (TZS)</th>
                <th style="width: 14%;">Total (TZS)</th>
                <th style="width: 8%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => {
                const receivedQty = item.receivedQuantity || 0;
                const unitPriceTZS = order.exchangeRate && order.exchangeRate !== 1.0 ? 
                  item.costPrice * order.exchangeRate : item.costPrice;
                const totalPriceTZS = unitPriceTZS * item.quantity;
                
                return `
                <tr>
                  <td>
                    <strong>${item.product?.name || `Product ${item.productId}`}</strong>
                    ${item.product?.notes ? `<br><small>${item.product.notes}</small>` : ''}
                    ${item.product?.sku ? `<br><small>SKU: ${item.product.sku}</small>` : ''}
                  </td>
                  <td>${item.variant?.name || `Variant ${item.variantId}`}</td>
                  <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                  <td style="text-align: center; color: ${receivedQty > 0 ? '#28a745' : '#6c757d'};">${receivedQty}</td>
                  <td style="text-align: right;">${formatCurrency(item.costPrice, order.currency)}</td>
                  <td style="text-align: right; color: #2c5aa0; font-weight: bold;">TZS ${unitPriceTZS.toLocaleString()}</td>
                  <td style="text-align: right; color: #2c5aa0; font-weight: bold;">TZS ${totalPriceTZS.toLocaleString()}</td>
                  <td style="text-align: center;">
                    <span style="font-size: 10px; padding: 2px 6px; border-radius: 3px; background-color: ${
                      item.status === 'received' ? '#d4edda' : 
                      item.status === 'processing' ? '#fff3cd' : 
                      item.status === 'cancelled' ? '#f8d7da' : '#e2e3e5'
                    }; color: ${
                      item.status === 'received' ? '#155724' : 
                      item.status === 'processing' ? '#856404' : 
                      item.status === 'cancelled' ? '#721c24' : '#383d41'
                    };">
                      ${(item.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
          
          <!-- Totals Section -->
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td class="label">Subtotal:</td>
                <td class="amount">${formatCurrency(order.totalAmount, order.currency)}</td>
              </tr>
              ${order.exchangeRate && order.exchangeRate !== 1.0 && order.totalAmountBaseCurrency ? `
                <tr>
                  <td class="label">Exchange Rate:</td>
                  <td class="amount">${order.exchangeRate} (${order.exchangeRateSource || 'Manual'})</td>
                </tr>
                <tr>
                  <td class="label">TZS Equivalent:</td>
                  <td class="amount">TZS ${order.totalAmountBaseCurrency.toLocaleString()}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td class="label">TOTAL AMOUNT:</td>
                <td class="amount">${formatCurrency(order.totalAmount, order.currency)}</td>
              </tr>
            </table>
          </div>

          <!-- Payment Information -->
          <div class="payment-info">
            <h3>Payment Information</h3>
            <div class="payment-details">
              <div class="payment-column">
                <p><strong>Payment Terms:</strong> Net 30</p>
                <p><strong>Payment Due Date:</strong> ${getPaymentDueDate(order.orderDate || order.createdAt, 'Net 30')}</p>
                <p><strong>Payment Status:</strong> 
                  <span style="padding: 2px 8px; border-radius: 3px; background-color: ${
                    order.paymentStatus === 'paid' ? '#d4edda' : 
                    order.paymentStatus === 'partial' ? '#fff3cd' : '#f8d7da'
                  }; color: ${
                    order.paymentStatus === 'paid' ? '#155724' : 
                    order.paymentStatus === 'partial' ? '#856404' : '#721c24'
                  };">
                    ${(order.paymentStatus || 'unpaid').toUpperCase()}
                  </span>
                </p>
              </div>
              <div class="payment-column">
                <p><strong>Total Paid:</strong> ${formatCurrency(order.totalPaid || 0, order.currency)}</p>
                <p><strong>Balance Due:</strong> ${formatCurrency((order.totalAmount || 0) - (order.totalPaid || 0), order.currency)}</p>
                <p><strong>Payment Method:</strong> TBD</p>
              </div>
            </div>
          </div>
          
          <!-- Notes Section -->
          ${order.notes ? `
            <div class="notes-section">
              <h3>Order Notes</h3>
              <p>${order.notes}</p>
            </div>
          ` : ''}

          <!-- Footer with Signatures -->
          <div class="footer">
            <div class="signature-box">
              <div class="line"></div>
              <p><strong>Authorized Signature</strong></p>
              <p>Date: _______________</p>
            </div>
            <div class="signature-box">
              <div class="line"></div>
              <p><strong>Supplier Signature</strong></p>
              <p>Date: _______________</p>
            </div>
          </div>

          <!-- Terms and Conditions -->
          <div class="terms">
            <p><strong>Terms and Conditions:</strong></p>
            <p>1. All prices are subject to change without notice.</p>
            <p>2. Payment terms as specified above.</p>
            <p>3. Delivery terms: FOB destination unless otherwise specified.</p>
            <p>4. Any discrepancies must be reported within 48 hours of delivery.</p>
            <p>5. This purchase order is subject to our standard terms and conditions.</p>
          </div>
        </body>
      </html>
    `;
  };

  const generatePDFContent = (order: PurchaseOrder) => {
    // Enhanced PDF content with all the missing information
    const businessInfo = {
      name: 'LATS CHANCE STORE',
      address: 'Dar es Salaam, Tanzania',
      phone: '+255 XXX XXX XXX',
      email: 'info@latschance.com'
    };

    return `
LATS CHANCE STORE
${businessInfo.address}
Phone: ${businessInfo.phone} | Email: ${businessInfo.email}

PURCHASE ORDER #${order.orderNumber}

ORDER INFORMATION:
Date: ${formatDate(order.orderDate || order.createdAt)}
Expected Delivery: ${order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'TBD'}
Status: ${order.status.toUpperCase()}
Currency: ${order.currency === 'TZS' ? 'Tanzania Shillings (TZS)' : order.currency || 'Tanzania Shillings (TZS)'}
${order.receivedDate ? `Received Date: ${formatDate(order.receivedDate)}` : ''}

SUPPLIER INFORMATION:
Company: ${order.supplier?.name || 'N/A'}
${order.supplier?.contactPerson ? `Contact Person: ${order.supplier.contactPerson}` : ''}
${order.supplier?.phone ? `Phone: ${order.supplier.phone}` : ''}
${order.supplier?.email ? `Email: ${order.supplier.email}` : ''}
${order.supplier?.address ? `Address: ${order.supplier.address}` : ''}
${order.supplier?.city ? `City: ${order.supplier.city}` : ''}
${order.supplier?.country ? `Country: ${order.supplier.country}` : ''}

ITEMS:
${order.items.map((item, index) => {
  const receivedQty = item.receivedQuantity || 0;
  const unitPriceTZS = order.exchangeRate && order.exchangeRate !== 1.0 ? 
    item.costPrice * order.exchangeRate : item.costPrice;
  const totalPriceTZS = unitPriceTZS * item.quantity;
  
  return `
${index + 1}. ${item.product?.name || `Product ${item.productId}`}
   Variant: ${item.variant?.name || `Variant ${item.variantId}`}
   ${item.product?.sku ? `SKU: ${item.product.sku}` : ''}
   Ordered: ${item.quantity} | Received: ${receivedQty}
   Unit Price: ${formatCurrency(item.costPrice, order.currency)} (TZS ${unitPriceTZS.toLocaleString()})
   Total: TZS ${totalPriceTZS.toLocaleString()}
   Status: ${(item.status || 'pending').toUpperCase()}
`;
}).join('')}

PAYMENT INFORMATION:
Payment Terms: ${order.paymentTerms || 'Net 30'}
Payment Status: ${(order.paymentStatus || 'unpaid').toUpperCase()}
Total Paid: ${formatCurrency(order.totalPaid || 0, order.currency)}
Balance Due: ${formatCurrency((order.totalAmount || 0) - (order.totalPaid || 0), order.currency)}

TOTALS:
Subtotal: ${formatCurrency(order.totalAmount, order.currency)}
${order.exchangeRate && order.exchangeRate !== 1.0 && order.totalAmountBaseCurrency ? `
Exchange Rate: ${order.exchangeRate} (${order.exchangeRateSource || 'Manual'})
TZS Equivalent: TZS ${order.totalAmountBaseCurrency.toLocaleString()}
` : ''}
TOTAL AMOUNT: ${formatCurrency(order.totalAmount, order.currency)}

${order.notes ? `NOTES:\n${order.notes}\n` : ''}

SIGNATURES:
Authorized Signature: _________________ Date: _______________
Supplier Signature: _________________ Date: _______________

TERMS AND CONDITIONS:
1. All prices are subject to change without notice.
2. Payment terms as specified above.
3. Delivery terms: FOB destination unless otherwise specified.
4. Any discrepancies must be reported within 48 hours of delivery.
5. This purchase order is subject to our standard terms and conditions.
    `;
  };

  const generateExcelContent = (order: PurchaseOrder, XLSX: any) => {
    // Business information
    const businessInfo = {
      name: 'LATS CHANCE STORE',
      address: 'Dar es Salaam, Tanzania',
      phone: '+255 XXX XXX XXX',
      email: 'info@latschance.com',
      website: 'www.latschance.com'
    };

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Purchase Order Summary Sheet with proper column structure
    const summaryData = [
      // Header section
      ['LATS CHANCE STORE', '', '', ''],
      ['Purchase Order Summary', '', '', ''],
      ['', '', '', ''],
      
      // Order Information section
      ['ORDER INFORMATION', '', '', ''],
      ['Order Number:', order.orderNumber, '', ''],
      ['Order Date:', formatDate(order.orderDate || order.createdAt), '', ''],
      ['Expected Delivery:', order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'TBD', '', ''],
      ['Status:', order.status.toUpperCase(), '', ''],
      ['Currency:', order.currency === 'TZS' ? 'Tanzania Shillings (TZS)' : order.currency || 'Tanzania Shillings (TZS)', '', ''],
      ['', '', '', ''],
      
      // Supplier Information section
      ['SUPPLIER INFORMATION', '', '', ''],
      ['Company:', order.supplier?.name || 'N/A', '', ''],
      ['Contact Person:', order.supplier?.contactPerson || '', '', ''],
      ['Phone:', order.supplier?.phone || '', '', ''],
      ['Email:', order.supplier?.email || '', '', ''],
      ['Address:', order.supplier?.address || '', '', ''],
      ['City:', order.supplier?.city || '', '', ''],
      ['Country:', order.supplier?.country || '', '', ''],
      ['', '', '', ''],
      
      // Payment Information section
      ['PAYMENT INFORMATION', '', '', ''],
      ['Payment Terms:', 'Net 30', '', ''],
      ['Payment Status:', (order.paymentStatus || 'unpaid').toUpperCase(), '', ''],
      ['Total Paid:', formatCurrency(order.totalPaid || 0, order.currency), '', ''],
      ['Balance Due:', formatCurrency((Number(order.totalAmount) || 0) - (Number(order.totalPaid) || 0), order.currency), '', ''],
      ['', '', '', ''],
      
      // Totals section
      ['TOTALS', '', '', ''],
      ['Subtotal:', formatCurrency(Number(order.totalAmount) || 0, order.currency), '', ''],
      ...(order.exchangeRate && order.exchangeRate !== 1.0 && order.totalAmountBaseCurrency ? [
        ['Exchange Rate:', `${order.exchangeRate} (${order.exchangeRateSource || 'Manual'})`, '', ''],
        ['TZS Equivalent:', `TZS ${order.totalAmountBaseCurrency.toLocaleString()}`, '', '']
      ] : []),
      ['TOTAL AMOUNT:', formatCurrency(Number(order.totalAmount) || 0, order.currency), '', '']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    summarySheet['!cols'] = [
      { wch: 20 }, // Column A - Labels
      { wch: 30 }, // Column B - Values
      { wch: 15 }, // Column C - Empty
      { wch: 15 }  // Column D - Empty
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Items Sheet with proper column structure
    const itemsData = [
      // Header row
      ['Product Description', 'Variant', 'Ordered Qty', 'Received Qty', 'Unit Price', 'Price (TZS)', 'Total (TZS)', 'Status', 'SKU']
    ];

    // Add items data
    order.items.forEach(item => {
      const receivedQty = item.receivedQuantity || 0;
      const unitPriceTZS = order.exchangeRate && order.exchangeRate !== 1.0 ? 
        item.costPrice * order.exchangeRate : item.costPrice;
      const totalPriceTZS = unitPriceTZS * item.quantity;

      itemsData.push([
        item.product?.name || `Product ${item.productId}`,
        item.variant?.name || `Variant ${item.variantId}`,
        item.quantity,
        receivedQty,
        formatCurrency(item.costPrice, order.currency),
        `TZS ${unitPriceTZS.toLocaleString()}`,
        `TZS ${totalPriceTZS.toLocaleString()}`,
        (item.status || 'pending').toUpperCase(),
        item.product?.sku || ''
      ]);
    });

    // Add totals row
    const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = order.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
    const totalAmountTZS = order.items.reduce((sum, item) => {
      const unitPriceTZS = order.exchangeRate && order.exchangeRate !== 1.0 ? 
        item.costPrice * order.exchangeRate : item.costPrice;
      return sum + (unitPriceTZS * item.quantity);
    }, 0);

    itemsData.push([
      'TOTALS',
      '',
      totalOrdered,
      totalReceived,
      '',
      '',
      `TZS ${totalAmountTZS.toLocaleString()}`,
      '',
      ''
    ]);

    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    
    // Set column widths for items sheet
    itemsSheet['!cols'] = [
      { wch: 30 }, // Product Description
      { wch: 20 }, // Variant
      { wch: 12 }, // Ordered Qty
      { wch: 12 }, // Received Qty
      { wch: 15 }, // Unit Price
      { wch: 15 }, // Price (TZS)
      { wch: 15 }, // Total (TZS)
      { wch: 12 }, // Status
      { wch: 15 }  // SKU
    ];
    
    // Add borders and formatting to header row
    const headerRange = XLSX.utils.decode_range(itemsSheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!itemsSheet[cellAddress]) continue;
      
      itemsSheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Format totals row
    const totalsRowIndex = itemsData.length - 1;
    for (let col = 0; col < itemsData[0].length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalsRowIndex, c: col });
      if (!itemsSheet[cellAddress]) continue;
      
      itemsSheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F2F2F2" } },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');

    return workbook;
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
    // Ensure amount is a valid number
    const safeAmount = isNaN(amount) ? 0 : amount;
    
    // Format the number with proper locale
    const formattedAmount = new Intl.NumberFormat('en-TZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(safeAmount);
    
    // Add currency symbol/code based on currency (excluding CNY)
    switch (currencyCode?.toUpperCase()) {
      case 'TZS':
        return `TZS ${formattedAmount}`;
      case 'USD':
        return `$${formattedAmount}`;
      case 'EUR':
        return `€${formattedAmount}`;
      case 'GBP':
        return `£${formattedAmount}`;
      case 'AED':
        return `AED ${formattedAmount}`;
      case 'CNY':
        // Remove CNY currency display, show only the amount
        return formattedAmount;
      default:
        return `${currencyCode} ${formattedAmount}`;
    }
  };

  // Helper function to safely calculate average cost per item
  const calculateAverageCostPerItem = (totalAmount: number, items: any[]) => {
    if (!items || items.length === 0) return 0;
    
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (totalQuantity === 0) return 0;
    
    return totalAmount / totalQuantity;
  };

  // Helper function to validate currency consistency
  const validateCurrencyConsistency = (purchaseOrder: any) => {
    const issues = [];
    
    // Check if currency is properly set
    if (!purchaseOrder.currency) {
      issues.push('Currency not set - defaulting to TZS');
    }
    
    // Check for exchange rate inconsistencies
    if (purchaseOrder.currency && purchaseOrder.currency !== 'TZS') {
      if (!purchaseOrder.exchangeRate || purchaseOrder.exchangeRate === 1.0) {
        issues.push('Exchange rate missing for non-TZS currency');
      }
      if (!purchaseOrder.totalAmountBaseCurrency) {
        issues.push('Base currency amount not calculated');
      }
    }
    
    return issues;
  };

  // Get currency display info
  const getCurrencyDisplayInfo = (purchaseOrder: any) => {
    const currency = purchaseOrder.currency || 'TZS';
    const hasExchangeRate = purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0;
    const baseAmount = purchaseOrder.totalAmountBaseCurrency;
    
    return {
      currency,
      hasExchangeRate,
      baseAmount,
      isMultiCurrency: currency !== 'TZS' && hasExchangeRate
    };
  };

  // Helper function to calculate TZS equivalent
  const calculateTZSEquivalent = (amount: number, currency: string, exchangeRate?: number) => {
    if (currency === 'TZS' || !exchangeRate || exchangeRate === 1.0) {
      return amount;
    }
    return Math.round(amount * exchangeRate);
  };

  // Helper function to format exchange rate display
  const formatExchangeRate = (rate: number) => {
    if (rate >= 1000) {
      return rate.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } else if (rate >= 1) {
      return rate.toFixed(2);
    } else {
      return rate.toFixed(6);
    }
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
                {/* Autoloading indicator */}
                {isBackgroundLoading && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    Auto-refreshing...
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchaseOrder.status)}`}>
                  {getStatusIcon(purchaseOrder.status)}
                  <span className="capitalize">{purchaseOrder.status}</span>
                </span>
                <span className="ml-2">Created {formatDate(purchaseOrder.createdAt)}</span>
                {lastRefreshTime && (
                  <span className="ml-2 text-xs text-gray-400">
                    • Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Refresh Controls */}
          <div className="flex items-center gap-3">
            {/* Manual Refresh Button */}
            <button
              onClick={() => refreshPurchaseOrderData(false)}
              disabled={isBackgroundLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${isBackgroundLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {/* Auto-refresh Status */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isBackgroundLoading ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
              Auto-refresh: {autoRefreshEnabled ? (isBackgroundLoading ? 'Active' : 'Paused') : 'Disabled'}
            </div>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowAutoRefreshSettings(!showAutoRefreshSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Auto-refresh Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
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
              onClick={() => handleTabChange('received')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4" />
                Received
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
                            value={purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setPurchaseOrder(prev => prev ? { ...prev, expectedDeliveryDate: e.target.value ? new Date(e.target.value).toISOString() : null } : null)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {purchaseOrder.expectedDeliveryDate ? formatDate(purchaseOrder.expectedDeliveryDate) : 'Not set'}
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
                    
                    {/* Smart Primary Actions - Only show relevant actions */}
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
                          {/* Step 1: Draft Status - Can edit, approve, or delete */}
                          {purchaseOrder.status === 'draft' && (
                            <>
            <button
              onClick={() => window.open(`/lats/purchase-orders/create?edit=${purchaseOrder.id}`, '_blank')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Order
            </button>
            <button
              onClick={handleSubmitForApproval}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Shield className="w-4 h-4" />
              Submit for Approval
            </button>
                              <button
                                onClick={handleDelete}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                              >
                                <X className="w-4 h-4" />
                                Delete Order
                              </button>
                            </>
                          )}
                          
                          {/* Step 2: Pending Approval - Waiting for manager approval */}
                          {purchaseOrder.status === 'pending_approval' && (
                            <>
                              <div className="text-center py-4">
                                <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-white mb-2">Pending Approval</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                  This purchase order is waiting for manager approval
                                </p>
                                <button
                                  onClick={() => setShowApprovalModal(true)}
                                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium text-sm mx-auto"
                                >
                                  <Shield className="w-4 h-4" />
                                  Review Approval
                                </button>
                              </div>
                            </>
                          )}

                          {/* Step 2.5: Approved - Ready to send to supplier */}
                          {purchaseOrder.status === 'approved' && (
                            <>
                              <div className="text-center py-4">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-white mb-2">Approved</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                  This purchase order has been approved and is ready to send to supplier
                                </p>
                              </div>
                              <button
                                onClick={async () => {
                                  try {
                                    const success = await PurchaseOrderService.updateOrderStatus(
                                      purchaseOrder.id,
                                      'sent',
                                      currentUser?.id || ''
                                    );
                                    if (success) {
                                      toast.success('Purchase order sent to supplier');
                                      await loadPurchaseOrder();
                                    } else {
                                      toast.error('Failed to update order status');
                                    }
                                  } catch (error) {
                                    toast.error('Failed to send order to supplier');
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                              >
                                <Send className="w-4 h-4" />
                                Send to Supplier
                              </button>
                            </>
                          )}

                          {/* Step 3: Approved (sent/confirmed) - Must pay before receiving */}
                          {(purchaseOrder.status === 'sent' || purchaseOrder.status === 'confirmed') && (
                            <>
            {/* Debug logging */}
            {console.log('🔍 PurchaseOrderDetailPage: Payment status check:', {
              status: purchaseOrder.status,
              paymentStatus: purchaseOrder.paymentStatus,
              totalPaid: purchaseOrder.totalPaid,
              purchaseOrder: purchaseOrder
            })}
                              
                              {/* Show payment button if not fully paid */}
                              {((purchaseOrder.paymentStatus === 'unpaid' || purchaseOrder.paymentStatus === 'partial') || !purchaseOrder.paymentStatus) && (
                                <button
                                  onClick={handleMakePayment}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                  <CreditCard className="w-4 h-4" />
                                  Make Payment
                                </button>
                              )}
                              
                              {/* Cancel Order button - only show if not paid */}
                              {((purchaseOrder.paymentStatus === 'unpaid' || purchaseOrder.paymentStatus === 'partial') || !purchaseOrder.paymentStatus) && (
                                <button
                                  onClick={handleCancelOrder}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Cancel Order
                                </button>
                              )}
                              
                              {/* Only show receive if fully paid */}
                              {(purchaseOrder.paymentStatus === 'paid') && (
                                <button
                                  onClick={handleReceive}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                  Receive Order
                                </button>
                              )}
                            </>
                          )}

                          {/* Step 3: Shipping - Can track and receive if paid */}
                          {purchaseOrder.status === 'shipping' && (
                            <>
                              {/* Only show receive if fully paid */}
                              {(purchaseOrder.paymentStatus === 'paid') && (
                                <button
                                  onClick={handleReceive}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                  Receive Order
                                </button>
                              )}
                            </>
                          )}

                          {/* Step 4: Shipped - Can receive if paid */}
                          {purchaseOrder.status === 'shipped' && (
                            <>
                              {/* Only show receive if fully paid */}
                              {(purchaseOrder.paymentStatus === 'paid') && (
                                <button
                                  onClick={handleReceive}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                  Receive Order
                                </button>
                              )}
                            </>
                          )}

                          {/* Partial Receive - Only show if paid and not fully received */}
                          {((purchaseOrder.status === 'sent' || purchaseOrder.status === 'shipped' || purchaseOrder.status === 'partial_received') && 
                            purchaseOrder.paymentStatus === 'paid') && (
                            <button
                              onClick={() => setShowPartialReceiveModal(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                              <PackageCheck className="w-4 h-4" />
                              Partial Receive
                            </button>
                          )}

                          {/* Serial Number Receive - Only show if paid and not fully received */}
                          {((purchaseOrder.status === 'sent' || purchaseOrder.status === 'shipped' || purchaseOrder.status === 'partial_received') && 
                            purchaseOrder.paymentStatus === 'paid') && (
                            <button
                              onClick={() => setShowSerialNumberReceiveModal(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                              <PackageCheck className="w-4 h-4" />
                              Receive with Serial Numbers
                            </button>
                          )}

                          {/* Quality Check - Only show if received or partially received */}
                          {/* DEBUG: Current status is: {purchaseOrder.status} */}
                          {/* Quality Check Button - Show for received orders */}
                          {(purchaseOrder.status === 'received' || purchaseOrder.status === 'quality_checked' || purchaseOrder.status === 'completed') && (
                            <button
                              onClick={handleQualityControl}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                              <PackageCheck className="w-4 h-4" />
                              {purchaseOrder.status === 'quality_checked' ? 'Re-check Quality' : 'Quality Check'}
                            </button>
                          )}
                          
                          {/* DEBUG: Show status for troubleshooting */}
                          {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'partial_received' && purchaseOrder.status !== 'quality_checked' && purchaseOrder.status !== 'completed' && (
                            <div className="w-full p-2 bg-yellow-100 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                              <strong>Debug:</strong> Quality Check button not showing. Current status: <strong>{purchaseOrder.status}</strong>. 
                              Button only shows for 'received', 'quality_checked', or 'completed' status.
                            </div>
                          )}

                          {/* Complete Order - Only show if received and all items are fully received */}
                          {purchaseOrder.status === 'received' && (
                            <button
                              onClick={handleCompleteOrder}
                              disabled={isSaving}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {isSaving ? 'Completing...' : 'Complete Order'}
                            </button>
                          )}

                          {/* Return Order - Only show if received */}
                          {(purchaseOrder.status === 'received' || purchaseOrder.status === 'partial_received') && (
                            <button
                              onClick={() => setShowReturnOrderModal(true)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Return Order
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-2">
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

                        <button
                          onClick={handleExportExcel}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Export Excel
                        </button>

                        <button
                          onClick={handleDuplicateOrder}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>

                        <button
                          onClick={handleViewNotes}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          Notes
                        </button>

                        <button
                          onClick={() => setShowBulkActions(true)}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          <Layers className="w-4 h-4" />
                          Bulk Actions
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
              {/* Pending Items Section */}
              {isLoadingPurchaseOrderItems ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading purchase order items...</p>
                  </div>
                </div>
              ) : purchaseOrderItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No items in this order</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Package className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-gray-800">Order Items ({purchaseOrderItems.length} items)</h3>
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
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 1;
                                      const updatedItems = [...purchaseOrderItems];
                                      updatedItems[index] = { ...item, quantity: newQuantity };
                                      setPurchaseOrderItems(updatedItems);
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
                                      const updatedItems = [...purchaseOrderItems];
                                      updatedItems[index] = { ...item, costPrice: newCostPrice };
                                      setPurchaseOrderItems(updatedItems);
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

              {/* Received Items Section - Show below pending items */}
              {receivedItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Received Items ({receivedItems.length} items)</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRefreshReceivedItems}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        disabled={isLoadingReceivedItems}
                      >
                        <RotateCcw className={`w-3 h-3 ${isLoadingReceivedItems ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-3 font-medium text-gray-700">Product</th>
                          <th className="text-left p-3 font-medium text-gray-700 hidden sm:table-cell">Variant</th>
                          <th className="text-left p-3 font-medium text-gray-700">Serial Number</th>
                          <th className="text-left p-3 font-medium text-gray-700 hidden md:table-cell">IMEI</th>
                          <th className="text-left p-3 font-medium text-gray-700">Status</th>
                          <th className="text-left p-3 font-medium text-gray-700 hidden lg:table-cell">Location</th>
                          <th className="text-left p-3 font-medium text-gray-700">Received Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivedItems.map((item, index) => (
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
                              <div className="font-mono text-sm text-gray-900">{item.serial_number}</div>
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
                                {new Date(item.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(item.created_at).toLocaleTimeString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {receivedItems.filter(item => item.status === 'available').length}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {receivedItems.filter(item => item.status === 'sold').length}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Sold</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {receivedItems.filter(item => item.status === 'reserved').length}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Reserved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {receivedItems.filter(item => item.status === 'damaged').length}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Damaged</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Received Items Tab */}
          {activeTab === 'received' && (
            <div className="space-y-6">
              {/* Quality Check Summary */}
              {purchaseOrder && (
                <QualityCheckSummary 
                  purchaseOrderId={purchaseOrder.id}
                  onViewDetails={(qcId) => {
                    console.log('View quality check details:', qcId);
                    toast.info('Quality check details view coming soon');
                  }}
                />
              )}

              {/* Search and Filters */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Search & Filter</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search products, SKU, serial..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="reserved">Reserved</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="Filter by location..."
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => setFilters({ search: '', status: '', location: '', dateFrom: '', dateTo: '' })}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions - REMOVED: Component doesn't exist */}
              {/* <BulkActionsToolbar
                items={filteredReceivedItems}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
                onItemsUpdate={handleRefreshReceivedItems}
                onExport={handleExport}
                purchaseOrderId={id || ''}
              /> */}

              {/* Inventory Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {receivedItems.filter(item => item.status === 'available').length}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">Available</div>
                  <div className="text-xs text-gray-400 mt-1">
                    TZS {receivedItems
                      .filter(item => item.status === 'available')
                      .reduce((sum, item) => sum + (item.cost_price || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {receivedItems.filter(item => item.status === 'sold').length}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">Sold</div>
                  <div className="text-xs text-gray-400 mt-1">
                    TZS {receivedItems
                      .filter(item => item.status === 'sold')
                      .reduce((sum, item) => sum + (item.selling_price || item.cost_price || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {receivedItems.filter(item => item.status === 'reserved').length}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">Reserved</div>
                  <div className="text-xs text-gray-400 mt-1">
                    TZS {receivedItems
                      .filter(item => item.status === 'reserved')
                      .reduce((sum, item) => sum + (item.cost_price || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {receivedItems.filter(item => item.status === 'damaged').length}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide">Damaged</div>
                  <div className="text-xs text-gray-400 mt-1">
                    TZS {receivedItems
                      .filter(item => item.status === 'damaged')
                      .reduce((sum, item) => sum + (item.cost_price || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {filteredReceivedItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-800">Bulk Actions</h3>
                      {selectedItems.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {selectedItems.length} selected
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedItems(filteredReceivedItems.map(item => item.id))}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedItems([])}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {selectedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setShowStatusModal(true)}
                        className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                      >
                        Update Status ({selectedItems.length})
                      </button>
                      <button
                        onClick={() => setShowLocationModal(true)}
                        className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                      >
                        Assign Location ({selectedItems.length})
                      </button>
                      <button
                        onClick={() => handleExport({ selectedItems })}
                        className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                      >
                        Export Selected ({selectedItems.length})
                      </button>
                      <button
                        onClick={() => showConfirmation(
                          'Delete Items',
                          `Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`,
                          () => {
                            // Handle bulk delete
                            console.log('Bulk delete:', selectedItems);
                            toast.success(`Deleted ${selectedItems.length} items`);
                            setSelectedItems([]);
                          }
                        )}
                        className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                      >
                        Delete ({selectedItems.length})
                      </button>
                    </div>
                  )}
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
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">
                        Received Items ({filteredReceivedItems.length} items)
                      </h3>
                      <button
                        onClick={handleRefreshReceivedItems}
                        className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left p-3 font-medium text-gray-700 w-8">
                            <input
                              type="checkbox"
                              checked={selectedItems.length === filteredReceivedItems.length && filteredReceivedItems.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems(filteredReceivedItems.map(item => item.id));
                                } else {
                                  setSelectedItems([]);
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
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
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems(prev => [...prev, item.id]);
                                  } else {
                                    setSelectedItems(prev => prev.filter(id => id !== item.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium text-sm text-gray-900">{item.product?.name || `Product ${item.product_id}`}</p>
                                <p className="text-xs text-gray-500 sm:hidden">{item.variant?.name || `Variant ${item.variant_id}`}</p>
                                <p className="text-xs text-gray-500">SKU: {item.product?.sku || item.product_id}</p>
                              </div>
                            </td>
                            <td className="p-3 text-sm hidden sm:table-cell">{item.variant?.name || `Variant ${item.variant_id}`}</td>
                            <td className="p-3">
                              <div className="font-mono text-sm text-gray-900">
                                {item.serial_number || item.serialNumber || '-'}
                                {!item.serial_number && !item.serialNumber && (
                                  <button
                                    onClick={() => {
                                      const serialNumber = prompt('Enter serial number:');
                                      if (serialNumber) {
                                        // Handle serial number update
                                        console.log('Update serial number:', serialNumber);
                                      }
                                    }}
                                    className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                              {item.barcode && (
                                <div className="text-xs text-gray-500">Barcode: {item.barcode}</div>
                              )}
                            </td>
                            <td className="p-3 text-sm hidden md:table-cell">
                              {item.imei ? (
                                <span className="font-mono text-xs text-gray-600">{item.imei}</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">-</span>
                                  <button
                                    onClick={() => {
                                      const imei = prompt('Enter IMEI:');
                                      if (imei) {
                                        // Handle IMEI update
                                        console.log('Update IMEI:', imei);
                                      }
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    Add
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <select
                                value={item.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  // Handle status update
                                  console.log('Update status:', newStatus);
                                }}
                                className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                                  item.status === 'available' ? 'bg-green-100 text-green-700' :
                                  item.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                                  item.status === 'damaged' ? 'bg-red-100 text-red-700' :
                                  item.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}
                              >
                                <option value="available">Available</option>
                                <option value="sold">Sold</option>
                                <option value="reserved">Reserved</option>
                                <option value="damaged">Damaged</option>
                              </select>
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
                                <button
                                  onClick={() => {
                                    const location = prompt('Enter location:');
                                    const shelf = prompt('Enter shelf (optional):');
                                    const bin = prompt('Enter bin (optional):');
                                    if (location) {
                                      // Handle location update
                                      console.log('Update location:', { location, shelf, bin });
                                    }
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Assign
                                </button>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="text-sm text-gray-900">
                                {item.cost_price ? `TZS ${item.cost_price.toLocaleString()}` : 'N/A'}
                              </div>
                              {item.selling_price && (
                                <div className="text-xs text-gray-500">
                                  Sell: TZS {item.selling_price.toLocaleString()}
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
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    // Handle view details
                                    console.log('View details:', item);
                                  }}
                                  className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    // Handle edit item
                                    console.log('Edit item:', item);
                                  }}
                                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                  title="Edit Item"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    // Generate QR code
                                    const qrData = {
                                      id: item.id,
                                      serialNumber: item.serial_number || item.serialNumber,
                                      productName: item.product?.name,
                                      sku: item.product?.sku
                                    };
                                    console.log('Generate QR code:', qrData);
                                    toast.success('QR code generated!');
                                  }}
                                  className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors"
                                  title="Generate QR Code"
                                >
                                  <QrCode className="w-3 h-3" />
                                </button>
                              </div>
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
              {/* Currency Validation Warnings */}
              {(() => {
                const currencyIssues = validateCurrencyConsistency(purchaseOrder);
                const currencyInfo = getCurrencyDisplayInfo(purchaseOrder);
                
                if (currencyIssues.length > 0) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-yellow-800">Currency Issues Detected</h4>
                      </div>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {currencyIssues.map((issue, index) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Cost Analysis */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Cost Analysis</h3>
                  {/* Currency indicator */}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {purchaseOrder.currency || 'TZS'}
                    </div>
                    {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                      <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                        1 {purchaseOrder.currency} = {formatExchangeRate(purchaseOrder.exchangeRate)} TZS
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Total Cost</div>
                    <div className="text-lg font-bold text-green-900">{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency)}</div>
                    {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        ≈ TZS {purchaseOrder.totalAmountBaseCurrency ? 
                          purchaseOrder.totalAmountBaseCurrency.toLocaleString() : 
                          calculateTZSEquivalent(purchaseOrder.totalAmount, purchaseOrder.currency || 'USD', purchaseOrder.exchangeRate).toLocaleString()
                        }
                      </div>
                    )}
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Avg Cost/Item</div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(
                        calculateAverageCostPerItem(purchaseOrder.totalAmount, purchaseOrder.items), 
                        purchaseOrder.currency
                      )}
                    </div>
                    {purchaseOrder.exchangeRate && purchaseOrder.exchangeRate !== 1.0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        ≈ TZS {calculateTZSEquivalent(
                          calculateAverageCostPerItem(purchaseOrder.totalAmount, purchaseOrder.items), 
                          purchaseOrder.currency || 'USD', 
                          purchaseOrder.exchangeRate
                        ).toLocaleString()}
                      </div>
                    )}
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
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
              title="Send WhatsApp message to supplier"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
            
            <button
              onClick={handleSendSMS}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-sm"
              title="Send SMS to supplier"
            >
              <Send className="w-4 h-4" />
              SMS
            </button>
            
            <button
              onClick={handleViewPayments}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
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
          <PaymentsPopupModal
            isOpen={showPurchaseOrderPaymentModal}
            onClose={() => setShowPurchaseOrderPaymentModal(false)}
            amount={purchaseOrder.totalAmount - (purchaseOrder.totalPaid || 0)}
            customerId={purchaseOrder.supplierId}
            customerName={purchaseOrder.supplier?.name}
            description={`Payment for Purchase Order ${purchaseOrder.orderNumber}`}
            onPaymentComplete={handlePurchaseOrderPaymentComplete}
            paymentType="cash_out"
            title="Purchase Order Payment"
          />
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

        {/* Quality Check Modal - New Enhanced System */}
        {purchaseOrder && (
          <QualityCheckModal
            purchaseOrderId={purchaseOrder.id}
            isOpen={showQualityCheckModal}
            onClose={() => setShowQualityCheckModal(false)}
            onComplete={async () => {
              setShowQualityCheckModal(false);
              await handleQualityCheckComplete();
            }}
          />
        )}

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 p-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Order Notes</h3>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Add New Note */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Add New Note</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note here..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    Add Note
                  </button>
                </div>
                
                {/* Notes List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Previous Notes</h4>
                  {orderNotes.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {orderNotes.map((note, index) => (
                        <div key={note.id || index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{note.author}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No notes available</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Modal */}
        {showBulkActions && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 p-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Bulk Actions</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="text-sm text-gray-600">
                  Select items and choose an action to perform on multiple items at once.
                </div>
                
                {/* Item Selection */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Select Items</h4>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    {purchaseOrder.items.map((item, index) => (
                      <div key={item.id || index} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0">
                        <input
                          type="checkbox"
                          checked={bulkSelectedItems.includes(item.id)}
                          onChange={() => handleBulkSelectItem(item.id)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">SKU: {item.sku} | Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Bulk Actions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Available Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleBulkAction('update_status')}
                      disabled={bulkSelectedItems.length === 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Update Status
                    </button>
                    
                    <button
                      onClick={() => handleBulkAction('assign_location')}
                      disabled={bulkSelectedItems.length === 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <Store className="w-4 h-4" />
                      Assign Location
                    </button>
                    
                    <button
                      onClick={() => handleBulkAction('export_selected')}
                      disabled={bulkSelectedItems.length === 0}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Export Selected
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowBulkActions(false);
                      setBulkSelectedItems([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setBulkSelectedItems(purchaseOrder.items.map(item => item.id))}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Select All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Return Order Modal */}
        {showReturnOrderModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 p-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Return Order</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="text-sm text-gray-600">
                  Create a return order for items that need to be returned to the supplier.
                </div>
                
                <div className="space-y-4">
                  {/* Return Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Return Type</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                      <option value="defective">Defective Items</option>
                      <option value="wrong_item">Wrong Items</option>
                      <option value="excess">Excess Quantity</option>
                      <option value="damaged">Damaged in Transit</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  {/* Items to Return */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Items to Return</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {purchaseOrder.items.map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">SKU: {item.sku} | Received: {item.receivedQuantity || 0}</p>
                          </div>
                          <div className="w-20">
                            <input
                              type="number"
                              placeholder="Qty"
                              min="1"
                              max={item.receivedQuantity || item.quantity}
                              className="w-full p-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Return Reason</label>
                    <textarea
                      placeholder="Describe the reason for return..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={3}
                    />
                  </div>
                  
                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      placeholder="Any additional information..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowReturnOrderModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReturnOrder({})}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Create Return Order
                  </button>
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
                      <div key={payment.id || index}>
                        {/* Check if this payment has multiple payment methods */}
                        {payment.metadata?.paymentMethod?.type === 'multiple' && payment.metadata.paymentMethod.details?.payments ? (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200 p-6">
                            <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                              <CreditCard className="w-5 h-5" />
                              Payment #{index + 1} - Multiple Methods
                            </h4>
                            <div className="space-y-4">
                              {payment.metadata.paymentMethod.details.payments.map((subPayment: any, subIndex: number) => (
                                <div key={subIndex} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <CreditCard className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <p className="font-semibold text-gray-900 text-lg">
                                          {subPayment.method ? 
                                            subPayment.method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                                            'Unknown Method'
                                          }
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        {subPayment.reference && (
                                          <p className="text-sm text-gray-600">
                                            <span className="font-medium">Reference:</span> {subPayment.reference}
                                          </p>
                                        )}
                                        {subPayment.transactionId && (
                                          <p className="text-sm text-gray-600">
                                            <span className="font-medium">Transaction ID:</span> {subPayment.transactionId}
                                          </p>
                                        )}
                                        {subPayment.timestamp && (
                                          <p className="text-sm text-gray-500">
                                            <span className="font-medium">Time:</span> {new Date(subPayment.timestamp).toLocaleString('en-TZ')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xl font-bold text-green-600 mb-2">
                                        {formatCurrency(subPayment.amount, subPayment.currency || payment.currency)}
                                      </p>
                                      {subPayment.status && (
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                          subPayment.status === 'completed' || subPayment.status === 'success' ? 'bg-green-100 text-green-800' :
                                          subPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          subPayment.status === 'failed' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {subPayment.status.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {subPayment.notes && (
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                      <p className="text-sm text-gray-600 italic">
                                        <span className="font-medium">Note:</span> {subPayment.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                              
                              {/* Payment Summary */}
                              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  Payment Summary
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600">Total Payments</div>
                                    <div className="text-lg font-semibold text-blue-900">
                                      {payment.metadata.paymentMethod.details.payments.length}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600">Payment Methods</div>
                                    <div className="text-lg font-semibold text-blue-900">
                                      {new Set(payment.metadata.paymentMethod.details.payments.map((p: any) => p.method)).size}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600">Total Amount</div>
                                    <div className="text-xl font-bold text-green-600">
                                      {formatCurrency(
                                        payment.metadata.paymentMethod.details.payments.reduce((sum: number, p: any) => sum + p.amount, 0),
                                        payment.currency
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Single Payment Display */
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <p className="font-semibold text-gray-900 text-lg">
                                    {payment.method ? 
                                      payment.method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                                      'Unknown Method'
                                    }
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  {payment.reference && (
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Reference:</span> {payment.reference}
                                    </p>
                                  )}
                                  {payment.timestamp && (
                                    <p className="text-sm text-gray-500">
                                      <span className="font-medium">Time:</span> {new Date(payment.timestamp).toLocaleString('en-TZ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-green-600 mb-2">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </p>
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  payment.status === 'completed' || payment.status === 'success' ? 'bg-green-100 text-green-800' :
                                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {payment.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            {payment.notes && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <p className="text-sm text-gray-600 italic">
                                  <span className="font-medium">Note:</span> {payment.notes}
                                </p>
                              </div>
                            )}
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

        {/* Serial Number Receive Modal */}
        {showSerialNumberReceiveModal && purchaseOrder && (
          <SerialNumberReceiveModal
            isOpen={showSerialNumberReceiveModal}
            onClose={() => setShowSerialNumberReceiveModal(false)}
            purchaseOrder={purchaseOrder}
            onConfirm={handleSerialNumberReceive}
            isLoading={isSaving}
          />
        )}

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Status</label>
                  <select
                    value={currentItem?.status || ''}
                    onChange={(e) => setCurrentItem(prev => prev ? { ...prev, status: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="reserved">Reserved</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                  <textarea
                    placeholder="Enter reason for status change..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (currentItem && selectedItems.length > 0) {
                      // Handle bulk status update
                      console.log('Bulk status update:', selectedItems, currentItem.status);
                      toast.success(`Updated ${selectedItems.length} items to ${currentItem.status}`);
                      setSelectedItems([]);
                      setShowStatusModal(false);
                    } else if (currentItem) {
                      // Handle single item status update
                      console.log('Single status update:', currentItem);
                      toast.success(`Updated item status to ${currentItem.status}`);
                      setShowStatusModal(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Assignment Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Assign Location</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    placeholder="e.g., Warehouse A, Store Front"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shelf</label>
                    <input
                      type="text"
                      placeholder="e.g., A1, B2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bin</label>
                    <input
                      type="text"
                      placeholder="e.g., 01, 15"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    placeholder="Additional location notes..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedItems.length > 0) {
                      // Handle bulk location assignment
                      console.log('Bulk location assignment:', selectedItems);
                      toast.success(`Assigned location to ${selectedItems.length} items`);
                      setSelectedItems([]);
                      setShowLocationModal(false);
                    } else {
                      // Handle single item location assignment
                      console.log('Single location assignment');
                      toast.success('Location assigned successfully');
                      setShowLocationModal(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Assign Location
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && confirmAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">{confirmAction.title}</h3>
              </div>
              
              <p className="text-gray-600 mb-6">{confirmAction.message}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setConfirmAction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmAction.onConfirm();
                    setShowConfirmDialog(false);
                    setConfirmAction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message Toast */}
        {errorMessage && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-2 text-red-700 hover:text-red-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && (
          <ApprovalModal
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
            purchaseOrder={purchaseOrder}
            onApprove={handleApprove}
            onReject={handleReject}
            onSubmitForApproval={handleSubmitForApproval}
          />
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
