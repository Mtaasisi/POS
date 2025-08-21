import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { PageErrorBoundary } from '../../../features/shared/components/PageErrorBoundary';
import PageHeader from '../components/ui/PageHeader';
import { 
  Package, Crown, Users, MapPin, Settings, Plus, Edit, Trash2, 
  Building, Tag, Truck, Store, Database, Shield, Bell, BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import tab components
import BrandsTab from '../components/inventory-management/BrandsTab';
import CategoriesTab from '../components/inventory-management/CategoriesTab';
import SuppliersTab from '../components/inventory-management/SuppliersTab';
import StoreLocationsTab from '../components/inventory-management/StoreLocationsTab';
import ShelvesTab from '../components/inventory-management/ShelvesTab';
import SystemSettingsTab from '../components/inventory-management/SystemSettingsTab';

type TabType = 'brands' | 'categories' | 'suppliers' | 'store-locations' | 'shelves' | 'system-settings';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    id: 'brands',
    label: 'Brands',
    icon: Crown,
    color: 'blue',
    description: 'Manage product brands and manufacturers'
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: Tag,
    color: 'green',
    description: 'Organize products into categories'
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Truck,
    color: 'purple',
    description: 'Manage suppliers and vendor relationships'
  },
  {
    id: 'store-locations',
    label: 'Store Locations',
    icon: MapPin,
    color: 'orange',
    description: 'Manage store locations and branches'
  },
  {
    id: 'shelves',
    label: 'Shelves',
    icon: Package,
    color: 'indigo',
    description: 'Manage storage shelves and capacity'
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    icon: Settings,
    color: 'gray',
    description: 'Configure inventory system preferences'
  }
];

const InventoryManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('brands');
  const [isLoading, setIsLoading] = useState(false);

  // Check user permissions and handle URL parameters
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Check if user has inventory management permissions
    if (!['admin', 'customer-care'].includes(currentUser.role)) {
      toast.error('You do not have permission to access inventory management');
      navigate('/dashboard');
      return;
    }

    // Handle URL parameter for tab selection
    const tabParam = searchParams.get('shelves');
    if (tabParam) {
      setActiveTab('shelves');
    }
  }, [currentUser, navigate, searchParams]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'brands':
        return <BrandsTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'suppliers':
        return <SuppliersTab />;
      case 'store-locations':
        return <StoreLocationsTab />;
      case 'shelves':
        return <ShelvesTab />;
      case 'system-settings':
        return <SystemSettingsTab />;
      default:
        return <BrandsTab />;
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <PageErrorBoundary pageName="Inventory Management" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Inventory Management"
          subtitle="Manage brands, categories, suppliers, and system settings"
          actions={
            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={() => navigate('/lats/unified-inventory')}
                variant="secondary"
                icon={<Package size={18} />}
              >
                Back to Inventory
              </GlassButton>
              <GlassButton
                onClick={() => navigate('/lats/add-product')}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Add Product
              </GlassButton>
            </div>
          }
        />

        {/* Tab Navigation */}
        <GlassCard className="p-2">
          <div className="flex flex-wrap gap-1">
            {TAB_CONFIGS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-${tab.color}-500 text-white shadow-lg`
                      : `text-gray-600 hover:text-${tab.color}-600 hover:bg-${tab.color}-50`
                  }`}
                  title={tab.description}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>
    </PageErrorBoundary>
  );
};

export default InventoryManagementPage;
