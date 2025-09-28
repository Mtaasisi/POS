import React, { useState, Suspense } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
// Create a simple loading spinner component
const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>
);
import { 
  FileText, 
  Plus, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Monitor,
  List,
  Users
} from 'lucide-react';

// Lazy load the diagnostic tab components
const NewDiagnosticRequestTab = React.lazy(() => import('../components/tabs/NewDiagnosticRequestTab'));
const AssignedDiagnosticsTab = React.lazy(() => import('../components/tabs/AssignedDiagnosticsTab'));
const DiagnosticReportsTab = React.lazy(() => import('../components/tabs/DiagnosticReportsTab'));
const DiagnosticTemplatesTab = React.lazy(() => import('../components/tabs/DiagnosticTemplatesTab'));
const DiagnosticDeviceTab = React.lazy(() => import('../components/tabs/DiagnosticDeviceTab'));
const GroupedDevicesTab = React.lazy(() => import('../components/tabs/GroupedDevicesTab'));

type DiagnosticTab = 'new-request' | 'assigned' | 'reports' | 'templates' | 'devices' | 'grouped';

interface TabConfig {
  id: DiagnosticTab;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  description: string;
}

const UnifiedDiagnosticManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<DiagnosticTab>('new-request');

  const tabs: TabConfig[] = [
    {
      id: 'new-request',
      label: 'New Request',
      icon: <Plus className="w-5 h-5" />,
      roles: ['admin', 'customer-care'],
      description: 'Create new diagnostic requests'
    },
    {
      id: 'assigned',
      label: 'Assigned Tasks',
      icon: <CheckSquare className="w-5 h-5" />,
      roles: ['technician', 'admin'],
      description: 'View assigned diagnostic tasks'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['admin', 'technician'],
      description: 'Diagnostic reports and analytics'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <Settings className="w-5 h-5" />,
      roles: ['admin'],
      description: 'Manage diagnostic templates'
    },
    {
      id: 'devices',
      label: 'Device Diagnostics',
      icon: <Monitor className="w-5 h-5" />,
      roles: ['admin', 'technician'],
      description: 'Individual device diagnostics'
    },
    {
      id: 'grouped',
      label: 'Grouped Devices',
      icon: <Users className="w-5 h-5" />,
      roles: ['admin', 'technician'],
      description: 'Grouped device diagnostics'
    }
  ];

  // Filter tabs based on user role
  const availableTabs = tabs.filter(tab => {
    const userRole = currentUser?.role;
    const normalizedRole = userRole ? String(userRole) : null;
    return normalizedRole && tab.roles.includes(normalizedRole);
  });

  // Set default tab based on user role
  React.useEffect(() => {
    if (currentUser?.role) {
      const defaultTab = availableTabs.find(tab => tab.id === 'new-request') || availableTabs[0];
      if (defaultTab) {
        setActiveTab(defaultTab.id);
      }
    }
  }, [currentUser?.role]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'new-request':
        return <NewDiagnosticRequestTab />;
      case 'assigned':
        return <AssignedDiagnosticsTab />;
      case 'reports':
        return <DiagnosticReportsTab />;
      case 'templates':
        return <DiagnosticTemplatesTab />;
      case 'devices':
        return <DiagnosticDeviceTab />;
      case 'grouped':
        return <GroupedDevicesTab />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a tab to get started</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Diagnostic Management</h1>
                <p className="text-sm text-gray-600">Comprehensive device diagnostics platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GlassCard className="overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {availableTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <Suspense 
              fallback={
                <div className="flex items-center justify-center h-64">
                  <PageLoadingSpinner />
                </div>
              }
            >
              {renderTabContent()}
            </Suspense>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default UnifiedDiagnosticManagementPage;
