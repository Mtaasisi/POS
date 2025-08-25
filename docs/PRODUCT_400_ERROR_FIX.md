# Product API 400 Error Fix

## Problem

The application was experiencing 400 Bad Request errors when fetching product data from the `lats_products` table. These errors were occurring in the `provider.supabase.ts` file in two different queries:

1. **Complex join query** with related tables
2. **Simple fallback query** without joins

## Root Cause

The 400 errors were caused by **incorrect column references** in the SQL queries. Specifically:

- The queries were trying to select `store_shelf` column
- The actual column name in the database is `store_shelf_id`

This mismatch caused PostgreSQL to return a 42703 error (undefined column).

## Solution

### 1. Fixed Column References

Updated both queries in `src/features/lats/lib/data/provider.supabase.ts`:

**Before:**
```typescript
.select(`
  id,
  name,
  description,
  category_id,
  brand_id,
  supplier_id,
  images,
  is_active,
  total_quantity,
  total_value,
  condition,
  store_shelf,  // ❌ Wrong column name
  attributes,
  created_at,
  updated_at,
  // ... other fields
`)
```

**After:**
```typescript
.select(`
  id,
  name,
  description,
  category_id,
  brand_id,
  supplier_id,
  images,
  is_active,
  total_quantity,
  total_value,
  condition,
  store_shelf_id,  // ✅ Correct column name
  attributes,
  created_at,
  updated_at,
  // ... other fields
`)
```

### 2. Database Schema Verification

Verified that the following columns exist in the `lats_products` table:
- ✅ `id`
- ✅ `name`
- ✅ `description`
- ✅ `category_id`
- ✅ `brand_id`
- ✅ `supplier_id`
- ✅ `images`
- ✅ `is_active`
- ✅ `total_quantity`
- ✅ `total_value`
- ✅ `condition`
- ✅ `store_shelf_id` (not `store_shelf`)
- ✅ `attributes`
- ✅ `created_at`
- ✅ `updated_at`
- ✅ `tags`
- ✅ `internal_notes`

### 3. Related Tables

The queries also successfully join with:
- ✅ `lats_categories`
- ✅ `lats_brands`
- ✅ `lats_suppliers`
- ✅ `lats_product_variants`

## Testing

Created and ran a test script to verify the fix:
- ✅ First query (complex join) now works
- ✅ Second query (simple fallback) now works
- ✅ Both queries return data without 400 errors

## Impact

This fix resolves the 400 errors that were preventing:
- Product listing from loading
- Product search functionality
- Product management features

## Prevention

To prevent similar issues in the future:
1. Always verify column names in the database schema before writing queries
2. Use database introspection tools to check actual column names
3. Test queries with simple SELECT statements before adding complex joins
4. Keep database migrations and application code in sync
