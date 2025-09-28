import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  CreditCard, BarChart3, 
  RefreshCw, ChevronRight, Download, Activity,
  Settings, Shield, Zap, AlertCircle, ShoppingCart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { 
  paymentTrackingService,
  PaymentTransaction,
  PaymentMetrics,
  PaymentMethodSummary
} from '../../../lib/paymentTrackingService';
import { paymentReconciliationService } from '../../../lib/paymentReconciliationService';
import { paymentProviderService } from '../../../lib/paymentProviderService';
import { paymentSecurityService } from '../../../lib/paymentSecurityService';
import { paymentAutomationService } from '../../../lib/paymentAutomationService';

// Import our new components
import PaymentTrackingDashboard from '../components/PaymentTrackingDashboard';
import PaymentAnalyticsDashboard from '../components/PaymentAnalyticsDashboard';
import PurchaseOrderPaymentDashboard from '../components/PurchaseOrderPaymentDashboard';
import PaymentProviderManagement from '../components/PaymentProviderManagement';
import PaymentReconciliation from '../components/PaymentReconciliation';
import PaymentSecurity from '../components/PaymentSecurity';
import PaymentAutomation from '../components/PaymentAutomation';

// Payment tab types
type PaymentTab = 'tracking' | 'analytics' | 'reconciliation' | 'providers' | 'security' | 'automation' | 'purchase-orders';

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
  const [activeTab, setActiveTab] = useState<PaymentTab>('tracking');
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

  // Fetch basic metrics for sidebar with comprehensive database integration
  const fetchBasicMetrics = useCallback(async () => {
    try {
      console.log('🔄 Fetching comprehensive payment metrics from database...');
      
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

      // Execute automation rules for any pending payments (if service is available)
      // Only run this occasionally to reduce load
      const shouldRunAutomation = Math.random() < 0.3; // 30% chance
      if (shouldRunAutomation) {
        try {
          const pendingPayments = await paymentTrackingService.fetchPaymentTransactions(
            undefined, undefined, 'pending'
          );
          
          if (pendingPayments && pendingPayments.length > 0) {
            // Process only 2 payments at a time to reduce load
            for (const payment of pendingPayments.slice(0, 2)) {
              try {
                await paymentAutomationService.executeAutomationRules(payment);
              } catch (ruleError) {
                console.warn('Individual automation rule failed:', ruleError);
              }
            }
          }
        } catch (autoError) {
          console.warn('Automation execution failed:', autoError);
        }
      }

      // Perform security monitoring (if service is available)
      // Only run this occasionally to reduce load
      const shouldRunSecurity = Math.random() < 0.2; // 20% chance
      if (shouldRunSecurity) {
        try {
          await paymentSecurityService.monitorPaymentTransactions();
        } catch (securityError) {
          console.warn('Security monitoring failed:', securityError);
        }
      }

      // Generate alerts based on metrics (use current state)
      const newAlerts = [];
      const currentMetrics = metricsResult.status === 'fulfilled' ? metricsResult.value : metrics;
      
      if (parseFloat(currentMetrics.successRate) < 95) {
        newAlerts.push({
          id: 'low-success-rate',
          type: 'warning' as const,
          message: `Payment success rate is below 95% (${currentMetrics.successRate}%)`,
          timestamp: new Date().toISOString()
        });
      }
      if (currentMetrics.pendingAmount > currentMetrics.totalAmount * 0.1) {
        newAlerts.push({
          id: 'high-pending',
          type: 'warning' as const,
          message: 'High number of pending payments detected',
          timestamp: new Date().toISOString()
        });
      }
      if (currentMetrics.failedAmount > currentMetrics.totalAmount * 0.05) {
        newAlerts.push({
          id: 'high-failures',
          type: 'error' as const,
          message: 'Payment failure rate is above 5%',
          timestamp: new Date().toISOString()
        });
      }
      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error fetching basic metrics:', error);
      
      // Add fallback mechanisms
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_CLOSED')) {
          console.warn('⚠️ Connection issue detected, using cached data if available');
          // Keep existing data and show a warning
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Enhanced Payment Management</h1>
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
              <p className="text-gray-600 mt-1">
                {currentTab?.description || 'Comprehensive payment management system'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={() => {
                setIsLoading(true);
                fetchBasicMetrics();
              }}
              icon={<RefreshCw size={18} />}
              variant="secondary"
              loading={isLoading}
              disabled={isLoading}
            >
              Refresh
            </GlassButton>
            <GlassButton
              onClick={handleExportData}
              icon={<Download size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Export
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
          {/* Payment Navigation */}
          <div className="xl:col-span-1">
            <GlassCard className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Categories</h3>
              <nav className="space-y-2">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? `bg-${tab.color}-500 text-white shadow-lg`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`${activeTab === tab.id ? 'text-white' : `text-${tab.color}-500`}`}>
                      {tab.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tab.label}</span>
                        {tab.badge && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                            {tab.badge}
                          </span>
                        )}
                      </div>
                      {tab.adminOnly && (
                        <div className="text-xs opacity-75">Admin Only</div>
                      )}
                    </div>
                    <ChevronRight 
                      size={16} 
                      className={`${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} 
                    />
                  </button>
                ))}
              </nav>
            </GlassCard>

            {/* Live Stats */}
            <GlassCard className="p-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Live Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Transactions:</span>
                  <span className="font-medium text-blue-600">{metrics.totalPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-green-600">{formatMoney(metrics.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium text-purple-600">{metrics.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-orange-600">{formatMoney(metrics.pendingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">{formatMoney(metrics.failedAmount)}</span>
                </div>
              </div>
            </GlassCard>
            
            {/* Payment Methods Quick View */}
            <GlassCard className="p-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Payment Methods</h4>
              <div className="space-y-2 text-sm">
                {methodSummary.slice(0, 4).map((method, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{method.method}:</span>
                    <span className="font-medium text-blue-600">{formatMoney(method.amount)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Alerts */}
            {alerts.length > 0 && (
              <GlassCard className="p-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Alerts</h4>
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-2 rounded-lg text-xs ${
                      alert.type === 'error' ? 'bg-red-100 text-red-700' :
                      alert.type === 'warning' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      <div className="flex items-center gap-1">
                        {alert.type === 'error' && <AlertCircle className="w-3 h-3" />}
                        {alert.type === 'warning' && <AlertCircle className="w-3 h-3" />}
                        {alert.type === 'info' && <AlertCircle className="w-3 h-3" />}
                        <span>{alert.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Payment Content */}
          <div className="xl:col-span-5">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`text-${currentTab?.color}-500`}>
                  {currentTab?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentTab?.label}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currentTab?.description}
                  </p>
                </div>
              </div>

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
            </GlassCard>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default EnhancedPaymentManagementPage;
