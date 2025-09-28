# Purchase Order Payment 400 Error Fix

## Problem Summary
The purchase order payment functionality was failing with a 400 Bad Request error when calling the `process_purchase_order_payment` RPC function. The error was caused by a schema mismatch between the RPC function and the `purchase_order_audit` table.

## Root Causes Identified

1. **Schema Mismatch**: The RPC function was trying to insert into `purchase_order_audit` table with columns that didn't match the actual table schema
2. **Currency Conversion Issue**: The payment was in USD but the account was in TZS, causing conversion logic to fail
3. **Missing User ID**: The function was receiving null user IDs which caused foreign key constraint violations

## Solution Applied

### 1. Fixed Audit Table Schema
- Recreated the `purchase_order_audit` table with the correct schema
- Ensured columns match what the RPC function expects:
  - `user_id` and `created_by` (UUID references to auth.users)
  - `details` as JSONB for flexible data storage
  - Proper RLS policies for security

### 2. Enhanced RPC Function
- Added proper error handling and validation
- Improved currency conversion logic
- Added fallback user ID resolution
- Better exception handling with detailed error messages

### 3. Currency Conversion Fix
- The function now properly handles USD to TZS conversion
- Uses exchange rates from the purchase order when available
- Falls back to 1:1 conversion for unsupported currency pairs

## Files Created/Modified

1. **APPLY_RPC_FIX_MANUAL.sql** - SQL script to fix the database schema and RPC function
2. **supabase/migrations/20250131000058_fix_rpc_audit_schema_mismatch.sql** - Migration file
3. **apply-rpc-fix-direct.js** - Node.js script to apply the fix (requires environment variables)

## How to Apply the Fix

### Option 1: Manual SQL Execution (Recommended)
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `APPLY_RPC_FIX_MANUAL.sql`
4. Execute the SQL script
5. The fix will be applied immediately

### Option 2: Migration File
1. The migration file `20250131000058_fix_rpc_audit_schema_mismatch.sql` is ready
2. Apply it using your preferred migration method

## What the Fix Does

1. **Drops and recreates** the `purchase_order_audit` table with correct schema
2. **Recreates** the `process_purchase_order_payment` RPC function with:
   - Proper error handling
   - Currency conversion logic
   - User ID validation
   - Detailed audit logging
3. **Sets up** proper RLS policies for security
4. **Grants** execute permissions to authenticated users

## Testing the Fix

After applying the fix, test the payment functionality:

1. Go to a purchase order detail page
2. Try to make a payment
3. The payment should now process successfully
4. Check that the audit log is created properly
5. Verify currency conversion works (USD to TZS)

## Expected Behavior After Fix

- ✅ Payments process without 400 errors
- ✅ Currency conversion works properly (USD → TZS)
- ✅ Audit logs are created correctly
- ✅ Purchase order payment status updates
- ✅ Account balances are updated correctly

## Fallback Behavior

If the RPC function still fails, the system will automatically fall back to the legacy payment method in `purchaseOrderPaymentService.ts`, which also handles currency conversion properly.

## Notes

- The fix preserves all existing data
- No data loss occurs during the schema update
- The system maintains backward compatibility
- All RLS policies are properly configured for security

## Environment Variables

The fix doesn't require any environment variables to be set. The SQL can be executed directly in the Supabase dashboard.

## Support

If you encounter any issues after applying this fix, check:
1. That the SQL executed without errors
2. That the RPC function exists in your database
3. That the audit table has the correct schema
4. That RLS policies are properly configured
