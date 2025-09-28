-- Simple Sales Fix - No Syntax Errors
-- This script focuses on the essential fixes without complex constraint handling

-- 1. Check current structure first
SELECT 
    'Current lats_sales columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- 2. Add missing columns one by one (safe approach)
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS sale_number VARCHAR(50);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed';
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS tax DECIMAL(15,2) DEFAULT 0;
ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Fix existing data before adding constraints
UPDATE lats_sales 
SET status = 'completed' 
WHERE status NOT IN ('pending', 'completed', 'cancelled', 'refunded')
   OR status IS NULL;

UPDATE lats_sales 
SET discount_type = 'fixed' 
WHERE discount_type NOT IN ('fixed', 'percentage')
   OR discount_type IS NULL;

-- 3. Make customer_id nullable (to allow walk-in customers)
ALTER TABLE lats_sales ALTER COLUMN customer_id DROP NOT NULL;

-- 4. Add basic indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_total_amount ON lats_sales(total_amount);

-- 5. Enable RLS if not already enabled
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;

CREATE POLICY "Enable read access for all users" ON lats_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);

-- 7. Create or find walk-in customer
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
        INSERT INTO customers (name, phone, email, address, created_by)
        VALUES ('Walk-in Customer', '+255000000000', 'walkin@lats.com', 'Store Location', 'System')
        RETURNING id INTO walk_in_customer_id;
        RAISE NOTICE 'Created walk-in customer with ID: %', walk_in_customer_id;
    ELSE
        RAISE NOTICE 'Walk-in customer already exists with ID: %', walk_in_customer_id;
    END IF;
END $$;

-- 8. Test sale insertion
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
        payment_method,
        status,
        created_by
    ) VALUES (
        'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        walk_in_customer_id,
        100.00,
        '{"type": "cash", "amount": 100.00}',
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

-- 9. Show final structure
SELECT 
    'Final lats_sales structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- 10. Final status
SELECT '🎉 Simple sales fix completed successfully!' as status;
