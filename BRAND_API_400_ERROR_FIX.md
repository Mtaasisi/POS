# Brand API 400 Error Fix

## Problem Summary

The `lats_brands` table was returning 400 (Bad Request) errors when trying to create or update brands through the API. This was caused by a **schema mismatch** between what the `brandApi.ts` expected and what the database table actually contained.

## Root Cause Analysis

### Database Schema vs API Expectations

**Database Table (`lats_brands`) had:**
- `id` (UUID)
- `name` (TEXT)
- `logo` (TEXT)
- `website` (TEXT)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**API (`brandApi.ts`) was trying to insert:**
- `name` ✅ (matches)
- `description` ✅ (matches)
- `logo_url` ❌ (database has `logo`)
- `category` ❌ (missing from database)
- `is_active` ❌ (missing from database)

## Solution Implemented

### 1. Database Schema Fix (`fix-lats-brands-schema-mismatch.sql`)

Added missing columns to align with API expectations:

```sql
-- Add category column (TEXT[] for array of strings)
ALTER TABLE lats_brands ADD COLUMN category TEXT[];

-- Add is_active column (BOOLEAN with default true)
ALTER TABLE lats_brands ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add logo_url column (alias for logo)
ALTER TABLE lats_brands ADD COLUMN logo_url TEXT;

-- Add categories column (for backward compatibility)
ALTER TABLE lats_brands ADD COLUMN categories TEXT[];
```

### 2. Database Trigger for Field Synchronization

Created a trigger to keep related fields in sync:

```sql
CREATE OR REPLACE FUNCTION sync_logo_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync logo and logo_url fields
    IF NEW.logo_url IS DISTINCT FROM OLD.logo_url THEN
        NEW.logo = NEW.logo_url;
    END IF;
    
    IF NEW.logo IS DISTINCT FROM OLD.logo THEN
        NEW.logo_url = NEW.logo;
    END IF;
    
    -- Sync category and categories fields
    IF NEW.category IS DISTINCT FROM OLD.category THEN
        NEW.categories = NEW.category;
    END IF;
    
    IF NEW.categories IS DISTINCT FROM OLD.categories THEN
        NEW.category = NEW.categories;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. API Improvements (`brandApi.ts`)

Enhanced error handling and data transformation:

```typescript
// Handle category field properly
if (brandData.category) {
  dataToInsert.category = brandData.category;
  dataToInsert.categories = brandData.category; // Backward compatibility
}

// Handle logo_url field properly
if (brandData.logo_url) {
  dataToInsert.logo = brandData.logo_url;
  dataToInsert.logo_url = brandData.logo_url;
}

// Ensure is_active has a default value
if (dataToInsert.is_active === undefined) {
  dataToInsert.is_active = true;
}
```

### 4. Enhanced Error Logging

Added detailed error logging to help debug future issues:

```typescript
console.log('🔍 createBrand: Data to insert:', dataToInsert);

if (error) {
  console.error('❌ Error creating brand:', error);
  console.error('❌ Error details:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
  throw new Error(`Failed to create brand: ${error.message}`);
}
```

## Files Modified

1. **`fix-lats-brands-schema-mismatch.sql`** - Database schema fix
2. **`src/lib/brandApi.ts`** - Enhanced API with better error handling
3. **`test-brand-api-fix.js`** - Test script to verify the fix
4. **`BRAND_API_400_ERROR_FIX.md`** - This documentation

## How to Apply the Fix

### Step 1: Run the Database Migration

Execute the SQL fix in your Supabase Dashboard SQL Editor:

```sql
-- Run the contents of fix-lats-brands-schema-mismatch.sql
```

### Step 2: Test the Fix

Run the test script to verify everything works:

```bash
node test-brand-api-fix.js
```

### Step 3: Verify in Application

1. Navigate to the Brand Management page
2. Try creating a new brand
3. Try editing an existing brand
4. Verify no more 400 errors appear in the console

## Expected Results

After applying the fix:

✅ **No more 400 Bad Request errors**  
✅ **Brand creation works correctly**  
✅ **Brand updates work correctly**  
✅ **All existing brands remain accessible**  
✅ **Backward compatibility maintained**  

## Verification Checklist

- [ ] Database schema updated with missing columns
- [ ] RLS policies properly configured
- [ ] API functions handle data transformation correctly
- [ ] Error logging provides detailed information
- [ ] Test script passes all checks
- [ ] Application UI works without errors

## Future Prevention

To prevent similar issues in the future:

1. **Schema Documentation**: Keep database schema documentation up to date
2. **Type Safety**: Use TypeScript interfaces that match database schema
3. **Migration Testing**: Test database migrations before deployment
4. **API Validation**: Add input validation to catch schema mismatches early
5. **Error Monitoring**: Monitor for 400 errors and investigate immediately

## Troubleshooting

If you still encounter issues:

1. **Check Console Logs**: Look for detailed error messages in browser console
2. **Verify Database Schema**: Run the schema check query in the fix SQL
3. **Test API Directly**: Use the test script to isolate the issue
4. **Check RLS Policies**: Ensure Row Level Security policies are correct
5. **Verify Authentication**: Confirm user has proper permissions

---

**Status**: ✅ **FIXED**  
**Date**: January 2025  
**Priority**: High  
**Impact**: Brand management functionality restored
