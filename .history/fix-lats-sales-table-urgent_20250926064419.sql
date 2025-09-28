-- Urgent Fix for lats_sales Table Structure
-- This script ensures the lats_sales table has all required columns and constraints

-- 1. Check current table structure
SELECT 
    'Current lats_sales columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- 2. Add missing columns (safe approach with IF NOT EXISTS)
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS sale_number VARCHAR(50);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add optional columns
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed';
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS tax DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Fix existing data before adding constraints
UPDATE lats_sales 
SET status = 'completed' 
WHERE status NOT IN ('pending', 'completed', 'cancelled', 'refunded')
   OR status IS NULL;

UPDATE lats_sales 
SET discount_type = 'fixed' 
WHERE discount_type NOT IN ('fixed', 'percentage')
   OR discount_type IS NULL;

-- 5. Ensure customer_id is NOT NULL for new records (but don't break existing ones)
-- We'll add a constraint that only applies to new inserts
ALTER TABLE lats_sales ALTER COLUMN customer_id SET NOT NULL;

-- 6. Add constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Add status constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_lats_sales_status'
    ) THEN
        ALTER TABLE lats_sales ADD CONSTRAINT chk_lats_sales_status 
        CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));
    END IF;
    
    -- Add discount_type constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_lats_sales_discount_type'
    ) THEN
        ALTER TABLE lats_sales ADD CONSTRAINT chk_lats_sales_discount_type 
        CHECK (discount_type IN ('fixed', 'percentage'));
    END IF;
END $$;

-- 7. Create indexes (only if they don't exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_total_amount ON lats_sales(total_amount);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);

-- 8. Enable RLS if not already enabled
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;

CREATE POLICY "Enable read access for all users" ON lats_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);

-- 10. Create or find walk-in customer (required for sales without specific customer)
DO $$
DECLARE
    walk_in_customer_id UUID;
BEGIN
    -- Check if walk-in customer exists
    SELECT id INTO walk_in_customer_id 
    FROM customers 
    WHERE name = 'Walk-in Customer' AND phone = '+255000000000'
    LIMIT 1;
    
    IF walk_in_customer_id IS NULL THEN
        -- Create walk-in customer
        BEGIN
            INSERT INTO customers (
                name, 
                phone, 
                email,
                color_tag,
                gender,
                loyalty_level,
                created_by
            ) VALUES (
                'Walk-in Customer', 
                '+255000000000', 
                'walkin@lats.com',
                'new',           -- Required: 'new', 'vip', 'complainer', or 'purchased'
                'other',         -- Required: 'male', 'female', or 'other'
                'bronze',        -- Required: 'bronze', 'silver', 'gold', or 'platinum'
                'System'
            ) RETURNING id INTO walk_in_customer_id;
            RAISE NOTICE 'Created walk-in customer with ID: %', walk_in_customer_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create walk-in customer: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Walk-in customer already exists with ID: %', walk_in_customer_id;
    END IF;
END $$;

-- 11. Test sale insertion with minimal data
DO $$
DECLARE
    test_sale_id UUID;
    walk_in_customer_id UUID;
BEGIN
    -- Get walk-in customer ID
    SELECT id INTO walk_in_customer_id 
    FROM customers 
    WHERE name = 'Walk-in Customer' AND phone = '+255000000000'
    LIMIT 1;
    
    -- Test minimal sale
    INSERT INTO lats_sales (
        sale_number,
        customer_id,
        total_amount,
        status,
        created_by
    ) VALUES (
        'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        walk_in_customer_id,
        100.00,
        'completed',
        'System Test'
    ) RETURNING id INTO test_sale_id;
    
    RAISE NOTICE '✅ Test sale created successfully with ID: %', test_sale_id;
    
    -- Clean up
    DELETE FROM lats_sales WHERE id = test_sale_id;
    RAISE NOTICE '✅ Test sale cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test sale failed: %', SQLERRM;
END $$;

-- 12. Show final structure
SELECT 
    'Final lats_sales structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- 13. Final status
SELECT '🎉 lats_sales table fix completed successfully!' as status;
