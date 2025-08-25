import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import {
  Plus,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  FileText,
  Crown,
  CreditCard,
  Search,
  Download,
  Upload,
  Settings,
  Activity,
  Smartphone,
  MessageSquare
} from 'lucide-react';

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  color: string;
  category: 'sales' | 'inventory' | 'customers' | 'analytics' | 'reports' | 'integration';
}

const QUICK_ACTIONS: QuickAction[] = [
  // Sales Actions
  {
    id: 'new-sale',
    name: 'New Sale',
    description: 'Start a new POS transaction',
    icon: ShoppingCart,
    path: '/pos',
    color: 'from-blue-500 to-blue-600',
    category: 'sales'
  },
  {
    id: 'unified-inventory',
    name: 'Unified Inventory',
    description: 'Complete inventory and catalog management',
    icon: Package,
    path: '/lats/unified-inventory',
    color: 'from-purple-500 to-purple-600',
    category: 'inventory'
  },
  {
    id: 'add-customer',
    name: 'Add Customer',
    description: 'Create new customer profile',
    icon: Users,
    path: '/lats/customers',
    color: 'from-indigo-500 to-indigo-600',
    category: 'customers'
  },
  {
    id: 'view-analytics',
    name: 'View Analytics',
    description: 'Business performance insights',
    icon: BarChart3,
    path: '/lats/analytics',
    color: 'from-orange-500 to-orange-600',
    category: 'analytics'
  },
  {
    id: 'sales-report',
    name: 'Sales Report',
    description: 'Generate sales reports',
    icon: FileText,
    path: '/lats/sales-reports',
    color: 'from-teal-500 to-teal-600',
    category: 'reports'
  },
  {
    id: 'loyalty-program',
    name: 'Loyalty Program',
    description: 'Manage customer loyalty',
    icon: Crown,
    path: '/lats/loyalty',
    color: 'from-yellow-500 to-yellow-600',
    category: 'customers'
  },
  {
    id: 'payment-tracking',
    name: 'Payment Tracking',
    description: 'Track payment status',
    icon: CreditCard,
    path: '/lats/payments',
    color: 'from-pink-500 to-pink-600',
    category: 'analytics'
  },
  {
    id: 'search-products',
    name: 'Search Products',
    description: 'Find products quickly',
    icon: Search,
    path: '/lats/unified-inventory',
    color: 'from-emerald-500 to-emerald-600',
    category: 'inventory'
  },
  {
    id: 'green-api-management',
    name: 'Green API',
    description: 'Manage WhatsApp integration',
    icon: MessageCircle,
    path: '/lats/whatsapp-hub',
    color: 'from-green-500 to-green-600',
    category: 'integration'
  },
  {
    id: 'whatsapp-hub',
    name: 'WhatsApp Manager',
    description: 'Comprehensive WhatsApp connection management',
    icon: MessageCircle,
    path: '/lats/whatsapp-hub',
    color: 'from-green-500 to-green-600',
    category: 'integration'
  },
  {
    id: 'export-data',
    name: 'Export Data',
    description: 'Export reports and data',
    icon: Download,
    path: '/lats/sales-reports',
    color: 'from-cyan-500 to-cyan-600',
    category: 'reports'
  },
  {
    id: 'import-data',
    name: 'Import Data',
    description: 'Import products and customers',
    icon: Upload,
    path: '/lats/customers',
    color: 'from-violet-500 to-violet-600',
    category: 'inventory'
  },
  {
    id: 'sales-analytics',
    name: 'Sales Analytics',
    description: 'Sales performance metrics',
    icon: TrendingUp,
    path: '/lats/sales-analytics',
    color: 'from-red-500 to-red-600',
    category: 'analytics'
  },
  {
    id: 'payment-settings',
    name: 'Payment Settings',
    description: 'Select provider and credentials',
    icon: Settings,
    path: '/lats/payment-settings',
    color: 'from-slate-500 to-slate-700',
    category: 'sales'
  },
  {
    id: 'payment-history',
    name: 'Payment History',
    description: 'View all payment transactions',
    icon: FileText,
    path: '/lats/payment-history',
    color: 'from-indigo-500 to-indigo-600',
    category: 'analytics'
  },
  {
    id: 'payment-analytics',
    name: 'Payment Analytics',
    description: 'Payment performance insights',
    icon: BarChart3,
    path: '/lats/payment-analytics',
    color: 'from-purple-500 to-purple-600',
    category: 'analytics'
  },
  {
    id: 'beem-test',
    name: 'Beem Test',
    description: 'Test Beem Africa payment integration',
    icon: CreditCard,
    path: '/lats/beem-test',
    color: 'from-blue-500 to-blue-600',
    category: 'sales'
  },

];

interface LATSQuickActionsProps {
  className?: string;
  variant?: 'grid' | 'list' | 'compact';
  category?: 'all' | 'sales' | 'inventory' | 'customers' | 'analytics' | 'reports' | 'integration';
  maxItems?: number;
}

const LATSQuickActions: React.FC<LATSQuickActionsProps> = ({
  className = '',
  variant = 'grid',
  category = 'all',
  maxItems
}) => {
  const navigate = useNavigate();

  const filteredActions = QUICK_ACTIONS.filter(action => 
    category === 'all' || action.category === category
  ).slice(0, maxItems);

  const renderGrid = () => (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {filteredActions.map((action) => {
        const Icon = action.icon;
        return (
          <GlassCard
            key={action.id}
            className="cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => navigate(action.path)}
          >
            <div className="p-4 text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.name}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );

  const renderList = () => (
    <div className={`space-y-2 ${className}`}>
      {filteredActions.map((action) => {
        const Icon = action.icon;
        return (
          <GlassButton
            key={action.id}
            onClick={() => navigate(action.path)}
            icon={<Icon size={18} />}
            className={`w-full justify-start text-left p-4 ${className}`}
            variant="secondary"
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-900">{action.name}</span>
              <span className="text-sm text-gray-600">{action.description}</span>
            </div>
          </GlassButton>
        );
      })}
    </div>
  );

  const renderCompact = () => (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filteredActions.map((action) => {
        const Icon = action.icon;
        return (
          <GlassButton
            key={action.id}
            onClick={() => navigate(action.path)}
            icon={<Icon size={16} />}
            className={`bg-gradient-to-r ${action.color} text-white hover:scale-105 transition-transform duration-200`}
            variant="primary"
          >
            {action.name}
          </GlassButton>
        );
      })}
    </div>
  );

  switch (variant) {
    case 'list':
      return renderList();
    case 'compact':
      return renderCompact();
    default:
      return renderGrid();
  }
};

export default LATSQuickActions;
