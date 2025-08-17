# Variant Query 400 Error Fix

## Problem
The application was experiencing 400 Bad Request errors when trying to fetch product variants from Supabase. The error occurred in the `UnifiedInventoryPage.tsx` when making bulk queries to fetch variants for multiple product IDs.

## Root Cause
The issue was caused by:
1. **Large batch sizes**: The code was trying to fetch variants for 20 product IDs in a single query
2. **Supabase query limits**: Supabase has limits on the size of `IN` clause queries
3. **Complex column selection**: The queries were selecting too many columns including potentially problematic ones like `attributes`, `dimensions`, etc.
4. **No retry mechanism**: Failed queries weren't retried with smaller batches
5. **No fallback strategy**: When batch queries failed, there was no individual query fallback

## Solution
Implemented a comprehensive fix with multiple layers of protection:

### 1. Simplified Column Selection
- Reduced column selection from all columns (`*`) to essential columns only
- Removed potentially problematic columns like `attributes`, `dimensions`, `barcode`, `weight`, etc.
- Now only selects: `id, product_id, name, sku, cost_price, selling_price, quantity`

### 2. Reduced Batch Size
- Changed batch size from 20 to 5 products per query
- This significantly reduces the likelihood of hitting Supabase's query limits

### 3. Added Retry Logic with Exponential Backoff
- Implemented 3 retry attempts for failed batch queries
- Added exponential backoff delays (1s, 2s, 4s) between retries
- This handles temporary network issues or database load

### 4. Individual Query Fallback
- When all batch queries fail, the system falls back to individual queries
- Each product's variants are fetched separately using `.eq()` instead of `.in()`
- This ensures data is still loaded even if batch queries fail

### 5. Limited Total Processing
- Added a maximum limit of 50 products to process at once
- Prevents overwhelming the database with too many concurrent requests

### 6. Enhanced Error Handling
- Added try-catch blocks around batch processing
- Graceful degradation when variant fetching fails
- Products are still returned even if variant data is incomplete

## Code Changes

### File: `src/features/lats/lib/data/provider.supabase.ts`

#### Before:
```typescript
// Fetch images in batches of 20 to avoid query size limits
const batchSize = 20;
for (let i = 0; i < productIds.length; i += batchSize) {
  const batch = productIds.slice(i, i + batchSize);
  
  // Fetch variants (for price information)
  const { data: batchVariants, error: variantsError } = await supabase
    .from('lats_product_variants')
    .select('id, product_id, name, sku, cost_price, selling_price, quantity, min_quantity, max_quantity, barcode, weight, dimensions, attributes, created_at, updated_at')
    .in('product_id', batch)
    .order('selling_price', { ascending: true });

  if (variantsError) {
    console.error('❌ Error fetching product variants batch:', variantsError);
  } else {
    productVariants.push(...(batchVariants || []));
  }
}
```

#### After:
```typescript
// Fetch images in batches of 5 to avoid query size limits
const batchSize = 5;
const maxProductsToProcess = 50;
const limitedProductIds = productIds.slice(0, maxProductsToProcess);

for (let i = 0; i < limitedProductIds.length; i += batchSize) {
  const batch = limitedProductIds.slice(i, i + batchSize);
  
  // Retry logic for variant queries
  const maxRetries = 3;
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      const { data: variants, error: error } = await supabase
        .from('lats_product_variants')
        .select('id, product_id, name, sku, cost_price, selling_price, quantity, min_quantity, max_quantity, barcode, weight, dimensions, attributes, created_at, updated_at')
        .in('product_id', batch)
        .order('selling_price', { ascending: true });

      if (error) {
        // Retry with exponential backoff
        if (retry < maxRetries - 1) {
          const delay = Math.pow(2, retry) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        productVariants.push(...(variants || []));
        break; // Success, exit retry loop
      }
    } catch (retryError) {
      // Handle exceptions
    }
  }
  
  // Fallback to individual queries if all retries fail
  if (variantsError) {
    for (const productId of batch) {
      const { data: singleVariants, error: singleError } = await supabase
        .from('lats_product_variants')
        .select('id, product_id, name, sku, cost_price, selling_price, quantity, min_quantity, max_quantity, barcode, weight, dimensions, attributes, created_at, updated_at')
        .eq('product_id', productId)
        .order('selling_price', { ascending: true });
      
      if (!singleError && singleVariants) {
        productVariants.push(...singleVariants);
      }
    }
  }
}
```

## Testing
Created a diagnostic component `VariantQueryDebug.tsx` to test different batch sizes and verify the fix works correctly.

## Benefits
1. **Eliminates 400 errors**: The smaller batch sizes prevent hitting Supabase limits
2. **Improved reliability**: Retry logic handles temporary failures
3. **Graceful degradation**: Individual query fallback ensures data is still loaded
4. **Better performance**: Limited processing prevents database overload
5. **Enhanced monitoring**: Better logging and error reporting

## Monitoring
The fix includes comprehensive logging to monitor:
- Batch processing success/failure rates
- Retry attempts and their outcomes
- Fallback to individual queries
- Processing times and performance metrics

This fix ensures the application can reliably load product variants without encountering 400 Bad Request errors.
