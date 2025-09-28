import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  CreditCard, RefreshCw, Download, Settings, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';

// Import only essential components
import PaymentTrackingDashboard from '../components/PaymentTrackingDashboard';
import PurchaseOrderPaymentDashboard from '../components/PurchaseOrderPaymentDashboard';
import PaymentProviderManagement from '../components/PaymentProviderManagement';

// Payment tab types - simplified for repair shop business
type PaymentTab = 'tracking' | 'providers' | 'purchase-orders';

interface TabConfig {
  id: PaymentTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const EnhancedPaymentManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine initial tab based on URL path
  const getInitialTab = (): PaymentTab => {
    const path = location.pathname;
    if (path.includes('/providers')) return 'providers';
    if (path.includes('/purchase-orders')) return 'purchase-orders';
    return 'tracking';
  };
  
  const [activeTab, setActiveTab] = useState<PaymentTab>(getInitialTab());
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);

  // Fetch basic payment data for repair shop
  const fetchPaymentData = async () => {
    try {
      setIsLoading(true);
      
      // Get customer payments
      const { data: customerPayments, error: customerError } = await supabase
        .from('customer_payments')
        .select('amount, status')
        .eq('status', 'completed');

      // Get purchase order payments
      const { data: poPayments, error: poError } = await supabase
        .from('purchase_order_payments')
        .select('amount, status')
        .eq('status', 'completed');

      if (customerError || poError) {
        console.error('Error fetching payments:', customerError || poError);
        return;
      }

      // Calculate totals
      const customerTotal = customerPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const poTotal = poPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      
      setTotalRevenue(customerTotal + poTotal);
      setTotalPayments((customerPayments?.length || 0) + (poPayments?.length || 0));

      // Get pending amounts
      const { data: pendingPayments } = await supabase
        .from('customer_payments')
        .select('amount')
        .eq('status', 'pending');
      
      const pendingTotal = pendingPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      setPendingAmount(pendingTotal);

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  // Update tab when URL changes
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);

  // Simple real-time subscription for payment updates
  useEffect(() => {
    const paymentsSubscription = supabase
      .channel('payment-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_payments' }, () => {
        fetchPaymentData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_order_payments' }, () => {
        fetchPaymentData();
      })
      .subscribe();

    return () => {
      paymentsSubscription.unsubscribe();
    };
  }, []);

  // Format currency with full numbers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Define payment tabs for repair shop business
  const paymentTabs: TabConfig[] = [
    {
      id: 'tracking',
      label: 'Payment Tracking',
      icon: <CreditCard size={20} />,
      description: 'Monitor customer repair payments',
      color: 'blue'
    },
    {
      id: 'providers',
      label: 'Payment Methods',
      icon: <Settings size={20} />,
      description: 'Manage cash, card, and transfer methods',
      color: 'indigo'
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: <ShoppingCart size={20} />,
      description: 'Manage supplier payments',
      color: 'teal'
    }
  ];

  // All tabs are available for repair shop users
  const availableTabs = paymentTabs;

  // Get current tab config
  const currentTab = paymentTabs.find(tab => tab.id === activeTab);

  // Handle tab changes
  const handleTabChange = (tabId: PaymentTab) => {
    setActiveTab(tabId);
    
    // Update URL to reflect the current tab
    const basePath = '/finance/payments';
    const tabPath = tabId === 'tracking' ? '' : `/${tabId}`;
    const newPath = `${basePath}${tabPath}`;
    
    if (location.pathname !== newPath) {
      navigate(newPath, { replace: true });
    }
  };

  // Handle navigation to specific pages
  const handleNavigateToPage = (page: string) => {
    navigate(page);
  };

  // Handle payment actions
  const handleViewPaymentDetails = (payment: any) => {
    toast(`Viewing details for payment ${payment.id}`);
  };

  const handleRefundPayment = (payment: any) => {
    toast(`Processing refund for payment ${payment.id}`);
  };

  const handleExportData = () => {
    toast('Exporting payment data...');
  };

  // Render tab content for repair shop
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tracking':
        return (
          <PaymentTrackingDashboard
            onViewDetails={handleViewPaymentDetails}
            onRefund={handleRefundPayment}
            onExport={handleExportData}
          />
        );
      case 'providers':
        return <PaymentProviderManagement />;
      case 'purchase-orders':
        return (
          <PurchaseOrderPaymentDashboard
            onViewDetails={(payment) => {
              toast(`Viewing purchase order payment details for ${payment.id}`);
            }}
            onMakePayment={(purchaseOrder) => {
              toast(`Opening payment modal for purchase order ${purchaseOrder.orderNumber}`);
            }}
            onExport={handleExportData}
          />
        );
      default:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Management</h3>
            <p className="text-gray-600">Select a tab to get started</p>
          </div>
        );
    }
  };

  return (
    <PageErrorBoundary pageName="Payment Management" showDetails={true}>
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton to="/dashboard" />
              <div className="flex items-center gap-3">
                <CreditCard size={24} className="text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Payment Management</h1>
                  <p className="text-xs text-gray-500">Repair shop payment tracking and management</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <GlassButton
                onClick={fetchPaymentData}
                icon={<RefreshCw size={16} />}
                variant="secondary"
                loading={isLoading}
                disabled={isLoading}
                className="text-sm"
              >
                Refresh
              </GlassButton>
              <GlassButton
                onClick={handleExportData}
                icon={<Download size={16} />}
                className="text-sm bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Export
              </GlassButton>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Matching GeneralProductDetailModal style */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex space-x-8 px-6">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                  {tab.badge && (
                    <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Payment Overview for Repair Shop */}
          {activeTab === 'tracking' && (
            <div className="mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Revenue</div>
                  <div className="text-lg font-bold text-emerald-900">{formatMoney(totalRevenue)}</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Pending</div>
                  <div className="text-lg font-bold text-orange-900">{formatMoney(pendingAmount)}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Payments</div>
                  <div className="text-lg font-bold text-purple-900">{totalPayments}</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading payment data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {renderTabContent()}
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default EnhancedPaymentManagementPage;
