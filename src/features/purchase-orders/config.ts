// Purchase Orders Module Configuration
export const PURCHASE_ORDERS_CONFIG = {
  MODULE_NAME: 'purchase-orders',
  BASE_ROUTE: '/purchase-orders',
  
  // Routes configuration
  ROUTES: {
    LIST: '/purchase-orders',
    CREATE: '/purchase-orders/create',
    DETAIL: '/purchase-orders/:id',
    EDIT: '/purchase-orders/:id/edit',
    SHIPPED_ITEMS: '/purchase-orders/shipped-items',
    SHIPPED_ITEMS_BY_PO: '/purchase-orders/:id/shipped-items',
    SUPPLIERS: '/purchase-orders/suppliers'
  },

  // Module permissions
  PERMISSIONS: {
    VIEW_PURCHASE_ORDERS: 'view_purchase_orders',
    CREATE_PURCHASE_ORDERS: 'create_purchase_orders',
    EDIT_PURCHASE_ORDERS: 'edit_purchase_orders',
    DELETE_PURCHASE_ORDERS: 'delete_purchase_orders',
    MANAGE_SUPPLIERS: 'manage_suppliers',
    MANAGE_SHIPMENTS: 'manage_shipments'
  },

  // Default settings
  DEFAULT_SETTINGS: {
    CURRENCY: 'TZS',
    PAYMENT_TERMS: 'net_30',
    TAX_RATE: 0.18,
    ITEMS_PER_PAGE: 10,
    SEARCH_DEBOUNCE_MS: 300
  },

  // Database tables
  TABLES: {
    PURCHASE_ORDERS: 'lats_purchase_orders',
    PURCHASE_ORDER_ITEMS: 'lats_purchase_order_items',
    SUPPLIERS: 'lats_suppliers',
    SHIPPED_ITEMS: 'lats_shipped_items' // This table may need to be created
  }
};

export default PURCHASE_ORDERS_CONFIG;