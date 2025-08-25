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
  BarChart3, TrendingUp, PieChart, Activity, DollarSign, Users, 
  Calendar, Clock, Download, Filter, RefreshCw, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight, Target, Award, ShoppingCart,
  CreditCard, Package, Crown, FileText, Settings, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import analytics components
import BusinessAnalyticsTab from '../components/BusinessAnalyticsTab';
import SalesAnalyticsTab from '../components/SalesAnalyticsTab';
import PaymentAnalyticsTab from '../components/PaymentAnalyticsTab';
import CustomerAnalyticsTab from '../components/CustomerAnalyticsTab';
import AdvancedAnalyticsTab from '../components/AdvancedAnalyticsTab';

// Analytics tab types
type AnalyticsTab = 
  | 'business' 
  | 'sales' 
  | 'payments' 
  | 'customers' 
  | 'advanced';

interface TabConfig {
  id: AnalyticsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  adminOnly?: boolean;
  color: string;
}

const UnifiedAnalyticsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('business');
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [showCharts, setShowCharts] = useState(true);

  // Define all analytics tabs
  const analyticsTabs: TabConfig[] = [
    {
      id: 'business',
      label: 'Business Overview',
      icon: <BarChart3 size={20} />,
      description: 'Comprehensive business performance metrics and KPIs',
      color: 'blue'
    },
    {
      id: 'sales',
      label: 'Sales Analytics',
      icon: <TrendingUp size={20} />,
      description: 'Sales performance, trends, and revenue analysis',
      color: 'green'
    },
    {
      id: 'payments',
      label: 'Payment Analytics',
      icon: <CreditCard size={20} />,
      description: 'Payment processing and transaction analytics',
      color: 'purple'
    },
    {
      id: 'customers',
      label: 'Customer Analytics',
      icon: <Users size={20} />,
      description: 'Customer behavior, loyalty, and engagement metrics',
      color: 'orange'
    },
    {
      id: 'advanced',
      label: 'Advanced Analytics',
      icon: <Activity size={20} />,
      description: 'Advanced reporting and detailed analytics insights',
      adminOnly: true,
      color: 'red'
    }
  ];

  // Filter tabs based on user role
  const availableTabs = analyticsTabs.filter(tab => 
    !tab.adminOnly || currentUser?.role === 'admin'
  );

  // Get current tab config
  const currentTab = analyticsTabs.find(tab => tab.id === activeTab);

  // Handle tab changes
  const handleTabChange = (tabId: AnalyticsTab) => {
    setActiveTab(tabId);
  };

  // Export analytics data
  const handleExport = () => {
    toast.success(`Exporting ${activeTab} analytics data...`);
    // Add export logic here
  };

  // Refresh analytics data
  const handleRefresh = () => {
    setIsLoading(true);
    // Trigger refresh for current tab
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Analytics data refreshed');
    }, 1000);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return <BusinessAnalyticsTab isActive={true} timeRange={timeRange} />;
      case 'sales':
        return <SalesAnalyticsTab isActive={true} timeRange={timeRange} />;
      case 'payments':
        return <PaymentAnalyticsTab isActive={true} timeRange={timeRange} />;
      case 'customers':
        return <CustomerAnalyticsTab isActive={true} timeRange={timeRange} />;
      case 'advanced':
        return <AdvancedAnalyticsTab isActive={true} timeRange={timeRange} />;
      default:
        return <BusinessAnalyticsTab isActive={true} timeRange={timeRange} />;
    }
  };

  return (
    <PageErrorBoundary pageName="Unified Analytics" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {currentTab?.description || 'Comprehensive business analytics and insights'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassSelect
              options={[
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
                { value: '1y', label: 'Last Year' }
              ]}
              value={timeRange}
              onChange={(value) => setTimeRange(value)}
              placeholder="Select Time Range"
              className="min-w-[150px]"
            />
            
            <GlassButton
              onClick={() => setShowCharts(!showCharts)}
              icon={showCharts ? <EyeOff size={18} /> : <Eye size={18} />}
              variant="secondary"
              disabled={isLoading}
            >
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </GlassButton>

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
              onClick={handleExport}
              icon={<Download size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Export
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Analytics Navigation */}
          <div className="lg:col-span-1">
            <GlassCard className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Analytics Categories</h3>
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
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-medium text-green-600">TZS 12.5M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Customers:</span>
                  <span className="font-medium text-blue-600">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Products Sold:</span>
                  <span className="font-medium text-purple-600">456</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth Rate:</span>
                  <span className="font-medium text-green-600">+12.5%</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Analytics Content */}
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
                  <span className="ml-3 text-gray-600">Loading analytics...</span>
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

export default UnifiedAnalyticsPage;
