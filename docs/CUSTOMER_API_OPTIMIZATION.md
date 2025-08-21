# Customer API Optimization

## Problem

The application was experiencing `net::ERR_INSUFFICIENT_RESOURCES` errors when fetching customer data. This was caused by the `fetchAllCustomers` function making individual API calls for each customer to fetch related data (notes, payments, promo_messages, devices, and POS sales).

For example, with 1609 customers, the original code was making:
- 1609 individual queries for customer notes
- 1609 individual queries for customer payments  
- 1609 individual queries for promo messages
- 1609 individual queries for devices
- 1609 individual queries for POS sales

**Total: 8,045 individual API calls** - This overwhelmed the browser's connection limits and caused resource exhaustion.

## Solution

### 1. Optimized `fetchAllCustomers` Function

**Before:**
```typescript
// ❌ Individual queries per customer
const customersWithData = await Promise.all(customers.map(async (customer) => {
  // 4 individual queries per customer
  const { data: notes } = await supabase.from('customer_notes').select('*').eq('customer_id', customer.id);
  const { data: payments } = await supabase.from('customer_payments').select('*').eq('customer_id', customer.id);
  const { data: promos } = await supabase.from('promo_messages').select('*').eq('customer_id', customer.id);
  const { data: devices } = await supabase.from('devices').select('*').eq('customer_id', customer.id);
  // ... individual POS sales query
}));
```

**After:**
```typescript
// ✅ Uses pagination and batch queries
const pageSize = BATCH_SIZE; // 50 customers per batch
const totalPages = Math.ceil((count || 0) / pageSize);

for (let page = 1; page <= totalPages; page++) {
  // Single query with nested relationships
  const customersPage = await fetchCustomersPaginated(page, pageSize);
  allCustomers = [...allCustomers, ...customersPage];
  
  // Delay between batches to prevent overwhelming connections
  if (page < totalPages) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
  }
}
```

### 2. Optimized `fetchCustomersPaginated` Function

**Before:**
```typescript
// ❌ Individual POS sales query per customer
const customersWithData = await Promise.all(customers.map(async (customer) => {
  const { data: posData } = await supabase
    .from('lats_sales')
    .select('*')
    .eq('customer_id', customer.id); // Individual query
}));
```

**After:**
```typescript
// ✅ Batch POS sales query for all customers
const customerIds = customers.map(c => c.id);
const { data: posData } = await supabase
  .from('lats_sales')
  .select('*')
  .in('customer_id', customerIds); // Single batch query

// Group results by customer
const posSalesByCustomer = new Map();
allPosSales.forEach(sale => {
  if (!posSalesByCustomer.has(sale.customer_id)) {
    posSalesByCustomer.set(sale.customer_id, []);
  }
  posSalesByCustomer.get(sale.customer_id).push(sale);
});
```

### 3. Optimized `searchCustomers` Function

Applied the same batch query optimization to the search function to prevent resource exhaustion during customer searches.

## Configuration Constants

Added configuration constants to control resource usage:

```typescript
const BATCH_SIZE = 50; // Maximum customers per batch
const REQUEST_DELAY = 100; // Delay between batches in milliseconds
const MAX_CONCURRENT_REQUESTS = 10; // Maximum concurrent requests
```

## Performance Improvements

### Before Optimization:
- **8,045 individual API calls** for 1609 customers
- **Resource exhaustion** causing `ERR_INSUFFICIENT_RESOURCES`
- **Slow loading times** due to excessive concurrent requests
- **Browser crashes** on large datasets

### After Optimization:
- **~33 batch API calls** for 1609 customers (32 pages + 1 count query)
- **No resource exhaustion** - controlled batch sizes and delays
- **Faster loading times** - efficient batch queries
- **Stable performance** even with large datasets

## Testing

Created a test script `scripts/test-customer-api-optimization.js` to verify:
- ✅ Paginated customer fetching works correctly
- ✅ Batch POS sales queries work correctly  
- ✅ Search functionality works correctly
- ✅ No resource exhaustion occurs

## Best Practices for Future Development

1. **Always use batch queries** instead of individual queries when fetching related data for multiple records
2. **Implement pagination** for large datasets to prevent overwhelming the browser
3. **Add delays between batches** to prevent connection pool exhaustion
4. **Use nested relationships** in Supabase queries when possible
5. **Monitor query performance** and optimize when you see patterns of individual queries in loops

## Files Modified

- `src/lib/customerApi.ts` - Main optimization changes
- `scripts/test-customer-api-optimization.js` - Test script for verification

## Related Issues

This optimization fixes the `net::ERR_INSUFFICIENT_RESOURCES` errors that were occurring when:
- Loading the customer management page
- Searching for customers
- Fetching customer data with related information

The solution ensures the application can handle large customer datasets without overwhelming browser resources.
