# Sales Orders 400 Error Fix Summary

## Problem
The application was getting a 400 Bad Request error when trying to fetch sales_orders data from Supabase. The error was occurring in the `customerApi.ts` file when trying to join with related tables.

## Root Cause
The query was trying to join with tables that either:
1. Didn't exist in the database
2. Had incorrect foreign key relationships
3. Referenced tables in the wrong schema

Specifically, the problematic joins were:
- `installment_payments(*)` - No relationship between sales_orders and installment_payments
- `created_by_user:auth_users(id, name, email)` - No foreign key relationship between sales_orders.created_by and auth.users

## Solution
Fixed the query in `src/lib/customerApi.ts` by:

1. **Removed problematic joins**: Removed `installment_payments(*)` and `created_by_user:auth_users(id, name, email)` from the select statement
2. **Simplified the query**: Kept only the essential joins that work:
   - `sales_order_items(*)` - This relationship exists
   - `product:products(name, brand, model, description, images)` - Products table exists
   - `variant:product_variants(variant_name, sku, attributes)` - Product variants table exists

## Files Modified
- `src/lib/customerApi.ts` - Fixed both instances of the problematic query (lines ~84-94 and ~445-455)

## Final Working Query
```typescript
const { data, error } = await supabase
  .from('sales_orders')
  .select(`
    *,
    sales_order_items(
      *,
      product:products(name, brand, model, description, images),
      variant:product_variants(variant_name, sku, attributes)
    )
  `)
  .order('created_at', { ascending: false });
```

## Verification
- ✅ sales_orders table is accessible
- ✅ products table is accessible  
- ✅ product_variants table is accessible
- ✅ Full query now works without errors

## Impact
- Fixed the 400 Bad Request errors in the console
- Sales orders data will now load properly in the application
- Customer data fetching will work without errors
- POS sales integration will function correctly

## Notes
- The `created_by` field in sales_orders still contains the user ID, but we're not joining with auth.users due to missing foreign key relationship
- If you need user information for sales orders, you may need to create a proper foreign key relationship or handle it differently
- The `installment_payments` table exists but has no relationship to sales_orders - this would need to be set up separately if needed 