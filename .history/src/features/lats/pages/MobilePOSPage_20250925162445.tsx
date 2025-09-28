import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  BarChart3,
  X
} from 'lucide-react';

// Import mobile-optimized components
import MobilePOSLayout from '../components/pos/MobilePOSLayout';
import MobileProductGrid from '../components/pos/MobileProductGrid';
import DynamicMobileProductGrid from '../components/pos/DynamicMobileProductGrid';

// Import modals (lazy loaded)
import AddExternalProductModal from '../components/pos/AddExternalProductModal';
import AddCustomerModal from '../../../features/customers/components/forms/AddCustomerModal';
import SalesAnalyticsModal from '../components/pos/SalesAnalyticsModal';
import PostClosureWarningModal from '../components/modals/PostClosureWarningModal';
import DailyClosingModal from '../components/modals/DailyClosingModal';
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
  const navigate = useNavigate();
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

  // Daily closure state
  const [isDailyClosed, setIsDailyClosed] = useState(false);
  const [dailyClosureInfo, setDailyClosureInfo] = useState<{
    closedAt?: string;
    closedBy?: string;
  } | null>(null);
  const [showPostClosureWarning, setShowPostClosureWarning] = useState(false);
  const [showDailyClosingModal, setShowDailyClosingModal] = useState(false);

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

  // Load products on mount and check daily status
  useEffect(() => {
    loadProducts();
    checkDailyStatus();
    loadDailySales();
  }, [loadProducts]);

  // Check if day has been started/ended
  const checkDailyStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_sales_closures')
        .select('*')
        .eq('date', today)
        .single();

      if (!error && data) {
        setIsDayEnded(true);
        setIsDailyClosed(true);
        setDailyClosureInfo({
          closedAt: data.closed_at,
          closedBy: data.closed_by
        });
        setDailySales(prev => ({
          ...prev,
          totalSales: data.total_sales || 0,
          totalTransactions: data.total_transactions || 0,
          endTime: data.closed_at
        }));
      } else {
        // Check if day was started
        setIsDayStarted(true);
        setIsDailyClosed(false);
        setDailyClosureInfo(null);
        setDailySales(prev => ({
          ...prev,
          startTime: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.log('No daily status found, starting fresh day');
      setIsDayStarted(true);
      setIsDailyClosed(false);
      setDailyClosureInfo(null);
      setDailySales(prev => ({
        ...prev,
        startTime: new Date().toISOString()
      }));
    }
  };

  // Load today's sales data
  const loadDailySales = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date(today + 'T00:00:00.000Z').toISOString();
      const endOfDay = new Date(today + 'T23:59:59.999Z').toISOString();

      const { data: sales, error } = await supabase
        .from('lats_sales')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (!error && sales) {
        const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        const totalCustomers = new Set(sales.map(sale => sale.customer_id).filter(Boolean)).size;
        
        setDailySales(prev => ({
          ...prev,
          totalSales,
          totalTransactions: sales.length,
          totalCustomers
        }));
      }
    } catch (err) {
      console.error('Error loading daily sales:', err);
    }
  };

  // Start day function
  const handleStartDay = () => {
    setIsDayStarted(true);
    setDailySales(prev => ({
      ...prev,
      startTime: new Date().toISOString()
    }));
    toast.success('Day started successfully! 🌅');
  };

  // End day function
  const handleEndDay = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const closureData = {
        date: today,
        total_sales: dailySales.totalSales,
        total_transactions: dailySales.totalTransactions,
        closed_at: new Date().toISOString(),
        closed_by: currentUser?.email || 'customer_care'
      };

      const { error } = await supabase
        .from('daily_sales_closures')
        .upsert(closureData, { 
          onConflict: 'date',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      setIsDayEnded(true);
      setDailySales(prev => ({
        ...prev,
        endTime: new Date().toISOString()
      }));
      
      toast.success('Day ended successfully! 🌙');
      setShowDailySummary(true);
    } catch (err) {
      console.error('Error ending day:', err);
      toast.error('Failed to end day. Please try again.');
    }
  };

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

    // Check for daily closure
    if (isDailyClosed) {
      setShowPostClosureWarning(true);
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
    toast('Barcode scanning feature coming soon');
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

  // Handle exit to dashboard
  const handleExitToDashboard = () => {
    navigate('/dashboard');
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

  // Format currency for display
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate progress towards daily target
  const targetProgress = dailySales.targetSales > 0 ? 
    Math.min((dailySales.totalSales / dailySales.targetSales) * 100, 100) : 0;

  return (
    <div className="h-screen bg-gray-50">
      {/* Customer Care Daily Operations Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          {/* Day Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {isDayEnded ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Day Ended</span>
                  <Lock className="w-4 h-4 text-green-600" />
                </div>
              ) : isDayStarted ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Day Active</span>
                  <Unlock className="w-4 h-4 text-blue-600" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-800">Day Not Started</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {!isDayStarted && !isDayEnded && (
                <button
                  onClick={handleStartDay}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Day
                </button>
              )}
              
              {isDayStarted && !isDayEnded && (
                <button
                  onClick={() => setShowDailyClosingModal(true)}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Close Day
                </button>
              )}
              
              <button
                onClick={() => setShowDailySummary(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Summary
              </button>
              
              <button
                onClick={handleExitToDashboard}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                title="Exit to Dashboard"
              >
                <X className="w-4 h-4 inline mr-1" />
                Exit
              </button>
            </div>
          </div>

          {/* Daily Sales Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{formatMoney(dailySales.totalSales)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>{dailySales.totalTransactions} sales</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>{dailySales.totalCustomers} customers</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Target className="w-4 h-4" />
                  <span>{formatMoney(dailySales.targetSales)}</span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  targetProgress >= 100 ? 'bg-green-500' : 
                  targetProgress >= 75 ? 'bg-blue-500' : 
                  targetProgress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                }`}
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            
            <div className="text-xs text-gray-600 text-center">
              {targetProgress.toFixed(1)}% of daily target
            </div>
          </div>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="h-full">
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
         <DynamicMobileProductGrid
           products={productsAsSearchResults}
           onAddToCart={handleAddToCart}
           searchQuery={searchQuery}
           onSearchChange={setSearchQuery}
           isLoading={inventoryLoading}
           showFilters={true}
           batchSize={12}
           enableVirtualization={true}
           enableDynamicGrid={false}
           minCardWidth={180}
           maxColumns={4}
         />
        </MobilePOSLayout>
      </div>

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

      {/* Post-Closure Warning Modal */}
      <PostClosureWarningModal
        isOpen={showPostClosureWarning}
        onClose={() => setShowPostClosureWarning(false)}
        onContinue={() => {
          setShowPostClosureWarning(false);
          setIsProcessingPayment(true);
          setShowPaymentModal(true);
        }}
        closureTime={dailyClosureInfo?.closedAt}
        closedBy={dailyClosureInfo?.closedBy}
        userRole={currentUser?.role}
      />

      {/* Daily Closing Modal */}
      <DailyClosingModal
        isOpen={showDailyClosingModal}
        onClose={() => setShowDailyClosingModal(false)}
        onComplete={() => {
          setIsDailyClosed(true);
          setDailyClosureInfo({
            closedAt: new Date().toISOString(),
            closedBy: currentUser?.name || currentUser?.email || 'Unknown'
          });
          setShowDailyClosingModal(false);
        }}
        currentUser={currentUser}
      />

      {/* Daily Summary Modal */}
      {showDailySummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Daily Summary</h2>
                    <p className="text-sm text-gray-600">
                      {new Date().toLocaleDateString('en-TZ', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDailySummary(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Summary Cards */}
              <div className="space-y-4 mb-6">
                {/* Total Sales */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-700">Total Sales</p>
                        <p className="text-2xl font-bold text-green-800">{formatMoney(dailySales.totalSales)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600">
                        {targetProgress.toFixed(1)}% of target
                      </div>
                      <div className="text-xs text-green-500">
                        Target: {formatMoney(dailySales.targetSales)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Transactions</p>
                      <p className="text-2xl font-bold text-blue-800">{dailySales.totalTransactions}</p>
                    </div>
                  </div>
                </div>

                {/* Customers */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-700">Customers Served</p>
                      <p className="text-2xl font-bold text-purple-800">{dailySales.totalCustomers}</p>
                    </div>
                  </div>
                </div>

                {/* Time Info */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Day Status</p>
                        <p className="text-lg font-bold text-gray-800">
                          {isDayEnded ? 'Completed' : isDayStarted ? 'In Progress' : 'Not Started'}
                        </p>
                      </div>
                    </div>
                    {dailySales.startTime && (
                      <div className="text-right text-sm text-gray-600">
                        <div>Started: {new Date(dailySales.startTime).toLocaleTimeString()}</div>
                        {dailySales.endTime && (
                          <div>Ended: {new Date(dailySales.endTime).toLocaleTimeString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Daily Target Progress</span>
                  <span className="text-sm text-gray-600">{targetProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      targetProgress >= 100 ? 'bg-green-500' : 
                      targetProgress >= 75 ? 'bg-blue-500' : 
                      targetProgress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${targetProgress}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDailySummary(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {isDayStarted && !isDayEnded && (
                  <button
                    onClick={() => {
                      setShowDailySummary(false);
                      setShowDailyClosingModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Close Day
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePOSPage;
