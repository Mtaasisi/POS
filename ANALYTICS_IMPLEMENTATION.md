# Analytics Implementation Guide

## Overview

This document describes the implementation of real-time analytics for the LATS system, specifically focusing on the analytics cards that display **Total Variants**, **Total Stock**, and **Total Value**.

## 🎯 Key Features

### Analytics Cards
- **Total Variants**: Shows the count of all product variants in the system
- **Total Stock**: Displays the sum of all stock quantities across all variants
- **Total Value**: Shows the total inventory value based on cost prices

### Additional Metrics
- **Total Products**: Count of all products
- **Active Products**: Count of active products
- **Low Stock Items**: Products with stock ≤ 10 units
- **Out of Stock Items**: Products with zero stock

## 📁 File Structure

```
src/features/lats/
├── lib/
│   └── analyticsService.ts          # Core analytics service
├── hooks/
│   └── useAnalytics.ts              # React hooks for analytics
├── components/inventory/
│   └── AnalyticsCards.tsx           # Analytics cards component
└── pages/
    ├── InventoryPage.tsx            # Updated inventory page
    └── AnalyticsDemoPage.tsx        # Demo page for analytics
```

## 🔧 Implementation Details

### 1. Analytics Service (`analyticsService.ts`)

The core service that fetches data from the database and calculates metrics:

```typescript
export class AnalyticsService {
  static async getInventoryAnalytics(): Promise<InventoryAnalytics>
  static async getSalesAnalytics(): Promise<SalesAnalytics>
  static async getCustomerAnalytics(): Promise<CustomerAnalytics>
  static async getAllAnalytics()
}
```

**Key Features:**
- Real-time data fetching from Supabase
- Comprehensive error handling
- Optimized database queries
- Calculates metrics on the fly

### 2. React Hooks (`useAnalytics.ts`)

Custom hooks for managing analytics state:

```typescript
export const useAnalytics = () => {
  // Returns: { data, loading, error, refresh, refreshInventory, refreshSales, refreshCustomers }
}

export const useInventoryAnalytics = () => {
  // Returns: { data, loading, error, refresh }
}
```

**Features:**
- Automatic data fetching on mount
- Loading and error states
- Manual refresh capabilities
- Individual refresh functions for specific analytics

### 3. Analytics Cards Component (`AnalyticsCards.tsx`)

React component that displays the analytics cards:

```typescript
const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ 
  className = '',
  showRefreshButton = true 
}) => {
  // Displays Total Variants, Total Stock, Total Value cards
  // Plus additional metrics cards
}
```

**Features:**
- Real-time data display
- Loading skeletons
- Error handling with retry
- Refresh buttons
- Responsive design
- Beautiful UI with gradients

## 🚀 Usage

### Basic Usage

```tsx
import AnalyticsCards from '../components/inventory/AnalyticsCards';

function MyPage() {
  return (
    <div>
      <h1>Inventory Dashboard</h1>
      <AnalyticsCards />
    </div>
  );
}
```

### Advanced Usage with Custom Hooks

```tsx
import { useInventoryAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { data, loading, error, refresh } = useInventoryAnalytics();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Total Variants: {data?.totalVariants}</h2>
      <h2>Total Stock: {data?.totalStock}</h2>
      <h2>Total Value: ${data?.totalValue}</h2>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Using the Analytics Service Directly

```typescript
import { AnalyticsService } from '../lib/analyticsService';

async function fetchAnalytics() {
  try {
    const analytics = await AnalyticsService.getInventoryAnalytics();
    console.log('Total Variants:', analytics.totalVariants);
    console.log('Total Stock:', analytics.totalStock);
    console.log('Total Value:', analytics.totalValue);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
  }
}
```

## 📊 Database Queries

The analytics service performs the following database operations:

### 1. Total Variants Count
```sql
SELECT COUNT(*) FROM lats_product_variants;
```

### 2. Products with Variants
```sql
SELECT 
  id, name, is_active, total_quantity, total_value,
  variants:lats_product_variants(id, quantity, cost_price, selling_price)
