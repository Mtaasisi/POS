# Price Not Showing - Quick Fix

## Problem
After saving a product, the price is not showing up in the product list.

## Root Cause
Field naming mismatch:
- Form uses `variant.price`
- Database expects `variant.sellingPrice`
- Price was being saved as 0

## Quick Fix Applied

### ✅ Fixed Data Transformer
**File**: `src/features/lats/lib/dataTransformer.ts`
- Maps `variant.price` → `variant.sellingPrice`

### ✅ Fixed Supabase Provider  
**File**: `src/features/lats/lib/data/provider.supabase.ts`
- Uses `variant.sellingPrice` consistently in create/update methods

## Test the Fix
```bash
# Test price save/retrieve
node scripts/test-price-save-retrieve.js

# Create a new product with price
# Check if price shows in product list
```

## Expected Results
- ✅ New products save prices correctly
- ✅ Prices display in product lists
- ✅ Prices persist when editing
- ✅ No more zero prices for new products

## Field Mapping
| Form | Database | API |
|------|----------|-----|
| `variant.price` | `selling_price` | `variant.sellingPrice` |

## Verification
1. Create product with price
2. Save product  
3. Check price appears in list
4. Edit product - price should be there
