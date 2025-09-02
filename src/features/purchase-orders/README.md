# Purchase Orders Module

A dedicated module for managing purchase orders, suppliers, and shipments with a POS-like UI experience.

## Structure

```
src/features/purchase-orders/
├── pages/                          # Main application pages
│   ├── PurchaseOrdersListPage.tsx  # List all purchase orders
│   ├── CreatePurchaseOrderPage.tsx # Create new purchase orders (POS-like UI)
│   ├── PurchaseOrderDetailPage.tsx # View individual purchase order details
│   ├── ShippedItemsPage.tsx        # Track and manage shipments
│   └── SuppliersManagementPage.tsx # Manage suppliers
├── components/                     # Reusable components
│   ├── AddSupplierModal.tsx        # Modal for adding new suppliers
│   ├── CurrencySelector.tsx        # Currency selection component
│   ├── POTopBar.tsx               # Top bar for purchase order pages
│   ├── ProductDetailModal.tsx     # Product detail modal
│   ├── PurchaseCartItem.tsx       # Cart item component
│   ├── PurchaseOrderDraftModal.tsx # Draft management modal
│   └── SupplierSelectionModal.tsx # Supplier selection modal
├── stores/                        # State management
│   └── usePurchaseOrderStore.ts   # Dedicated PO store
├── types/                         # TypeScript interfaces
│   └── index.ts                   # All PO-related types
├── lib/                           # Utilities and helpers
│   └── utils.ts                   # PO utility functions
├── config.ts                      # Module configuration
└── index.ts                       # Module exports
```

## Features

### 📋 Purchase Orders Management
- **Create Orders**: POS-like interface for creating purchase orders
- **List View**: Grid and list views with advanced filtering
- **Detail View**: Comprehensive order details and management
- **Status Tracking**: Track orders from draft to received

### 🚚 Shipments Management
- **Track Shipments**: Monitor all shipped items
- **Receive Items**: Mark items as received with quantity tracking
- **Damage Reports**: Report and track damaged shipments
- **Real-time Status**: Live tracking of shipment progress

### 👥 Suppliers Management
- **Supplier Database**: Comprehensive supplier information
- **Contact Management**: Phone, email, and address tracking
- **Payment Terms**: Configurable payment terms per supplier
- **Multi-currency**: Support for international suppliers

### 💰 Financial Features
- **Multi-currency Support**: TZS, USD, EUR, GBP, and more
- **Tax Calculations**: Automatic tax calculations
- **Payment Terms**: Flexible payment term options
- **Cost Tracking**: Track item costs and totals

## Routes

- `/purchase-orders` - Main purchase orders list
- `/purchase-orders/create` - Create new purchase order
- `/purchase-orders/:id` - View purchase order details
- `/purchase-orders/:id/edit` - Edit purchase order
- `/purchase-orders/shipped-items` - Manage all shipments
- `/purchase-orders/:id/shipped-items` - Shipments for specific order
- `/purchase-orders/suppliers` - Manage suppliers

## Database Integration

The module integrates with existing database through:
- **Inventory Store**: Uses `useInventoryStore` for products, categories, suppliers
- **Purchase Order Store**: Dedicated `usePurchaseOrderStore` for PO-specific operations
- **Real-time Updates**: Automatic synchronization with database changes

## UI Patterns

Following the established POS page UI patterns:
- **Glass Card Components**: Consistent glassmorphism design
- **Two-column Layout**: Product search + cart/management panel
- **Color-coded Actions**: Orange for PO actions, matching POS blue theme
- **Responsive Design**: Mobile-first responsive layout
- **Keyboard Shortcuts**: Ctrl+F for search focus

## Key Components

### PurchaseOrdersListPage
Main dashboard for viewing all purchase orders with filtering, sorting, and bulk actions.

### CreatePurchaseOrderPage
POS-like interface for creating purchase orders:
- Product search and selection
- Shopping cart functionality
- Supplier selection
- Currency and payment terms
- Real-time total calculations

### ShippedItemsPage
Comprehensive shipment tracking:
- Track all shipped items across orders
- Mark items as received
- Report damage or issues
- Real-time status updates

### SuppliersManagementPage
Supplier database management:
- Add/edit/delete suppliers
- Contact information management
- Payment terms configuration
- Multi-currency support

## Integration

The module is fully integrated with:
- **Authentication**: Role-based access control
- **Database**: Supabase integration via inventory store
- **Toast Notifications**: Success/error feedback
- **Routing**: React Router with protected routes
- **State Management**: Zustand stores with persistence

## Usage

```typescript
import { 
  PurchaseOrdersListPage,
  CreatePurchaseOrderPage,
  usePurchaseOrderStore,
  formatMoney,
  SUPPORTED_CURRENCIES
} from '../features/purchase-orders';

// Use in components
const { cartItems, addToCart, createPurchaseOrder } = usePurchaseOrderStore();
```