FROM lats_products;
```

### 3. Categories, Brands, Suppliers Count
```sql
SELECT COUNT(*) FROM lats_categories;
SELECT COUNT(*) FROM lats_brands;
SELECT COUNT(*) FROM lats_suppliers;
```

### 4. Sales Data
```sql
SELECT id, total_amount, created_at 
FROM lats_pos_transactions 
ORDER BY created_at DESC;
```

### 5. Customer Data
```sql
SELECT id, created_at, total_spent, last_purchase_date 
FROM lats_customers;
```

## 🎨 UI Components

### Analytics Cards Layout

The analytics cards are displayed in a responsive grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  {/* Total Variants Card */}
  <GlassCard className="bg-blue-50 rounded-lg p-4 border border-blue-200">
    {/* Card content */}
  </GlassCard>

  {/* Total Stock Card */}
  <GlassCard className="bg-green-50 rounded-lg p-4 border border-green-200">
    {/* Card content */}
  </GlassCard>

  {/* Total Value Card */}
  <GlassCard className="bg-purple-50 rounded-lg p-4 border border-purple-200">
    {/* Card content */}
  </GlassCard>
</div>
```

### Additional Metrics Cards

```tsx
<div className="col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
  {/* Total Products, Active Products, Low Stock, Out of Stock */}
</div>
```

## 🔄 Real-time Updates

The analytics system supports real-time updates through:

1. **Manual Refresh**: Click refresh buttons on cards
2. **Automatic Refresh**: Data is fetched on component mount
3. **Individual Refresh**: Refresh specific analytics types
4. **Error Recovery**: Automatic retry on failures

## 🧪 Testing

### Test Script

Run the test script to verify the analytics service:

```bash
node scripts/test-analytics.js
```

The test script will:
- Test all database queries
- Verify data calculations
- Check error handling
- Display sample data

### Manual Testing

1. Navigate to the inventory page
2. Verify analytics cards display correctly
3. Test refresh functionality
4. Check error states
5. Verify responsive design

## 🐛 Troubleshooting

### Common Issues

1. **No Data Displayed**
   - Check database connection
   - Verify table permissions
   - Check console for errors

2. **Slow Loading**
   - Optimize database queries
   - Add indexes to frequently queried columns
   - Implement caching

3. **Incorrect Calculations**
   - Verify data types in database
   - Check calculation logic
   - Validate input data

### Debug Mode

Enable debug logging by setting:

```typescript
console.log('Analytics Debug:', { data, loading, error });
```

## 🔮 Future Enhancements

### Planned Features

1. **Real-time WebSocket Updates**
   - Live data streaming
   - Instant updates on data changes

2. **Advanced Analytics**
   - Trend analysis
   - Predictive analytics
   - Custom date ranges

3. **Export Functionality**
   - PDF reports
   - Excel exports
   - Scheduled reports

4. **Performance Optimization**
   - Data caching
   - Query optimization
   - Background processing

## 📝 API Reference

### AnalyticsService Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getInventoryAnalytics()` | Fetch inventory metrics | `Promise<InventoryAnalytics>` |
| `getSalesAnalytics()` | Fetch sales metrics | `Promise<SalesAnalytics>` |
| `getCustomerAnalytics()` | Fetch customer metrics | `Promise<CustomerAnalytics>` |
| `getAllAnalytics()` | Fetch all analytics | `Promise<AllAnalytics>` |

### Hook Return Values

| Hook | Returns |
|------|---------|
| `useAnalytics()` | `{ data, loading, error, refresh, refreshInventory, refreshSales, refreshCustomers }` |
| `useInventoryAnalytics()` | `{ data, loading, error, refresh }` |
| `useSalesAnalytics()` | `{ data, loading, error, refresh }` |
| `useCustomerAnalytics()` | `{ data, loading, error, refresh }` |

## 🎉 Conclusion

The analytics implementation provides a robust, real-time system for displaying key business metrics. The modular design allows for easy extension and customization while maintaining high performance and reliability.

For questions or issues, refer to the troubleshooting section or contact the development team.
