# LATS Data Fetching Setup

## Overview

The POS (Point of Sale) and Product Inventory systems now fetch data from the LATS (Laptop and Technology Services) database tables. This ensures that all product-related operations use real data from the centralized LATS database.

## Database Tables Used

The system fetches from the following LATS database tables:

| Table Name | Count | Purpose |
|------------|-------|---------|
| `lats_categories` | 12 | Product categories (Smartphones, Laptops, etc.) |
| `lats_brands` | 15 | Product brands (Apple, Samsung, Dell, etc.) |
| `lats_suppliers` | 24 | Product suppliers and vendors |
| `lats_products` | 27 | Main product catalog |
| `lats_product_variants` | 16 | Product variants (different SKUs, colors, sizes) |
| `lats_stock_movements` | 16 | Stock tracking and inventory movements |

## Data Flow

### 1. Provider Configuration
- **File**: `src/features/lats/lib/data/provider.ts`
- **Mode**: Defaults to `supabase` (real database)
- **Fallback**: Uses `demo` mode for testing

```typescript
export const getLatsProvider = (): LatsDataProvider => {
  const mode = import.meta.env.VITE_LATS_DATA_MODE || 'supabase';
  
  if (mode === 'supabase') {
    return supabaseProvider; // Real database
  } else {
    return demoProvider; // Demo data
  }
};
```

### 2. Supabase Provider
- **File**: `src/features/lats/lib/data/provider.supabase.ts`
- **Function**: Handles all database operations
- **Tables**: Connects to LATS tables with proper relationships

### 3. Inventory Store
- **File**: `src/features/lats/stores/useInventoryStore.ts`
- **State Management**: Zustand store for inventory data
- **Actions**: Load, create, update, delete operations

### 4. Product Catalog Page
- **File**: `src/features/lats/pages/ProductCatalogPage.tsx`
- **UI**: Displays products from LATS database
- **Features**: Search, filter, sort, bulk operations

## Key Features

### Real-time Data Fetching
- Products load from `lats_products` table
- Categories from `lats_categories` table
- Brands from `lats_brands` table
- Suppliers from `lats_suppliers` table
- Variants from `lats_product_variants` table

### Relationship Handling
- Products linked to categories, brands, and suppliers
- Product variants linked to main products
- Stock movements tracked per variant

### Stock Management
- Real-time stock levels from `lats_product_variants`
- Stock movements tracked in `lats_stock_movements`
- Automatic stock updates on sales/purchases

## Database Schema

### Products Table
```sql
CREATE TABLE lats_products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES lats_categories(id),
    brand_id UUID REFERENCES lats_brands(id),
    supplier_id UUID REFERENCES lats_suppliers(id),
    images TEXT[],
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    total_quantity INTEGER DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Product Variants Table
```sql
CREATE TABLE lats_product_variants (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES lats_products(id),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    attributes JSONB,
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    barcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuration

### Environment Variables
Set the following in your `.env` file:

```bash
# LATS Database Mode
VITE_LATS_DATA_MODE=supabase

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Data Mode Options
- `supabase`: Use real LATS database (default)
- `demo`: Use demo data for testing

## Verification

### Run Verification Script
```bash
node scripts/verify-lats-data-fetching.js
```

This script will:
- Test connection to all LATS tables
- Verify data relationships
- Show sample records
- Provide summary statistics

### Manual Verification
1. Open Product Catalog page
2. Check database status indicator
3. Verify products load from database
4. Test search and filter functionality
5. Confirm stock levels are accurate

## Troubleshooting

### Common Issues

1. **No Data Loading**
   - Check Supabase connection
   - Verify environment variables
   - Ensure tables exist in database

2. **Type Errors**
   - Check TypeScript configuration
   - Verify import statements
   - Ensure type definitions match

3. **Relationship Errors**
   - Verify foreign key constraints
   - Check table relationships
   - Ensure data consistency

### Debug Steps

1. **Check Console Logs**
   ```javascript
   console.log('🔧 LATS Data Provider Mode:', mode);
   console.log('📊 Data mode:', import.meta.env.VITE_LATS_DATA_MODE);
   ```

2. **Verify Database Connection**
   ```javascript
   // Test in browser console
   const provider = getLatsProvider();
   const result = await provider.getProducts();
   console.log('Products:', result);
   ```

3. **Check Network Requests**
   - Open browser dev tools
   - Monitor network tab
   - Verify Supabase API calls

## Benefits

### Centralized Data Management
- Single source of truth for all product data
- Consistent data across all modules
- Real-time updates and synchronization

### Improved Performance
- Optimized database queries
- Proper indexing on key fields
- Efficient relationship handling

### Better User Experience
- Real-time stock levels
- Accurate product information
- Consistent pricing and availability

## Future Enhancements

### Planned Features
- Real-time stock notifications
- Advanced inventory analytics
- Automated reorder points
- Multi-location inventory support

### Performance Optimizations
- Query caching
- Pagination improvements
- Background data sync
- Offline support

## Support

For issues or questions:
1. Check this documentation
2. Run verification scripts
3. Review console logs
4. Check database connectivity
5. Verify environment configuration

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
