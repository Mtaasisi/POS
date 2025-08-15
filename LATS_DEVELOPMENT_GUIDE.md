# LATS Module - Development Guide

## Quick Start

### Environment Setup
```bash
# Set data mode (demo or supabase)
export VITE_LATS_DATA_MODE=supabase
export VITE_LATS_ENABLED=true

# Start development server
npm run dev
```

### Key Routes
- **POS System**: `/pos`
- **Dashboard**: `/lats`
- **Inventory**: `/lats/inventory`
- **Products**: `/lats/products`
- **Sales Analytics**: `/lats/sales-analytics`

## Architecture Overview

### Data Flow
```
Component → Store → Provider → Database
    ↑         ↓        ↓
Event Bus ← Updates ← Response
```

### Stores
- **usePOSStore**: Cart, payments, sales
- **useInventoryStore**: Products, categories, stock

### Providers
- **Demo**: In-memory data for testing
- **Supabase**: Real database integration

## Adding New Features

### 1. New Page
```typescript
// 1. Create page component
// src/features/lats/pages/NewFeaturePage.tsx

// 2. Add route in App.tsx
<Route path="/lats/new-feature" element={<NewFeaturePage />} />

// 3. Add to navigation in AppLayout.tsx
{
  path: '/lats/new-feature',
  label: 'New Feature',
  icon: <Icon size={20} />,
  roles: ['admin', 'customer-care']
}
```

### 2. New Store Method
```typescript
// In useInventoryStore.ts or usePOSStore.ts
newMethod: async (data) => {
  try {
    const provider = getLatsProvider();
    const response = await provider.newMethod(data);
    
    if (response.ok) {
      // Update store state
      set({ newData: response.data });
      // Track analytics
      latsAnalytics.track('new_method_called', { data });
    }
    
    return response;
  } catch (error) {
    set({ error: 'Failed to call new method' });
    return { ok: false, message: 'Failed to call new method' };
  }
}
```

### 3. New Provider Method
```typescript
// 1. Add to interface in provider.ts
newMethod(data: any): Promise<ApiResponse<any>>;

// 2. Implement in provider.demo.ts
async newMethod(data: any): Promise<ApiResponse<any>> {
  // Demo implementation
  return { ok: true, data: [] };
}

// 3. Implement in provider.supabase.ts
async newMethod(data: any): Promise<ApiResponse<any>> {
  try {
    const { data: result, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('field', data.value);
    
    if (error) throw error;
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, message: 'Failed to fetch data' };
  }
}
```

## Common Patterns

### Error Handling
```typescript
// Always wrap provider calls in try-catch
try {
  const response = await provider.method(data);
  if (response.ok) {
    // Success
  } else {
    set({ error: response.message });
  }
} catch (error) {
  set({ error: 'Operation failed' });
}
```

### Loading States
```typescript
// Set loading state before operation
set({ isLoading: true, error: null });

try {
  // Operation
} catch (error) {
  // Error handling
} finally {
  set({ isLoading: false });
}
```

### Event Bus Integration
```typescript
// Emit events after successful operations
latsEventBus.emit('lats:entity.created', newEntity);

// Subscribe to events for real-time updates
latsEventBus.subscribeToAll((event) => {
  switch (event.type) {
    case 'lats:entity.created':
      // Refresh data
      break;
  }
});
```

## Database Schema

### Key Tables
- `lats_products` - Product catalog
- `lats_product_variants` - Product variants with stock
- `lats_categories` - Product categories
- `lats_brands` - Product brands
- `lats_suppliers` - Product suppliers
- `lats_sales` - Sales records
- `lats_sale_items` - Individual sale items
- `lats_cart` - Shopping cart
- `lats_cart_items` - Cart items
- `lats_spare_parts` - Spare parts inventory
- `lats_purchase_orders` - Purchase orders

### Relationships
- Products → Categories, Brands, Suppliers
- Products → Variants (1:many)
- Sales → Sale Items (1:many)
- Cart → Cart Items (1:many)

## Testing

### Demo Mode
```bash
# Use demo data for testing
export VITE_LATS_DATA_MODE=demo
```

### Supabase Mode
```bash
# Use real database
export VITE_LATS_DATA_MODE=supabase
```

### Provider Testing
```typescript
// Test provider methods directly
const provider = getLatsProvider();
const response = await provider.getProducts();
console.log('Products:', response.data);
```

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript types match between stores and providers
   - Ensure all interface methods are implemented in both providers

2. **Runtime Errors**
   - Verify provider selection (demo vs supabase)
   - Check database connections for supabase mode
   - Ensure event bus subscriptions are working

3. **Data Sync Issues**
   - Check event bus emissions after operations
   - Verify store state updates after provider calls
   - Ensure proper error handling

### Debug Mode
```typescript
// Enable debug logging
console.log('🔧 LATS Debug:', { data, operation });
```

## Performance Tips

1. **Lazy Loading**: Use dynamic imports for large components
2. **Pagination**: Implement pagination for large datasets
3. **Caching**: Cache frequently accessed data in stores
4. **Optimistic Updates**: Update UI immediately, sync with server later

## Security

### Role-Based Access
```typescript
// Check user roles before operations
if (!allowedRoles.includes(currentUser.role)) {
  return <Navigate to="/dashboard" replace />;
}
```

### Data Validation
```typescript
// Validate data before sending to provider
if (!data.requiredField) {
  return { ok: false, message: 'Required field missing' };
}
```

## Deployment

### Environment Variables
```bash
# Production
VITE_LATS_DATA_MODE=supabase
VITE_LATS_ENABLED=true
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Build
```bash
npm run build
```

## Support

For issues or questions:
1. Check the LATS_FIXES_COMPLETE_SUMMARY.md for known issues
2. Review the data flow architecture
3. Test with demo mode first
4. Check console logs for error details
