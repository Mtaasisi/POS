import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  User, Settings, Shield, Bell, Smartphone, CreditCard, 
  Database, Globe, Palette, Eye, Lock, Save, RefreshCw,
  ChevronRight, TestTube, Activity, Cloud, HardDrive,
  MessageCircle, Mail, Phone, Sun, Moon, Monitor
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PageErrorBoundary } from '../../../features/shared/components/PageErrorBoundary';

// Import individual settings components/tabs
import UserProfileSettings from '../components/UserProfileSettings';
import AppearanceSettings from '../components/AppearanceSettings';
import NotificationSettings from '../components/NotificationSettings';
import PaymentSettings from '../components/PaymentSettings';
import AdminSettings from '../components/AdminSettings';
import SystemSettings from '../components/SystemSettings';

// Tab types for the unified settings
type SettingsTab = 
  | 'profile' 
  | 'appearance' 
  | 'notifications' 
  | 'payments' 
  | 'admin' 
  | 'system';

interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  adminOnly?: boolean;
  color: string;
}

const UnifiedSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Define all settings tabs
  const settingsTabs: TabConfig[] = [
    {
      id: 'profile',
      label: 'Profile & Account',
      icon: <User size={20} />,
      description: 'Manage your personal information and account settings',
      color: 'blue'
    },
    {
      id: 'appearance',
      label: 'Appearance & Theme',
      icon: <Palette size={20} />,
      description: 'Customize the look and feel of your application',
      color: 'purple'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={20} />,
      description: 'Configure notification preferences and channels',
      color: 'green'
    },
    {
      id: 'payments',
      label: 'Payment Settings',
      icon: <CreditCard size={20} />,
      description: 'Configure payment providers and POS settings',
      color: 'orange'
    },
    {
      id: 'admin',
      label: 'Admin Settings',
      icon: <Shield size={20} />,
      description: 'Administrative settings and system configuration',
      adminOnly: true,
      color: 'red'
    },
    {
      id: 'system',
      label: 'System & Database',
      icon: <Database size={20} />,
      description: 'System performance and database management',
      adminOnly: true,
      color: 'gray'
    }
  ];

  // Filter tabs based on user role
  const availableTabs = settingsTabs.filter(tab => 
    !tab.adminOnly || currentUser?.role === 'admin'
  );

  // Get current tab config
  const currentTab = settingsTabs.find(tab => tab.id === activeTab);

  // Handle tab changes
  const handleTabChange = (tabId: SettingsTab) => {
    setActiveTab(tabId);
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Emit save event that child components can listen to
      window.dispatchEvent(new CustomEvent('settings:save', { 
        detail: { tab: activeTab } 
      }));
      
      // Small delay to allow components to save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfileSettings isActive={true} />;
      case 'appearance':
        return <AppearanceSettings isActive={true} />;
      case 'notifications':
        return <NotificationSettings isActive={true} />;
      case 'payments':
        return <PaymentSettings isActive={true} />;
      case 'admin':
        return <AdminSettings isActive={true} />;
      case 'system':
        return <SystemSettings isActive={true} />;
      default:
        return <UserProfileSettings isActive={true} />;
    }
  };

  return (
    <PageErrorBoundary pageName="Unified Settings" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                {currentTab?.description || 'Manage your application settings'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={() => window.location.reload()}
              icon={<RefreshCw size={18} />}
              variant="secondary"
              disabled={isLoading || isSaving}
            >
              Refresh
            </GlassButton>
            <GlassButton
              onClick={handleSave}
              icon={<Save size={18} />}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              loading={isSaving}
              disabled={isLoading}
            >
              Save Changes
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <GlassCard className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Settings Categories</h3>
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
              <h4 className="font-medium text-gray-900 mb-3">Quick Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">User Role:</span>
                  <span className="font-medium capitalize">{currentUser?.role || 'User'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Status:</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Login:</span>
                  <span className="font-medium">Today</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Settings Content */}
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
                  <span className="ml-3 text-gray-600">Loading settings...</span>
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

export default UnifiedSettingsPage;
