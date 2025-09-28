# Payment Migration Instructions

## 🔧 **Migration Fixed - Ready to Apply**

The PostgreSQL error `42P13: input parameters after one with a default value must also have defaults` has been **FIXED**.

### ✅ **What Was Fixed:**

The function parameter order was incorrect. In PostgreSQL, when you have parameters with default values, ALL parameters after them must also have default values.

**Before (❌ Incorrect):**
```sql
CREATE OR REPLACE FUNCTION process_purchase_order_payment(
    purchase_order_id_param UUID,
    payment_account_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_method_id_param UUID,
    reference_param VARCHAR(255) DEFAULT NULL,  -- Has default
    notes_param TEXT DEFAULT NULL,              -- Has default
    user_id_param UUID                          -- No default (ERROR!)
)
```

**After (✅ Correct):**
```sql
CREATE OR REPLACE FUNCTION process_purchase_order_payment(
    purchase_order_id_param UUID,
    payment_account_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_method_id_param UUID,
    user_id_param UUID,                         -- No default (moved up)
    reference_param VARCHAR(255) DEFAULT NULL,  -- Has default
    notes_param TEXT DEFAULT NULL               -- Has default
)
```

### 📋 **Migration File Updated:**

- **File**: `supabase/migrations/20250131000053_fix_payment_functionality_clean.sql` (NEW CLEAN VERSION)
- **Status**: ✅ Fixed and ready to apply
- **Service Layer**: ✅ Updated to match new parameter order
- **Note**: Use the clean version to avoid syntax errors

## 🚀 **How to Apply the Migration:**

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250131000053_fix_payment_functionality_clean.sql`
4. Paste and execute the SQL

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual Application
1. Open the migration file: `supabase/migrations/20250131000053_fix_payment_functionality_clean.sql`
2. Copy the SQL content
3. Execute it in your database

## 🧪 **After Migration - Test the Fix:**

Run the test script to verify everything works:
```bash
node test-payment-functionality.js
```

## 📊 **What the Migration Creates:**

### 1. **Payment Methods Table**
- Creates `payment_methods` table
- Inserts 3 default payment methods:
  - Cash Payment (linked to Cash account)
  - Bank Transfer (linked to CRDB account)
  - Card Payment (linked to Card account)

### 2. **Enhanced Purchase Orders**
- Adds `total_paid` and `payment_status` columns
- Updates existing orders to have proper payment status

### 3. **Database Functions**
- `process_purchase_order_payment()` - Atomic payment processing
- `get_purchase_order_payment_summary()` - Payment status summary
- `get_purchase_order_payment_history()` - Payment history

### 4. **Fixed Foreign Keys**
- Fixes foreign key references in `purchase_order_payments` table

## ✅ **Expected Results After Migration:**

1. **Payment Methods Available**: 3 payment methods ready to use
2. **Payment Processing**: Full payment workflow functional
3. **Payment Tracking**: Complete payment status and history
4. **Account Integration**: Automatic balance updates
5. **Error Handling**: Comprehensive validation and error messages

## 🔍 **Verification Steps:**

After applying the migration, verify:

1. **Payment Methods Table**:
   ```sql
   SELECT * FROM payment_methods;
   ```

2. **Payment Functions**:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name LIKE '%payment%';
   ```

3. **Purchase Order Payment Status**:
   ```sql
   SELECT id, total_amount, total_paid, payment_status 
   FROM lats_purchase_orders;
   ```

## ⚠️ **Important Notes:**

- **Backup**: Consider backing up your database before applying the migration
- **Testing**: Test the payment functionality after migration
- **Monitoring**: Monitor for any issues with existing data
- **Currency**: The system currently handles TZS currency primarily

---

**Status**: ✅ Migration fixed and ready to apply
**Error**: ✅ Resolved (parameter order corrected + constraint syntax fixed)
**Next Action**: Apply the migration using one of the methods above

### 🔧 **Latest Fix:**
- **Issue**: `42601: syntax error at or near "NOT"` - `IF NOT EXISTS` not supported for `ADD CONSTRAINT`
- **Solution**: Used `DO $$` block with conditional logic to check if constraint exists before adding it
