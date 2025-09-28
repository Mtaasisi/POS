# Manual Fix for Purchase Order Payment 400 Error

## Problem
The `process_purchase_order_payment` RPC function is failing with a 400 Bad Request error because the `purchase_order_audit` table schema doesn't match what the function expects.

## Root Cause
The function tries to insert into `purchase_order_audit` with these columns:
- `purchase_order_id`
- `action` 
- `details`
- `user_id`
- `created_by`
- `timestamp`

But the current table schema has different column names.

## Solution
You need to manually fix the `purchase_order_audit` table schema in your Supabase dashboard.

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `jxhzveborezjhsmzsgbc`
3. Navigate to **Table Editor**

### Step 2: Fix the Audit Table
1. Find the `purchase_order_audit` table
2. **Drop the existing table** (this will delete any existing audit data)
3. **Create a new table** with this exact schema:

```sql
CREATE TABLE purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Add Indexes
```sql
CREATE INDEX idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);
```

### Step 4: Enable RLS
```sql
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;
```

### Step 5: Add RLS Policies
```sql
CREATE POLICY "Users can view audit records for their purchase orders" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create audit records for their purchase orders" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );
```

## Alternative: Use SQL Editor
If you prefer, you can run this complete SQL in the **SQL Editor**:

```sql
-- Drop existing audit table
DROP TABLE IF EXISTS purchase_order_audit CASCADE;

-- Create audit table with correct schema
CREATE TABLE purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);

-- Enable RLS
ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view audit records for their purchase orders" ON purchase_order_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create audit records for their purchase orders" ON purchase_order_audit
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders 
            WHERE id = purchase_order_id 
            AND created_by = auth.uid()
        )
    );
```

## After the Fix
Once you've applied this fix, the `process_purchase_order_payment` RPC function should work correctly and you should be able to process payments without the 400 error.

## Testing
1. Try processing a purchase order payment again
2. Check the browser console for any remaining errors
3. Verify that the payment is recorded in the `purchase_order_payments` table
4. Check that the audit entry is created in the `purchase_order_audit` table
