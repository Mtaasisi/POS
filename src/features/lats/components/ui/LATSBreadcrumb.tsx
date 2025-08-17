import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import GlassButton from './GlassButton';

interface BreadcrumbItem {
  path: string;
  name: string;
  icon?: React.ComponentType<{ size?: number }>;
}

const LATS_BREADCRUMB_MAP: Record<string, BreadcrumbItem[]> = {
  '/pos': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/pos', name: 'POS System' }
  ],
  '/lats/quick-cash': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/quick-cash', name: 'Quick Cash' }
  ],
  '/lats/unified-inventory': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/unified-inventory', name: 'Unified Inventory Management' }
  ],

  '/lats/customers': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/customers', name: 'Customer Management' }
  ],
  '/lats/analytics': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/analytics', name: 'Business Analytics' }
  ],
  '/lats/sales-analytics': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/sales-analytics', name: 'Sales Analytics' }
  ],
  '/lats/sales-reports': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/sales-reports', name: 'Sales Reports' }
  ],
  '/lats/loyalty': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/loyalty', name: 'Customer Loyalty' }
  ],
  '/lats/payments': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/payments', name: 'Payment Tracking' }
  ],
  '/lats/add-product': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/unified-inventory', name: 'Unified Inventory Management' },
    { path: '/lats/add-product', name: 'Add Product' }
  ],
  '/lats/inventory/new': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/unified-inventory', name: 'Unified Inventory Management' },
    { path: '/lats/inventory/new', name: 'Add Product' }
  ],
  '/lats/inventory/products/new': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/unified-inventory', name: 'Unified Inventory Management' },
    { path: '/lats/inventory/products/new', name: 'Add Product' }
  ],

  '/lats/payment-settings': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/payment-settings', name: 'Payment Settings' }
  ],
  '/lats/payment-history': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/payment-history', name: 'Payment History' }
  ],
  '/lats/payment-analytics': [
    { path: '/dashboard', name: 'Dashboard', icon: Home },
    { path: '/lats/payment-analytics', name: 'Payment Analytics' }
  ]
};

const LATSBreadcrumb: React.FC<{ className?: string }> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Find the matching breadcrumb path
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const currentPath = location.pathname;
    
    // Try exact match first
    if (LATS_BREADCRUMB_MAP[currentPath]) {
      return LATS_BREADCRUMB_MAP[currentPath];
    }
    
    // Try partial matches for nested routes
    for (const [path, items] of Object.entries(LATS_BREADCRUMB_MAP)) {
      if (currentPath.startsWith(path + '/')) {
        return items;
      }
    }
    
    // Default breadcrumb for LATS pages
    if (currentPath.startsWith('/lats/')) {
      return [
        { path: '/dashboard', name: 'Dashboard', icon: Home },
        { path: '/lats', name: 'LATS System' }
      ];
    }
    
    // Default for other pages
    return [
      { path: '/dashboard', name: 'Dashboard', icon: Home }
    ];
  };

  const breadcrumbItems = getBreadcrumbItems();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {breadcrumbItems.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === breadcrumbItems.length - 1;
        
        return (
          <React.Fragment key={item.path}>
            <GlassButton
              onClick={() => navigate(item.path)}
              variant={isLast ? 'secondary' : 'ghost'}
              className={`${
                isLast 
                  ? 'text-gray-900 font-medium cursor-default' 
                  : 'text-gray-600 hover:text-gray-900'
              } px-2 py-1 text-sm`}
              disabled={isLast}
            >
              {Icon && <Icon size={14} className="mr-1" />}
              {item.name}
            </GlassButton>
            
            {!isLast && (
              <ChevronRight size={14} className="text-gray-400" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default LATSBreadcrumb;
