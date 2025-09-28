import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInventoryStore } from '../stores/useInventoryStore';
import { usePOSStore } from '../stores/usePOSStore';
import { rbacManager, type UserRole } from '../lib/rbac';
import { toast } from 'react-hot-toast';
import { format } from '../lib/format';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Clock, 
  CheckCircle, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';

// Import mobile-optimized components
import MobilePOSLayout from '../components/pos/MobilePOSLayout';
import MobileProductGrid from '../components/pos/MobileProductGrid';

// Import modals (lazy loaded)
import AddExternalProductModal from '../components/pos/AddExternalProductModal';
import AddCustomerModal from '../../../features/customers/components/forms/AddCustomerModal';
import SalesAnalyticsModal from '../components/pos/SalesAnalyticsModal';
import ZenoPayPaymentModal from '../components/pos/ZenoPayPaymentModal';
import PaymentTrackingModal from '../components/pos/PaymentTrackingModal';
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';

// Import settings modal
import { POSSettingsModalWrapper } from '../components/pos/POSModals';

// Import draft functionality
import { useDraftManager } from '../hooks/useDraftManager';
import DraftManagementModal from '../components/pos/DraftManagementModal';
import DraftNotification from '../components/pos/DraftNotification';

import { ProductSearchResult, ProductSearchVariant, CartItem } from '../types/pos';

const MobilePOSPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [hasSelectedCustomer, setHasSelectedCustomer] = useState(false);

  // Customer Care Daily Operations State
  const [isDayStarted, setIsDayStarted] = useState(false);
  const [isDayEnded, setIsDayEnded] = useState(false);
  const [dailySales, setDailySales] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalCustomers: 0,
    targetSales: 500000, // Default target in TSH
    startTime: null as string | null,
    endTime: null as string | null
  });
  const [showDailySummary, setShowDailySummary] = useState(false);

  // Store hooks
  const { 
    products, 
    loadProducts, 
    isLoading: inventoryLoading, 
    error: inventoryError 
  } = useInventoryStore();

  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    totalAmount,
    itemCount
  } = usePOSStore();

  // Draft management
  const {
    hasUnsavedDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    draftCount
  } = useDraftManager();

  // Modal states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showSalesAnalytics, setShowSalesAnalytics] = useState(false);
  const [showZenoPayModal, setShowZenoPayModal] = useState(false);
  const [showPaymentTracking, setShowPaymentTracking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Convert products to search results format
  const productsAsSearchResults: ProductSearchResult[] = React.useMemo(() => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      thumbnail_url: product.thumbnail_url,
      stock_quantity: product.stock_quantity,
      variants: product.variants?.map(variant => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        stock_quantity: variant.stock_quantity,
        specifications: variant.specifications || {}
      })) || [],
      tags: product.tags
    }));
  }, [products]);

  // Handle adding products to cart
  const handleAddToCart = (product: ProductSearchResult, variant?: ProductSearchVariant, quantity: number = 1) => {
    try {
      const cartItem: CartItem = {
        id: `${product.id}-${variant?.id || 'default'}`,
        productId: product.id,
        variantId: variant?.id,
        name: product.name,
        variantName: variant?.name,
        price: variant?.price || product.price,
        quantity,
        thumbnail_url: product.thumbnail_url,
        stock_quantity: variant?.stock_quantity || product.stock_quantity || 0
      };

      addToCart(cartItem);
      
      // Save draft after adding to cart
      if (hasUnsavedDraft) {
        saveDraft();
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  // Handle payment processing
  const handleProcessPayment = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessingPayment(true);
    setShowPaymentModal(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentData: any) => {
    try {
      // Process the payment
      console.log('Processing payment:', paymentData);
      
      // Clear cart after successful payment
      clearCart();
      clearDraft();
      
      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle barcode scanning
  const handleScanBarcode = () => {
    // TODO: Implement barcode scanning
    toast.info('Barcode scanning feature coming soon');
  };

  // Handle adding customer
  const handleAddCustomer = () => {
    setShowAddCustomerModal(true);
  };

  // Handle viewing receipts
  const handleViewReceipts = () => {
    setShowSalesAnalytics(true);
  };

  // Handle settings
  const handleToggleSettings = () => {
    setShowSettingsModal(true);
  };

  // Check permissions
  const canAccessInventory = rbacManager.hasPermission(currentUser?.role as UserRole, 'inventory:read');
  const canAddProducts = rbacManager.hasPermission(currentUser?.role as UserRole, 'products:create');
  const canAddCustomers = rbacManager.hasPermission(currentUser?.role as UserRole, 'customers:create');

  if (!canAccessInventory) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the POS system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <MobilePOSLayout
        cartItems={cartItems}
        cartTotal={totalAmount}
        cartItemCount={itemCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onProcessPayment={handleProcessPayment}
        onClearCart={clearCart}
        onScanBarcode={handleScanBarcode}
        onAddCustomer={canAddCustomers ? handleAddCustomer : undefined}
        onViewReceipts={handleViewReceipts}
        onToggleSettings={handleToggleSettings}
        isProcessingPayment={isProcessingPayment}
        hasSelectedCustomer={hasSelectedCustomer}
      >
        <MobileProductGrid
          products={productsAsSearchResults}
          onAddToCart={handleAddToCart}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={inventoryLoading}
          showFilters={true}
        />
      </MobilePOSLayout>

      {/* Draft Notification */}
      {hasUnsavedDraft && (
        <DraftNotification
          onSaveDraft={() => saveDraft()}
          onDiscardDraft={() => clearDraft()}
          onViewDrafts={() => setShowDraftModal(true)}
        />
      )}

      {/* Modals */}
      {showAddProductModal && (
        <AddExternalProductModal
          onClose={() => setShowAddProductModal(false)}
          onProductAdded={(product) => {
            toast.success('Product added successfully');
            setShowAddProductModal(false);
          }}
        />
      )}

      {showAddCustomerModal && canAddCustomers && (
        <AddCustomerModal
          onClose={() => setShowAddCustomerModal(false)}
          onCustomerAdded={(customer) => {
            setHasSelectedCustomer(true);
            toast.success('Customer added successfully');
            setShowAddCustomerModal(false);
          }}
        />
      )}

      {showSalesAnalytics && (
        <SalesAnalyticsModal
          onClose={() => setShowSalesAnalytics(false)}
        />
      )}

      {showZenoPayModal && (
        <ZenoPayPaymentModal
          onClose={() => setShowZenoPayModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {showPaymentTracking && (
        <PaymentTrackingModal
          onClose={() => setShowPaymentTracking(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentsPopupModal
          onClose={() => {
            setShowPaymentModal(false);
            setIsProcessingPayment(false);
          }}
          onPaymentComplete={handlePaymentComplete}
          totalAmount={totalAmount}
          cartItems={cartItems}
        />
      )}

      {showSettingsModal && (
        <POSSettingsModalWrapper
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showDraftModal && (
        <DraftManagementModal
          onClose={() => setShowDraftModal(false)}
          onLoadDraft={(draft) => {
            // Load draft data into cart
            clearCart();
            draft.cartItems.forEach(item => addToCart(item));
            setShowDraftModal(false);
            toast.success('Draft loaded successfully');
          }}
        />
      )}
    </div>
  );
};

export default MobilePOSPage;
