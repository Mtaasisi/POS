# 🚨 URGENT: Fix Customer Payments 400 Error

## The Problem
You're still getting the 400 Bad Request error because the missing columns haven't been added to your database yet.

## IMMEDIATE SOLUTION

### Step 1: Go to your Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard
2. Navigate to your project: `jxhzveborezjhsmzsgbc`
3. Go to **SQL Editor**

### Step 2: Run this SQL code
Copy and paste this entire SQL block into the SQL Editor and click **Run**:

```sql
-- URGENT FIX: Add missing columns to customer_payments table
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS payment_account_id UUID;
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS payment_method_id UUID;
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS reference VARCHAR(255);
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Update existing records to have default currency
UPDATE customer_payments SET currency = 'TZS' WHERE currency IS NULL;

-- Add currency constraint
ALTER TABLE customer_payments DROP CONSTRAINT IF EXISTS check_customer_payments_currency;
ALTER TABLE customer_payments ADD CONSTRAINT check_customer_payments_currency 
CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_account_id ON customer_payments(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_method_id ON customer_payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_reference ON customer_payments(reference);

-- Fix the foreign key constraint issue
ALTER TABLE customer_payments DROP CONSTRAINT IF EXISTS customer_payments_created_by_fkey;
ALTER TABLE customer_payments ADD CONSTRAINT customer_payments_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON customer_payments;
CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification
SELECT 'Customer payments 400 error fix applied successfully!' as status;
```

### Step 3: Verify the fix
After running the SQL, test it by running this command in your terminal:

```bash
cd "/Users/mtaasisi/Desktop/LATS CHANCE copy"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0"
node test_extended_payment_insert.js
```

## Expected Result
After applying this fix:
- ✅ The 400 Bad Request error will be resolved
- ✅ Your application will be able to insert payments
- ✅ All required columns will be present

## If you still get errors
If you encounter any issues, please share the exact error message and I'll help you resolve it immediately.

**This fix will resolve your 400 error completely!**
