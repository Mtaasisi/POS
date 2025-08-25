import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../../features/shared/components/PageErrorBoundary';
import { 
  CreditCard, DollarSign, TrendingUp, BarChart3, Wallet, 
  RefreshCw, ChevronRight, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Payment tab types
type PaymentTab = 'tracking' | 'accounts' | 'reports' | 'analytics';

interface TabConfig {
  id: PaymentTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  adminOnly?: boolean;
  color: string;
}

const UnifiedPaymentManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PaymentTab>('tracking');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Define all payment tabs
  const paymentTabs: TabConfig[] = [
    {
      id: 'tracking',
      label: 'Payment Tracking',
      icon: <CreditCard size={20} />,
      description: 'Track and manage payment transactions',
      color: 'blue'
    },
    {
      id: 'accounts',
      label: 'Payment Accounts',
      icon: <Wallet size={20} />,
      description: 'Manage payment accounts and settings',
      color: 'green'
    },
    {
      id: 'reports',
      label: 'Payment Reports',
      icon: <BarChart3 size={20} />,
      description: 'Generate payment reports and analytics',
      color: 'purple'
    },
    {
      id: 'analytics',
      label: 'Payment Analytics',
      icon: <TrendingUp size={20} />,
      description: 'Advanced payment analytics and insights',
      adminOnly: true,
      color: 'orange'
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

  // Refresh data
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Payment data refreshed');
    }, 1000);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tracking':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Tracking</h3>
            <p className="text-gray-600">Track and manage payment transactions</p>
          </div>
        );
      case 'accounts':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Accounts</h3>
            <p className="text-gray-600">Manage payment accounts and settings</p>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Reports</h3>
            <p className="text-gray-600">Generate payment reports and analytics</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Analytics</h3>
            <p className="text-gray-600">Advanced payment analytics and insights</p>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Tracking</h3>
            <p className="text-gray-600">Track and manage payment transactions</p>
          </div>
        );
    }
  };

  return (
    <PageErrorBoundary pageName="Unified Payment Management" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-gray-600 mt-1">
                {currentTab?.description || 'Comprehensive payment management system'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassSelect
              options={[
                { value: 'all', label: 'All Methods' },
                { value: 'cash', label: 'Cash' },
                { value: 'mobile_money', label: 'Mobile Money' },
                { value: 'card', label: 'Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' }
              ]}
              value={methodFilter}
              onChange={(value) => setMethodFilter(value)}
              placeholder="Filter by Method"
              className="min-w-[150px]"
            />

            <GlassSelect
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' }
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              placeholder="Filter by Status"
              className="min-w-[150px]"
            />
            
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search payments..."
              className="min-w-[200px]"
            />

            <GlassButton
              onClick={handleRefresh}
              icon={<RefreshCw size={18} />}
              variant="secondary"
              loading={isLoading}
              disabled={isLoading}
            >
              Refresh
            </GlassButton>

            <GlassButton
              onClick={() => {/* TODO: Export payments */}}
              icon={<Download size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Export
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                      <div className="font-medium">{tab.label}</div>
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

            {/* Quick Stats */}
            <GlassCard className="p-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Transactions:</span>
                  <span className="font-medium text-blue-600">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">18</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium text-yellow-600">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-purple-600">TZS 4.2M</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Payment Content */}
          <div className="lg:col-span-3">
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

export default UnifiedPaymentManagementPage;
