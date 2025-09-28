# Purchase Order Errors - Analysis and Fixes

## Issues Identified

Based on the error logs you provided, there were three main database-related issues:

### 1. 400 Bad Request - `lats_purchase_order_items` table
**Error**: `PATCH https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/lats_purchase_order_items?id=eq.b68496d4-575d-4a5f-be35-b9e911b05f03&purchase_order_id=eq.286e5379-4508-4645-be6e-64a275d028ee 400 (Bad Request)`

**Root Cause**: 
- Missing `updated_at` column in the `lats_purchase_order_items` table
- Missing Row Level Security (RLS) policies
- The service was trying to update a column that didn't exist

### 2. 404 Not Found - `purchase_order_audit` table
**Error**: `POST https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/purchase_order_audit 404 (Not Found)`

**Root Cause**: 
- The `purchase_order_audit` table didn't exist in the database
- The service was trying to insert audit records into a non-existent table

### 3. 404 Not Found - `purchase_orders` table
**Error**: `PATCH https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/purchase_orders?id=eq.286e5379-4508-4645-be6e-64a275d028ee 404 (Not Found)`

**Root Cause**: 
- The service was trying to access `purchase_orders` table, but the actual table name is `lats_purchase_orders`
- Table naming inconsistency in the service code

## Fixes Applied

### 1. Fixed Service Code
- **File**: `src/features/lats/services/purchaseOrderService.ts`
- **Change**: Updated `updateOrderStatus` method to use correct table name `lats_purchase_orders` instead of `purchase_orders`

### 2. Database Schema Fixes
Created SQL migration file: `purchase-order-fixes.sql` with the following fixes:

#### A. Added Missing Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

#### B. Fixed `lats_purchase_order_items` Table
- Added missing `updated_at` column
- Created trigger to automatically update the timestamp
- Added proper RLS policies for security

#### C. Created Missing `purchase_order_audit` Table
- Created the table with proper structure
- Added indexes for performance
- Implemented RLS policies for security

#### D. Enhanced Security
- Enabled RLS on all purchase order related tables
- Created comprehensive policies that ensure users can only access their own purchase orders

## How to Apply the Fixes

### Step 1: Apply Database Changes
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `purchase-order-fixes.sql`
4. Execute the SQL commands

### Step 2: Verify the Fixes
After applying the SQL, the following should work:
- Partial receive functionality should work without 400 errors
- Audit logging should work without 404 errors
- Order status updates should work without 404 errors

## Files Modified

1. **`src/features/lats/services/purchaseOrderService.ts`** - Fixed table name reference
2. **`purchase-order-fixes.sql`** - Database schema fixes
3. **`supabase/migrations/20250131000042_create_purchase_order_audit_table.sql`** - Audit table creation
4. **`supabase/migrations/20250131000043_create_purchase_order_quality_checks_table.sql`** - Quality checks table
5. **`supabase/migrations/20250131000044_fix_purchase_order_items_rls.sql`** - RLS policies for items table
6. **`supabase/migrations/20250131000045_create_update_updated_at_function.sql`** - Update function

## Testing

After applying the fixes, test the following functionality:
1. **Partial Receive**: Try to partially receive items in a purchase order
2. **Order Status Updates**: Change the status of a purchase order
3. **Audit Logging**: Check if audit entries are being created
4. **Quality Checks**: Test quality check functionality if used

## Expected Results

- ✅ No more 400 Bad Request errors when updating purchase order items
- ✅ No more 404 Not Found errors for audit table operations
- ✅ No more 404 Not Found errors for purchase order updates
- ✅ Proper audit logging for all purchase order operations
- ✅ Secure access control through RLS policies

## Notes

- All changes maintain backward compatibility
- RLS policies ensure data security
- The fixes follow the existing database naming conventions
- All foreign key relationships are preserved
