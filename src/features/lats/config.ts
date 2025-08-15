// LATS Module Configuration
export const LATS_CONFIG = {
  // Feature flag - set to true to enable the module
  enabled: import.meta.env.VITE_LATS_ENABLED === 'true',
  
  // Data mode - 'demo' or 'supabase'
  dataMode: import.meta.env.VITE_LATS_DATA_MODE || 'supabase',
  
  // Base route path
  basePath: '/lats',
  
  // Module metadata
  name: 'LATS Inventory & POS',
  version: '1.0.0',
  description: 'Inventory management and point-of-sale system'
} as const;

// Navigation item for the host app
export const latsNavItem = {
  href: '/pos',
  label: 'LATS Inventory+POS',
  icon: 'Package'
};

// Route definitions - only keeping routes that actually exist in the router
export const LATS_ROUTES = {
  pos: '/pos',
  dashboard: '/lats',
  salesAnalytics: '/lats/sales-analytics',
  inventory: '/lats/inventory',
  inventoryNew: '/lats/inventory/new',
  products: '/lats/products',
  productDetail: (id: string) => `/lats/products/${id}`,
  productEdit: (id: string) => `/lats/products/${id}/edit`,
  salesReports: '/lats/sales-reports',
  loyalty: '/lats/loyalty',
  payments: '/lats/payments',
  analytics: '/lats/analytics',
  purchaseOrders: '/lats/purchase-orders',
  purchaseOrderNew: '/lats/purchase-orders/new',
  purchaseOrderDetail: (id: string) => `/lats/purchase-orders/${id}`,
  spareParts: '/lats/spare-parts',
  quickCash: '/lats/quick-cash',
  variantSelection: '/lats/variant-selection'
} as const;

// Check if module is enabled
export const isLatsEnabled = () => LATS_CONFIG.enabled;

// Get data provider mode
export const getDataMode = () => LATS_CONFIG.dataMode;
