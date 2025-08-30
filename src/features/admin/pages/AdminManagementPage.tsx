import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useNavigationHistory } from '../../../hooks/useNavigationHistory';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import { 
  Building, Settings, Database, HardDrive, Shield, FileText,
  Users, CreditCard, BarChart2, Package, Calendar, Smartphone,
  MessageCircle, MessageSquare, Stethoscope, Plus, Edit, Trash2,
  Eye, Download, Upload, RefreshCw, CheckCircle, AlertTriangle, MapPin, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  category: 'inventory' | 'system' | 'security' | 'data' | 'communication';
}

const AdminManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { handleBackClick } = useNavigationHistory();
  const [activeTab, setActiveTab] = useState<'inventory' | 'system' | 'security' | 'data' | 'communication'>('inventory');

  const adminSections: AdminSection[] = [
    // Inventory Management
    {
      id: 'unified-inventory',
      title: 'Unified Inventory Management',
      description: 'Complete inventory and catalog management',
      icon: <Package size={24} />,
      path: '/lats/unified-inventory',
      color: 'from-indigo-500 to-indigo-600',
      category: 'inventory'
    },
    {
      id: 'category-management',
      title: 'Category Management',
      description: 'Organize products into categories',
      icon: <Package size={24} />,
      path: '/category-management',
      color: 'from-green-500 to-green-600',
      category: 'inventory'
    },
    {
      id: 'supplier-management',
      title: 'Supplier Management',
      description: 'Manage suppliers and vendor relationships',
      icon: <Users size={24} />,
      path: '/supplier-management',
      color: 'from-teal-500 to-teal-600',
      category: 'inventory'
    },
    {
      id: 'store-locations',
      title: 'Store Locations',
      description: 'Manage store locations and branches',
      icon: <MapPin size={24} />,
      path: '/store-locations',
      color: 'from-amber-500 to-amber-600',
      category: 'inventory'
    },
    {
      id: 'storage-room-management',
      title: 'Storage Room Management',
      description: 'Manage storage rooms and capacity',
      icon: <Building size={24} />,
      path: '/lats/inventory-management?storage-room',
      color: 'from-purple-500 to-purple-600',
      category: 'inventory'
    },

    {
      id: 'purchase-orders',
      title: 'Purchase Orders',
      description: 'Manage supplier orders and procurement',
      icon: <FileText size={24} />,
      path: '/lats/purchase-orders',
      color: 'from-purple-500 to-purple-600',
      category: 'inventory'
    },
    {
      id: 'spare-parts',
      title: 'Spare Parts',
      description: 'Manage spare parts inventory',
      icon: <Package size={24} />,
      path: '/lats/spare-parts',
      color: 'from-orange-500 to-orange-600',
      category: 'inventory'
    },

    // System Management
    {
      id: 'database-setup',
      title: 'Database Setup',
      description: 'Configure and manage database settings',
      icon: <Database size={24} />,
      path: '/database-setup',
      color: 'from-indigo-500 to-indigo-600',
      category: 'system'
    },
    {
      id: 'backup-management',
      title: 'Backup Management',
      description: 'Manage system backups and recovery',
      icon: <HardDrive size={24} />,
      path: '/backup-management',
      color: 'from-teal-500 to-teal-600',
      category: 'system'
    },
    {
      id: 'admin-settings',
      title: 'Admin Settings',
      description: 'System-wide administrative settings',
      icon: <Settings size={24} />,
      path: '/admin-settings',
      color: 'from-gray-500 to-gray-600',
      category: 'system'
    },
    {
      id: 'mobile-optimization',
      title: 'Mobile Optimization',
      description: 'PWA features and mobile settings',
      icon: <Smartphone size={24} />,
      path: '/mobile',
      color: 'from-pink-500 to-pink-600',
      category: 'system'
    },

    // Communication & Integration
    {
      id: 'green-api-management',
      title: 'Green API Management',
      description: 'Manage WhatsApp integration and messaging',
      icon: <MessageCircle size={24} />,
      path: '/lats/whatsapp-hub',
      color: 'from-green-500 to-green-600',
      category: 'communication'
    },
    {
      id: 'whatsapp-hub',
      title: 'WhatsApp Hub',
      description: 'Centralized WhatsApp messaging and management',
      icon: <MessageCircle size={24} />,
      path: '/lats/whatsapp-hub',
      color: 'from-green-500 to-green-600',
      category: 'communication'
    },

    // Security & Monitoring
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      description: 'View system activity and security logs',
      icon: <Shield size={24} />,
      path: '/audit-logs',
      color: 'from-red-500 to-red-600',
      category: 'security'
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage system users and permissions',
      icon: <Users size={24} />,
      path: '/users',
      color: 'from-yellow-500 to-yellow-600',
      category: 'security'
    },
    {
      id: 'diagnostic-templates',
      title: 'Diagnostic Templates',
      description: 'Manage diagnostic checklists and templates',
      icon: <Stethoscope size={24} />,
      path: '/diagnostics/templates',
      color: 'from-cyan-500 to-cyan-600',
      category: 'security'
    },

    // Data Management
    {
      id: 'excel-templates',
      title: 'Excel Templates',
      description: 'Download Excel templates for data import',
      icon: <Download size={24} />,
      path: '/excel-templates',
      color: 'from-blue-500 to-blue-600',
      category: 'data'
    },
    {
      id: 'excel-import',
      title: 'Excel Import',
      description: 'Import data from Excel files',
      icon: <Upload size={24} />,
      path: '/excel-import',
      color: 'from-emerald-500 to-emerald-600',
      category: 'data'
    },
    {
      id: 'customer-import',
      title: 'Customer Import',
      description: 'Import customer data and records',
      icon: <Users size={24} />,
      path: '/customers/import',
      color: 'from-violet-500 to-violet-600',
      category: 'data'
    },
    {
      id: 'customer-data-update',
      title: 'Customer Data Update',
      description: 'Bulk update customer information',
      icon: <Edit size={24} />,
      path: '/customers/update-data',
      color: 'from-amber-500 to-amber-600',
      category: 'data'
    },

    // Communication
    
    {
      id: 'sms-centre',
      title: 'SMS Centre',
      description: 'Manage SMS communications',
      icon: <MessageSquare size={24} />,
      path: '/sms',
      color: 'from-blue-400 to-blue-500',
      category: 'communication'
    }
  ];

  const getTabIcon = (category: string) => {
    switch (category) {
      case 'inventory':
        return <Package size={20} />;
      case 'system':
        return <Settings size={20} />;
      case 'security':
        return <Shield size={20} />;
      case 'data':
        return <Database size={20} />;
      case 'communication':
        return <MessageCircle size={20} />;
      default:
        return <Settings size={20} />;
    }
  };

  const getTabLabel = (category: string) => {
    switch (category) {
      case 'inventory':
        return 'Inventory';
      case 'system':
        return 'System';
      case 'security':
        return 'Security';
      case 'data':
        return 'Data';
      case 'communication':
        return 'Communication';
      default:
        return 'General';
    }
  };

  const filteredSections = adminSections.filter(section => section.category === activeTab);

  const getTabSummary = (category: string) => {
    switch (category) {
      case 'inventory':
        return {
          title: 'Inventory Management Tools',
          description: 'Comprehensive tools for managing product inventory, categories, and procurement.',
                      features: ['Category Management', 'Purchase Order Processing', 'Spare Parts Inventory', 'Supplier Management'],
          icon: <Package size={24} />
        };
      case 'system':
        return {
          title: 'System Administration',
          description: 'Core system configuration, database management, and technical settings.',
          features: ['Database Configuration', 'Backup & Recovery', 'System Settings', 'Mobile Optimization'],
          icon: <Settings size={24} />
        };
      case 'security':
        return {
          title: 'Security & Monitoring',
          description: 'User management, security logs, and system monitoring tools.',
          features: ['Audit Logs', 'User Permissions', 'Diagnostic Templates', 'Security Monitoring'],
          icon: <Shield size={24} />
        };
      case 'data':
        return {
          title: 'Data Management',
          description: 'Import, export, and bulk data management operations.',
          features: ['Excel Data Import', 'Customer Data Import', 'Bulk Data Updates', 'Data Validation'],
          icon: <Database size={24} />
        };
      case 'communication':
        return {
          title: 'Communication Tools',
          description: 'SMS and communication management systems.',
          features: ['SMS Centre', 'Communication Templates'],
          icon: <MessageCircle size={24} />
        };
      default:
        return {
          title: 'Admin Tools',
          description: 'Administrative tools and settings.',
          features: [],
          icon: <Settings size={24} />
        };
    }
  };

  const currentSummary = getTabSummary(activeTab);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <BackButton to="/dashboard" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-gray-600 mt-1">Comprehensive administrative tools and settings</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={handleBackClick}
            variant="secondary"
            icon={<RefreshCw size={18} />}
          >
            Back
          </GlassButton>
        </div>
      </div>

      {/* Page Overview */}
      <GlassCard className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Management Overview</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Comprehensive administrative control center with 17 tools organized across 5 categories. 
            Manage inventory, system settings, security, data operations, and communications from one central location.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Package size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Inventory</h3>
            <p className="text-sm text-gray-600">4 tools</p>
            <p className="text-xs text-gray-500 mt-1">Categories, Orders, Parts</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-green-100 text-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Settings size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">System</h3>
            <p className="text-sm text-gray-600">4 tools</p>
            <p className="text-xs text-gray-500 mt-1">Database, Backup, Settings, Mobile</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Shield size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Security</h3>
            <p className="text-sm text-gray-600">3 tools</p>
            <p className="text-xs text-gray-500 mt-1">Audit, Users, Templates</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Database size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Data</h3>
            <p className="text-sm text-gray-600">3 tools</p>
            <p className="text-xs text-gray-500 mt-1">Import, Export, Updates</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <MessageCircle size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Communication</h3>
            <p className="text-sm text-gray-600">2 tools</p>
                            <p className="text-xs text-gray-500 mt-1">SMS</p>
          </div>
        </div>
      </GlassCard>

      {/* Navigation Tabs */}
      <GlassCard className="p-6">
        <div className="relative mb-8">
          {/* Tab Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl" />
          
          {/* Tab Container */}
          <div className="relative flex flex-wrap gap-1 p-2">
            {(['inventory', 'system', 'security', 'data', 'communication'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                  ${activeTab === tab
                    ? 'bg-white text-blue-700 shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 hover:shadow-md'
                  }
                `}
              >
                {/* Active Indicator */}
                {activeTab === tab && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl" />
                )}
                
                <div className="relative flex items-center gap-2">
                  <div className={`
                    p-1.5 rounded-lg transition-all duration-300
                    ${activeTab === tab
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {getTabIcon(tab)}
                  </div>
                  <span className="relative z-10">{getTabLabel(tab)}</span>
                </div>
                
                {/* Active Badge */}
                {activeTab === tab && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Summary */}
        <div className="mb-8">
          <GlassCard className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white shadow-lg">
                {currentSummary.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{currentSummary.title}</h3>
                <p className="text-gray-600 mb-4">{currentSummary.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentSummary.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map(section => (
            <div
              key={section.id}
              className="group cursor-pointer"
              onClick={() => navigate(section.path)}
            >
              <GlassCard className="p-6 h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color} text-white shadow-lg`}>
                    {section.icon}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={16} className="text-gray-400" />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {section.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  {section.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 capitalize">
                    {section.category}
                  </span>
                  <GlassButton
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Access
                  </GlassButton>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tools available</h3>
            <p className="text-gray-500">Select a different category to view available tools.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AdminManagementPage;
