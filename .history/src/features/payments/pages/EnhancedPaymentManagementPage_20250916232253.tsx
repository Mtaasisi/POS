import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  CreditCard, BarChart3, 
  RefreshCw, Download, Activity,
  Settings, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { 
  paymentTrackingService,
  PaymentTransaction,
  PaymentMetrics,
  PaymentMethodSummary
} from '../../../lib/paymentTrackingService';

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
  adminOnly?: boolean;
  color: string;
  badge?: string;
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
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalPayments: 0,
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0,
    failedAmount: 0,
    totalFees: 0,
    successRate: '0.0'
  });
  const [methodSummary, setMethodSummary] = useState<PaymentMethodSummary[]>([]);
  const [alerts, setAlerts] = useState<Array<{id: string; type: 'warning' | 'error' | 'info'; message: string; timestamp: string}>>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

  // Fetch basic metrics for repair shop payments
  const fetchBasicMetrics = useCallback(async () => {
    try {
      console.log('🔄 Fetching payment metrics for repair shop...');
      
      // Use Promise.allSettled to handle partial failures gracefully
      const [metricsResult, methodSummaryResult] = await Promise.allSettled([
        paymentTrackingService.calculatePaymentMetrics(),
        paymentTrackingService.getPaymentMethodSummary()
      ]);

      // Handle metrics data
      if (metricsResult.status === 'fulfilled') {
        setMetrics(metricsResult.value);
        setConnectionStatus('connected');
      } else {
        console.warn('Failed to fetch payment metrics:', metricsResult.reason);
        setConnectionStatus('disconnected');
        // Keep existing metrics if fetch fails
      }

      // Handle method summary data
      if (methodSummaryResult.status === 'fulfilled') {
        setMethodSummary(methodSummaryResult.value);
      } else {
        console.warn('Failed to fetch payment method summary:', methodSummaryResult.reason);
        // Keep existing method summary if fetch fails
      }

      // Generate simple alerts for repair shop
      const newAlerts = [];
      const currentMetrics = metricsResult.status === 'fulfilled' ? metricsResult.value : metrics;
      
      if (currentMetrics.pendingAmount > 0) {
        newAlerts.push({
          id: 'pending-payments',
          type: 'info' as const,
          message: `${currentMetrics.pendingAmount} TSH in pending payments`,
          timestamp: new Date().toISOString()
        });
      }
      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error fetching payment metrics:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
          console.warn('⚠️ Connection issue detected, using cached data if available');
          toast.error('Connection issue. Using cached data.');
        } else {
          console.error('❌ Unexpected error:', error);
          toast.error('Failed to load payment data. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBasicMetrics();
  }, [fetchBasicMetrics]);

  // Update tab when URL changes
  useEffect(() => {
    const newTab = getInitialTab();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);

  // Real-time subscriptions for comprehensive payment monitoring with debouncing
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;
    let lastRefresh = 0;
    const minRefreshInterval = 5000; // Minimum 5 seconds between refreshes

    const debouncedRefresh = () => {
      const now = Date.now();
      if (now - lastRefresh < minRefreshInterval) {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          lastRefresh = Date.now();
          fetchBasicMetrics();
        }, minRefreshInterval - (now - lastRefresh));
      } else {
        lastRefresh = now;
        fetchBasicMetrics();
      }
    };

    const paymentsSubscription = supabase
      .channel('enhanced-payment-management')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_payments' }, (payload) => {
        console.log('🔔 Customer payment update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lats_sales' }, (payload) => {
        console.log('🔔 POS sale update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lats_sale_items' }, (payload) => {
        console.log('🔔 Sale item update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        console.log('🔔 Customer update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload) => {
        console.log('🔔 Device update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_audit_log' }, (payload) => {
        console.log('🔔 Payment audit log update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_reconciliation' }, (payload) => {
        console.log('🔔 Payment reconciliation update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_accounts' }, (payload) => {
        console.log('🔔 Finance account update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_alerts' }, (payload) => {
        console.log('🔔 Security alert update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compliance_checks' }, (payload) => {
        console.log('🔔 Compliance check update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_rules' }, (payload) => {
        console.log('🔔 Automation rule update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_workflows' }, (payload) => {
        console.log('🔔 Automation workflow update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_order_payments' }, (payload) => {
        console.log('🔔 Purchase order payment update received:', payload.eventType);
        debouncedRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lats_purchase_orders' }, (payload) => {
        console.log('🔔 Purchase order update received:', payload.eventType);
        debouncedRefresh();
      })
      .subscribe((status) => {
        console.log('📡 Enhanced payment management subscription status:', status);
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.warn('⚠️ Payment management subscription issue:', status);
        }
      });

    return () => {
      clearTimeout(refreshTimeout);
      paymentsSubscription.unsubscribe();
    };
  }, [fetchBasicMetrics]);

  // Format currency with full numbers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Define all payment tabs
  const paymentTabs: TabConfig[] = [
    {
      id: 'tracking',
      label: 'Payment Tracking',
      icon: <CreditCard size={20} />,
      description: 'Monitor and manage payment transactions',
      color: 'blue'
    },
    {
      id: 'analytics',
      label: 'Payment Analytics',
      icon: <BarChart3 size={20} />,
      description: 'Advanced payment insights and trends',
      color: 'purple'
    },
    {
      id: 'reconciliation',
      label: 'Reconciliation',
      icon: <Activity size={20} />,
      description: 'Reconcile payments and identify discrepancies',
      color: 'green'
    },
    {
      id: 'providers',
      label: 'Payment Providers',
      icon: <Settings size={20} />,
      description: 'Manage payment providers and configurations',
      color: 'indigo'
    },
    {
      id: 'security',
      label: 'Security & Compliance',
      icon: <Shield size={20} />,
      description: 'Payment security and compliance monitoring',
      adminOnly: true,
      color: 'red'
    },
    {
      id: 'automation',
      label: 'Automation',
      icon: <Zap size={20} />,
      description: 'Automated payment workflows and rules',
      adminOnly: true,
      color: 'orange',
      badge: 'New'
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: <ShoppingCart size={20} />,
      description: 'Manage purchase order payments and supplier transactions',
      color: 'teal'
    }
  ];

  // Filter tabs based on user role
  const availableTabs = paymentTabs.filter(tab => 
    !tab.adminOnly || currentUser?.role === 'admin'
  );

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
  const handleViewPaymentDetails = (payment: PaymentTransaction) => {
    toast(`Viewing details for payment ${payment.transactionId}`);
    // Implement payment details modal or navigation
  };

  const handleRefundPayment = (payment: PaymentTransaction) => {
    toast(`Processing refund for payment ${payment.transactionId}`);
    // Implement refund modal
  };

  const handleExportData = () => {
    toast('Exporting payment data...');
    // Implement export functionality
  };

  // Render tab content
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
      case 'analytics':
        return (
          <PaymentAnalyticsDashboard
            onExport={handleExportData}
          />
        );
        case 'reconciliation':
          return <PaymentReconciliation />;
      case 'providers':
        return <PaymentProviderManagement />;
      case 'security':
        return <PaymentSecurity />;
      case 'automation':
        return <PaymentAutomation />;
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
    <PageErrorBoundary pageName="Enhanced Payment Management" showDetails={true}>
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6 space-y-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton to="/dashboard" />
              <div className="flex items-center gap-3">
                <CreditCard size={24} className="text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Enhanced Payment Management</h1>
                  <p className="text-xs text-gray-500">Comprehensive payment management system</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  connectionStatus === 'connected' ? 'bg-green-100 text-green-700' :
                  connectionStatus === 'disconnected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'disconnected' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></div>
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'disconnected' ? 'Disconnected' : 'Unknown'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <GlassButton
                onClick={() => {
                  setIsLoading(true);
                  fetchBasicMetrics();
                }}
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
          {/* Payment Overview - Matching GeneralProductDetailModal style */}
          {activeTab === 'tracking' && (
            <div className="mb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">Total Amount</div>
                  <div className="text-lg font-bold text-emerald-900">{formatMoney(metrics.totalAmount)}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Success Rate</div>
                  <div className="text-lg font-bold text-blue-900">{metrics.successRate}%</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Pending</div>
                  <div className="text-lg font-bold text-orange-900">{formatMoney(metrics.pendingAmount)}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">Transactions</div>
                  <div className="text-lg font-bold text-purple-900">{metrics.totalPayments}</div>
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
