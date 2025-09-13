import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import SearchBar from '../../../features/shared/components/ui/SearchBar';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { PageErrorBoundary } from '../../../features/shared/components/PageErrorBoundary';
import { 
  Users, Building, Phone, Mail, MapPin, Plus, Edit, Trash2, 
  Search, Filter, RefreshCw, Eye, ArrowLeft, X, Save, RotateCcw,
  Tag, Smartphone, Laptop, Monitor, Headphones, Camera, Gamepad2, 
  Printer, Watch, Speaker, Keyboard, Mouse, Router, Server, 
  HardDrive, Package, MessageCircle, Star, UserPlus, Store, 
  Upload, Image as ImageIcon, Loader2, BarChart3, TrendingUp, 
  Activity, Zap, Globe, CreditCard, Wallet, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import supplier components
import SupplierListTab from '../components/SupplierListTab';
import SupplierAnalyticsTab from '../components/SupplierAnalyticsTab';
import SupplierPerformanceTab from '../components/SupplierPerformanceTab';

// Supplier tab types
type SupplierTab = 
  | 'list' 
  | 'analytics' 
  | 'performance';

interface TabConfig {
  id: SupplierTab;
  label: string;
  icon: React.ReactNode;
  description: string;
  adminOnly?: boolean;
  color: string;
}

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  description?: string;
  phone?: string;
  phone2?: string;
  whatsapp?: string;
  instagram?: string;
  wechat_id?: string;
  city?: string;
  country?: string;
  payment_account_type?: 'mobile_money' | 'bank_account' | 'other';
  mobile_money_account?: string;
  bank_account_number?: string;
  bank_name?: string;
  created_at: string;
  updated_at: string;
}

const UnifiedSupplierManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SupplierTab>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);

  // Define all supplier tabs
  const supplierTabs: TabConfig[] = [
    {
      id: 'list',
      label: 'Supplier Directory',
      icon: <Users size={20} />,
      description: 'Manage suppliers and vendor relationships',
      color: 'blue'
    },
    {
      id: 'analytics',
      label: 'Supplier Analytics',
      icon: <BarChart3 size={20} />,
      description: 'Analytics and insights for supplier performance',
      color: 'green'
    },
    {
      id: 'performance',
      label: 'Performance Monitor',
      icon: <TrendingUp size={20} />,
      description: 'Monitor supplier performance and metrics',
      adminOnly: true,
      color: 'purple'
    }
  ];

  // Filter tabs based on user role
  const availableTabs = supplierTabs.filter(tab => 
    !tab.adminOnly || currentUser?.role === 'admin'
  );

  // Get current tab config
  const currentTab = supplierTabs.find(tab => tab.id === activeTab);

  const countries = [
    { value: 'all', label: 'All Countries', icon: <MapPin size={16} /> },
    { value: 'CN', label: 'China', icon: <MapPin size={16} /> },
    { value: 'TZ', label: 'Tanzania', icon: <MapPin size={16} /> },
    { value: 'AE', label: 'Dubai (UAE)', icon: <MapPin size={16} /> },
    { value: 'US', label: 'United States', icon: <MapPin size={16} /> },
    { value: 'KE', label: 'Kenya', icon: <MapPin size={16} /> },
    { value: 'UG', label: 'Uganda', icon: <MapPin size={16} /> },
    { value: 'RW', label: 'Rwanda', icon: <MapPin size={16} /> },
    { value: 'BD', label: 'Bangladesh', icon: <MapPin size={16} /> },
    { value: 'IN', label: 'India', icon: <MapPin size={16} /> },
    { value: 'PK', label: 'Pakistan', icon: <MapPin size={16} /> },
    { value: 'other', label: 'Other', icon: <MapPin size={16} /> }
  ];

  // Load suppliers
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Filter suppliers
  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchQuery, selectedCountry]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'Tech Solutions Ltd',
          company_name: 'Tech Solutions Ltd',
          description: 'Leading technology supplier',
          phone: '+254700123456',
          whatsapp: '+254700123456',
          city: 'Nairobi',
          country: 'KE',
          payment_account_type: 'mobile_money',
          mobile_money_account: '+254700123456',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: '2',
          name: 'Global Electronics',
          company_name: 'Global Electronics Co',
          description: 'Electronics and components supplier',
          phone: '+86123456789',
          city: 'Shenzhen',
          country: 'CN',
          payment_account_type: 'bank_account',
          bank_account_number: '1234567890',
          bank_name: 'China Bank',
          created_at: '2024-01-02',
          updated_at: '2024-01-02'
        },
        {
          id: '3',
          name: 'Dubai Trading Co',
          company_name: 'Dubai Trading Company',
          description: 'Trading and import/export services',
          phone: '+971501234567',
          city: 'Dubai',
          country: 'AE',
          payment_account_type: 'bank_account',
          bank_account_number: '9876543210',
          bank_name: 'Emirates Bank',
          created_at: '2024-01-03',
          updated_at: '2024-01-03'
        }
      ];
      
      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSuppliers = useCallback(() => {
    let filtered = suppliers;
    
    if (searchQuery) {
      filtered = filtered.filter(supplier => 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone?.includes(searchQuery) ||
        supplier.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(supplier => supplier.country === selectedCountry);
    }
    
    setFilteredSuppliers(filtered);
  }, [suppliers, searchQuery, selectedCountry]);

  // Handle tab changes
  const handleTabChange = (tabId: SupplierTab) => {
    setActiveTab(tabId);
  };

  // Create new supplier
  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    setShowSupplierForm(true);
  };

  // Refresh data
  const handleRefresh = () => {
    setIsLoading(true);
    loadSuppliers();
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Supplier data refreshed');
    }, 1000);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <SupplierListTab 
            isActive={true}
            suppliers={filteredSuppliers}
            loading={isLoading}
            searchQuery={searchQuery}
            selectedCountry={selectedCountry}
            showSupplierForm={showSupplierForm}
            editingSupplier={editingSupplier}
            setShowSupplierForm={setShowSupplierForm}
            setEditingSupplier={setEditingSupplier}
          />
        );
      case 'analytics':
        return <SupplierAnalyticsTab isActive={true} suppliers={suppliers} />;
      case 'performance':
        return <SupplierPerformanceTab isActive={true} suppliers={suppliers} />;
      default:
        return (
          <SupplierListTab 
            isActive={true}
            suppliers={filteredSuppliers}
            loading={isLoading}
            searchQuery={searchQuery}
            selectedCountry={selectedCountry}
            showSupplierForm={showSupplierForm}
            editingSupplier={editingSupplier}
            setShowSupplierForm={setShowSupplierForm}
            setEditingSupplier={setEditingSupplier}
          />
        );
    }
  };

  const stats = {
    total: suppliers.length,
    mobileMoney: suppliers.filter(s => s.payment_account_type === 'mobile_money').length,
    bankAccount: suppliers.filter(s => s.payment_account_type === 'bank_account').length,
    countries: new Set(suppliers.map(s => s.country).filter(Boolean)).size
  };

  return (
    <PageErrorBoundary pageName="Unified Supplier Management" showDetails={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton to="/dashboard" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
              <p className="text-gray-600 mt-1">
                {currentTab?.description || 'Comprehensive supplier management system'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassSelect
              options={countries}
              value={selectedCountry}
              onChange={(value) => setSelectedCountry(value)}
              placeholder="Filter by Country"
              className="min-w-[150px]"
            />
            
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search suppliers..."
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
              onClick={handleCreateSupplier}
              icon={<Plus size={18} />}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              Add Supplier
            </GlassButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Supplier Navigation */}
          <div className="lg:col-span-1">
            <GlassCard className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Supplier Categories</h3>
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
                  <span className="text-gray-600">Total Suppliers:</span>
                  <span className="font-medium text-blue-600">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile Money:</span>
                  <span className="font-medium text-green-600">{stats.mobileMoney}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank Account:</span>
                  <span className="font-medium text-purple-600">{stats.bankAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Countries:</span>
                  <span className="font-medium text-orange-600">{stats.countries}</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Supplier Content */}
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
                  <span className="ml-3 text-gray-600">Loading suppliers...</span>
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

export default UnifiedSupplierManagementPage;
