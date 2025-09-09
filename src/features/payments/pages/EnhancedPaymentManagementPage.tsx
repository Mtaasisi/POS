import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { BackButton } from '../../shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../shared/components/PageErrorBoundary';
import { 
  CreditCard, BarChart3, 
  RefreshCw, ChevronRight, Download, Activity,
  Settings, Shield, Zap, AlertCircle
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

// Payment tab types
type PaymentTab = 'tracking' | 'analytics' | 'reconciliation' | 'providers' | 'security' | 'automation';

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
        return (
          <div className="space-y-6">
            {/* Reconciliation Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Today's Matched</p>
                    <p className="text-xl font-semibold text-green-700">1,247</p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Discrepancies</p>
                    <p className="text-xl font-semibold text-yellow-700">23</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-xl font-semibold text-blue-700">98.2%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reconciliation Activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reconciliation Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">Morning reconciliation completed</span>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">3 discrepancies found in M-Pesa transactions</span>
                  </div>
                  <span className="text-xs text-gray-500">4 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">Bank reconciliation successful</span>
                  </div>
                  <span className="text-xs text-gray-500">6 hours ago</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={async () => {
                  try {
                    const today = new Date().toISOString().split('T')[0];
                    await paymentReconciliationService.performDailyReconciliation(today);
                    toast.success('Daily reconciliation completed');
                  } catch (error) {
                    console.error('Reconciliation error:', error);
                    toast.error('Reconciliation failed - service may not be available');
                  }
                }}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Activity className="w-4 h-4 mr-2" />
                Run Today's Reconciliation
              </GlassButton>
              <GlassButton
                onClick={() => handleNavigateToPage('/finance/payments/reconciliation')}
                variant="secondary"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Detailed Reports
              </GlassButton>
              <GlassButton
                onClick={() => toast('Exporting reconciliation report...')}
                variant="secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </GlassButton>
            </div>
          </div>
        );
      case 'providers':
        return (
          <div className="space-y-6">
            {/* Provider Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Providers</p>
                    <p className="text-xl font-semibold text-green-700">4</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-xl font-semibold text-blue-700">12.5K</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-xl font-semibold text-purple-700">99.1%</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Issues</p>
                    <p className="text-xl font-semibold text-orange-700">2</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Providers</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">M-Pesa</p>
                      <p className="text-sm text-gray-600">Mobile Money Provider</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">Active</p>
                    <p className="text-xs text-gray-500">8.2K transactions</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Tigo Pesa</p>
                      <p className="text-sm text-gray-600">Mobile Money Provider</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">Active</p>
                    <p className="text-xs text-gray-500">2.1K transactions</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Airtel Money</p>
                      <p className="text-sm text-gray-600">Mobile Money Provider</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">Active</p>
                    <p className="text-xs text-gray-500">1.8K transactions</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-sm text-gray-600">Banking Provider</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">Maintenance</p>
                    <p className="text-xs text-gray-500">0.4K transactions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={async () => {
                  try {
                    const providers = await paymentProviderService.getPaymentProvidersWithRealMetrics();
                    const activeProviders = providers.filter(p => p.status === 'active');
                    toast.success(`Found ${activeProviders.length} active payment providers with real transaction data`);
                  } catch (error) {
                    console.error('Provider service error:', error);
                    toast.error('Failed to fetch providers - service may not be available');
                  }
                }}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Check Provider Status
              </GlassButton>
              <GlassButton
                onClick={() => handleNavigateToPage('/finance/payments/providers')}
                variant="secondary"
              >
                <Activity className="w-4 h-4 mr-2" />
                Manage Providers
              </GlassButton>
              <GlassButton
                onClick={() => toast('Refreshing provider metrics...')}
                variant="secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Metrics
              </GlassButton>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            {/* Security Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Security Score</p>
                    <p className="text-xl font-semibold text-green-700">98%</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Alerts</p>
                    <p className="text-xl font-semibold text-red-700">3</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Scan</p>
                    <p className="text-xl font-semibold text-blue-700">2h ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Alerts */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">High Risk Transaction Detected</p>
                      <p className="text-sm text-gray-600">Unusual payment pattern from account #12345</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-700">High</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Failed Login Attempts</p>
                      <p className="text-sm text-gray-600">Multiple failed attempts from IP 192.168.1.100</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">Medium</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Certificate Expiry Warning</p>
                      <p className="text-sm text-gray-600">SSL certificate expires in 15 days</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">Medium</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">PCI DSS Compliance</span>
                  <span className="text-sm font-medium text-green-700">Compliant</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">GDPR Compliance</span>
                  <span className="text-sm font-medium text-green-700">Compliant</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">ISO 27001</span>
                  <span className="text-sm font-medium text-yellow-700">In Review</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">SOC 2 Type II</span>
                  <span className="text-sm font-medium text-green-700">Compliant</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={async () => {
                  try {
                    await paymentSecurityService.performComplianceChecks();
                    toast.success('Compliance checks completed');
                  } catch (error) {
                    console.error('Security service error:', error);
                    toast.error('Compliance check failed - service may not be available');
                  }
                }}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Run Compliance Check
              </GlassButton>
              <GlassButton
                onClick={async () => {
                  try {
                    const alerts = await paymentSecurityService.getSecurityAlerts('open');
                    toast.success(`Found ${alerts.length} open security alerts`);
                  } catch (error) {
                    console.error('Security alerts error:', error);
                    toast.error('Failed to fetch security alerts - service may not be available');
                  }
                }}
                variant="secondary"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                View Security Alerts
              </GlassButton>
              <GlassButton
                onClick={() => toast('Generating security report...')}
                variant="secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </GlassButton>
            </div>
          </div>
        );
      case 'automation':
        return (
          <div className="space-y-6">
            {/* Automation Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Rules</p>
                    <p className="text-xl font-semibold text-orange-700">12</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-xl font-semibold text-green-700">96.8%</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Processed Today</p>
                    <p className="text-xl font-semibold text-blue-700">2.3K</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Automation Rules */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Automation Rules</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Auto-Refund Failed Payments</p>
                      <p className="text-sm text-gray-600">Automatically refund payments that fail after 3 attempts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">Active</p>
                    <p className="text-xs text-gray-500">Last run: 5 min ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Daily Reconciliation</p>
                      <p className="text-sm text-gray-600">Run daily reconciliation at 6:00 AM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">Active</p>
                    <p className="text-xs text-gray-500">Next run: Tomorrow 6:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Fraud Detection Alert</p>
                      <p className="text-sm text-gray-600">Send alerts for transactions over $1,000</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">Active</p>
                    <p className="text-xs text-gray-500">Last triggered: 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Weekly Report Generation</p>
                      <p className="text-sm text-gray-600">Generate weekly payment reports every Monday</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-700">Paused</p>
                    <p className="text-xs text-gray-500">Next run: Monday 9:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Automation Activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Automation Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">Auto-refund processed for payment #12345</span>
                  </div>
                  <span className="text-xs text-gray-500">10 minutes ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">Daily reconciliation completed successfully</span>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-900">Fraud alert triggered for high-value transaction</span>
                  </div>
                  <span className="text-xs text-gray-500">3 hours ago</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={async () => {
                  try {
                    const rules = await paymentAutomationService.getActiveAutomationRules();
                    toast.success(`Found ${rules.length} active automation rules`);
                  } catch (error) {
                    console.error('Automation service error:', error);
                    toast.error('Failed to fetch automation rules - service may not be available');
                  }
                }}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Check Automation Rules
              </GlassButton>
              <GlassButton
                onClick={async () => {
                  try {
                    const metrics = await paymentAutomationService.getAutomationMetrics();
                    toast.success(`Automation success rate: ${metrics.successRate}%`);
                  } catch (error) {
                    console.error('Automation metrics error:', error);
                    toast.error('Failed to fetch automation metrics - service may not be available');
                  }
                }}
                variant="secondary"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Metrics
              </GlassButton>
              <GlassButton
                onClick={() => toast('Creating new automation rule...')}
                variant="secondary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Create Rule
              </GlassButton>
            </div>
          </div>
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
      <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Payment Navigation */}
          <div className="lg:col-span-1">
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
          <div className="lg:col-span-4">
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
