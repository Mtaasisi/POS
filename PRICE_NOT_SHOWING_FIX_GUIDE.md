# Product Price Not Showing - Fix Guide

## Problem Description
After saving a product, the price is not showing up in the product list or details view.

## Root Cause
The issue was caused by a mismatch in field naming between the form data and the database:

1. **Form data** uses `variant.price`
2. **Data transformer** was mapping `variant.price` to `variant.price`
3. **Supabase provider** was saving `variant.price` as `selling_price`
4. **But the provider was expecting `variant.sellingPrice`**

This caused the price to be saved as 0 or null in the database.

## What Was Fixed

### 1. Fixed Data Transformer
**File**: `src/features/lats/lib/dataTransformer.ts`

**Before**:
```typescript
variants: data.variants.map(variant => ({
  // ...
  price: variant.price, // ❌ Wrong field name
  // ...
}))
```

**After**:
```typescript
variants: data.variants.map(variant => ({
  // ...
  sellingPrice: variant.price, // ✅ Correct field name
  // ...
}))
```

### 2. Fixed Supabase Provider
**File**: `src/features/lats/lib/data/provider.supabase.ts`

**Before**:
```typescript
const variantData = {
  // ...
  selling_price: Number(variant.price) || 0, // ❌ Wrong field name
  // ...
};
```

**After**:
```typescript
const variantData = {
  // ...
  selling_price: Number(variant.sellingPrice) || 0, // ✅ Correct field name
  // ...
};
```

### 3. Fixed Update Product Method
**File**: `src/features/lats/lib/data/provider.supabase.ts`

Updated both the update and insert operations in `updateProduct` method to use `variant.sellingPrice` instead of `variant.price`.

## Data Flow After Fix

### 1. Form Submission
```typescript
// Form data
{
  variants: [{
    price: 999.99, // User enters price
    costPrice: 800,
    // ...
  }]
}
```

### 2. Data Transformation
```typescript
// Data transformer
{
  variants: [{
    sellingPrice: 999.99, // Maps price to sellingPrice
    costPrice: 800,
    // ...
  }]
}
```

### 3. Database Save
```typescript
// Supabase provider
{
  selling_price: 999.99, // Saves to database
  cost_price: 800,
  // ...
}
```

### 4. Database Retrieve
```typescript
// Supabase provider
{
  sellingPrice: 999.99, // Maps back to sellingPrice
  costPrice: 800,
  // ...
}
```

### 5. Display
```typescript
// UI components
formatMoney(variant.sellingPrice) // Shows: $999.99
```

## Testing the Fix

### Run Price Test
```bash
node scripts/test-price-save-retrieve.js
```

### Expected Results
- ✅ New products should save prices correctly
- ✅ Existing products with zero prices need to be updated
- ✅ Price should display in product lists and details

### Test Product Creation
1. Create a new product with a price
2. Save the product
3. Check that the price appears in the product list
4. Edit the product and verify the price is still there

## Files Modified

1. **`src/features/lats/lib/dataTransformer.ts`**
   - Fixed `transformProductFormDataToApi` method
   - Maps `variant.price` to `variant.sellingPrice`

2. **`src/features/lats/lib/data/provider.supabase.ts`**
   - Fixed `createProduct` method
   - Fixed `updateProduct` method
   - Uses `variant.sellingPrice` consistently

3. **`scripts/test-price-save-retrieve.js`** (New)
   - Test script to verify price save/retrieve functionality

## Database Schema

The database uses these field names:
- `lats_product_variants.selling_price` - The selling price
- `lats_product_variants.cost_price` - The cost price

## Field Mapping

| Form Field | Database Field | API Field |
|------------|----------------|-----------|
| `variant.price` | `selling_price` | `variant.sellingPrice` |
| `variant.costPrice` | `cost_price` | `variant.costPrice` |
| `variant.stockQuantity` | `quantity` | `variant.quantity` |

## Common Issues

### Issue 1: Price Shows as 0
**Cause**: Field mapping mismatch
**Solution**: Use `variant.sellingPrice` instead of `variant.price`

### Issue 2: Price Not Saving
**Cause**: Invalid UUID or validation error
**Solution**: Check UUID validation and form validation

### Issue 3: Price Shows in Edit but Not List
**Cause**: Different components using different field names
**Solution**: Ensure all components use `variant.sellingPrice`

## Verification Steps

1. **Create a test product** with a price
2. **Save the product**
3. **Check the product list** - price should be visible
4. **Edit the product** - price should be in the form
5. **Update the product** - price should persist
6. **Check database** - price should be in `selling_price` field

## Expected Results

After the fix:
- ✅ New products save prices correctly
- ✅ Prices display in product lists
- ✅ Prices persist when editing products
- ✅ No more zero prices for new products
- ✅ Consistent field naming throughout the application

## Troubleshooting

### Still Not Working?
1. **Clear browser cache** and try again
2. **Check browser console** for errors
3. **Run the test script** to verify database state
4. **Check form validation** - ensure price is not being rejected
5. **Verify UUID validation** - ensure category/brand/supplier IDs are valid

### Database Issues?
1. **Check existing products** with zero prices
2. **Update them manually** if needed
3. **Verify database schema** is correct
4. **Check RLS policies** allow price updates
