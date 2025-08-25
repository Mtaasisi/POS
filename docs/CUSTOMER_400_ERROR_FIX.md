# Customer API 400 Error Fix

## Problem

The application was experiencing 400 Bad Request errors when fetching customer data from Supabase. These errors were occurring in multiple functions:

- `fetchCustomersPaginated`
- `fetchCustomerById`
- `searchCustomers`
- `loadCustomerDetails`

## Root Cause

The 400 errors were caused by **complex nested select queries** that were trying to fetch related data from multiple tables in a single query. The problematic queries looked like this:

```typescript
// ❌ This was causing 400 errors
const { data: customers, error } = await supabase
  .from('customers')
  .select(`
    id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at,
    customer_notes(*),
    customer_payments(
      *,
      devices(brand, model)
    ),
    promo_messages(*),
    devices(*)
  `)
  .range(offset, offset + pageSize - 1)
  .order('created_at', { ascending: false });
```

## Solution

### 1. Simplified Main Queries

Replaced complex nested queries with simple queries that only fetch basic customer data:

```typescript
// ✅ This works without 400 errors
const { data: customers, error } = await supabase
  .from('customers')
  .select(`
    id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
  `)
  .range(offset, offset + pageSize - 1)
  .order('created_at', { ascending: false });
```

### 2. Separate Related Data Fetching

Fetch related data in separate queries after getting the basic customer data:

```typescript
// ✅ Fetch related data separately
const customersWithData = await Promise.all((customers || []).map(async (customer: any) => {
  try {
    // Fetch customer notes
    const { data: notes } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customer.id);
    
    // Fetch customer payments
    const { data: payments } = await supabase
      .from('customer_payments')
      .select('*')
      .eq('customer_id', customer.id);
    
    // Fetch promo messages
    const { data: promos } = await supabase
      .from('promo_messages')
      .select('*')
      .eq('customer_id', customer.id);
    
    // Fetch devices
    const { data: devices } = await supabase
      .from('devices')
      .select('*')
      .eq('customer_id', customer.id);
    
    // Transform and return combined data
    return {
      ...customer,
      notes: transformedNotes,
      payments: transformedPayments,
      promoHistory: transformedPromoHistory,
      devices: transformedDevices
    };
  } catch (error) {
    console.error(`❌ Error processing customer ${customer.id}:`, error);
    // Return basic customer data if related data fetch fails
    return customer;
  }
}));
```

### 3. Added Error Handling

Added proper error handling for individual customer processing to ensure the application doesn't crash if one customer's related data fails to load:

```typescript
try {
  // Fetch related data
  // Transform data
  return transformedCustomer;
} catch (error) {
  console.error(`❌ Error processing customer ${customer.id}:`, error);
  // Return basic customer data if related data fetch fails
  return {
    ...customer,
    notes: [],
    payments: [],
    promoHistory: [],
    devices: []
  };
}
```

## Files Modified

1. **`src/lib/customerApi.ts`**
   - `fetchCustomersPaginated()` - Simplified main query, added separate data fetching
   - `fetchCustomerById()` - Simplified main query, added separate data fetching
   - `searchCustomers()` - Simplified main query, added separate data fetching
   - `loadCustomerDetails()` - Simplified main query, added separate data fetching

2. **`src/components/CustomerQueryTest.tsx`**
   - Updated test component to use simplified queries
   - Added comprehensive testing for all query types

## Benefits

1. **Eliminates 400 Bad Request errors** - No more complex nested queries
2. **Better error handling** - Individual customer failures don't break the entire request
3. **Improved performance** - Simpler queries are faster and more reliable
4. **Better debugging** - Easier to identify which specific query is failing
5. **More maintainable** - Clearer separation of concerns

## Testing

Use the `CustomerQueryTest` component to verify that all queries are working:

1. Simple customer queries
2. Full customer queries with all fields
3. Pagination queries
4. Search queries
5. Individual related data queries (notes, payments, promos, devices)

## Migration Notes

- The fix maintains backward compatibility
- All existing functionality is preserved
- Related data is still available, just fetched differently
- Performance may be slightly different but should be more reliable

## Future Considerations

1. **Caching** - Consider implementing caching for related data to improve performance
2. **Batch Queries** - Could implement batch queries for related data to reduce the number of API calls
3. **Lazy Loading** - Consider implementing lazy loading for related data that's not immediately needed
