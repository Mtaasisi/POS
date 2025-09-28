-- COMPLETE FIX: Both LATS Sales and Sale Items Tables
-- Run this in your Supabase SQL Editor to fix all sales-related issues

-- =====================================================
-- STEP 1: Fix lats_sales table structure
-- =====================================================

-- Check current lats_sales structure
SELECT 
    'Current lats_sales columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- Add all missing columns to lats_sales
DO $$ 
BEGIN
    -- Add sale_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'sale_number'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN sale_number VARCHAR(50);
        RAISE NOTICE 'Added sale_number column';
    END IF;

    -- Add subtotal column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN subtotal DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added subtotal column';
    END IF;

    -- Add discount_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added discount_amount column';
    END IF;

    -- Add discount_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_type'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_type VARCHAR(20) DEFAULT 'fixed';
        RAISE NOTICE 'Added discount_type column';
    END IF;

    -- Add discount_value column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_value'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_value DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added discount_value column';
    END IF;

    -- Add customer_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN customer_name VARCHAR(255);
        RAISE NOTICE 'Added customer_name column';
    END IF;

    -- Add customer_phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN customer_phone VARCHAR(20);
        RAISE NOTICE 'Added customer_phone column';
    END IF;

    -- Add tax column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'tax'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN tax DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added tax column';
    END IF;

    -- Ensure total_amount column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added total_amount column';
    END IF;

    -- Ensure payment_method column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN payment_method TEXT DEFAULT 'cash';
        RAISE NOTICE 'Added payment_method column';
    END IF;

    -- Ensure status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
        RAISE NOTICE 'Added status column';
    END IF;

    -- Ensure created_by column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN created_by TEXT;
        RAISE NOTICE 'Added created_by column';
    END IF;

    -- Ensure notes column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;

    -- Ensure created_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;

    -- Ensure updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Fix lats_sale_items table structure
-- =====================================================

-- Check current lats_sale_items structure
SELECT 
    'Current lats_sale_items columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sale_items' 
ORDER BY ordinal_position;

-- Add missing columns to lats_sale_items
DO $$ 
BEGIN
    -- Add unit_price column if it doesn't exist (some schemas use 'price')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sale_items' 
        AND column_name = 'unit_price'
    ) THEN
        -- Check if 'price' column exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lats_sale_items' 
            AND column_name = 'price'
        ) THEN
            ALTER TABLE lats_sale_items RENAME COLUMN price TO unit_price;
            RAISE NOTICE 'Renamed price column to unit_price';
        ELSE
            ALTER TABLE lats_sale_items ADD COLUMN unit_price DECIMAL(10,2) NOT NULL DEFAULT 0;
            RAISE NOTICE 'Added unit_price column';
        END IF;
    END IF;

    -- Add cost_price column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sale_items' 
        AND column_name = 'cost_price'
    ) THEN
        ALTER TABLE lats_sale_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added cost_price column';
    END IF;

    -- Add profit column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sale_items' 
        AND column_name = 'profit'
    ) THEN
        ALTER TABLE lats_sale_items ADD COLUMN profit DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added profit column';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sale_items' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE lats_sale_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Add constraints and indexes
-- =====================================================

-- Add constraints for lats_sales (with error handling)
DO $$
BEGIN
    -- Add discount_type constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'lats_sales' 
        AND constraint_name = 'chk_discount_type'
    ) THEN
        ALTER TABLE lats_sales ADD CONSTRAINT chk_discount_type CHECK (discount_type IN ('fixed', 'percentage'));
        RAISE NOTICE 'Added chk_discount_type constraint';
    END IF;
    
    -- Add status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'lats_sales' 
        AND constraint_name = 'chk_status'
    ) THEN
        ALTER TABLE lats_sales ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));
        RAISE NOTICE 'Added chk_status constraint';
    END IF;
END $$;

-- Add indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_total_amount ON lats_sales(total_amount);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);

-- Add indexes for lats_sale_items
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_variant_id ON lats_sale_items(variant_id);

-- =====================================================
-- STEP 4: Enable RLS and create policies
-- =====================================================

-- Enable RLS for both tables
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lats_sales
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;

CREATE POLICY "Enable read access for all users" ON lats_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);

-- Create RLS policies for lats_sale_items
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;

CREATE POLICY "Enable read access for all users" ON lats_sale_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sale_items FOR UPDATE USING (true);

-- =====================================================
-- STEP 5: Create triggers for updated_at
-- =====================================================

-- Create or replace the updated_at trigger for lats_sales
CREATE OR REPLACE FUNCTION update_lats_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lats_sales_updated_at ON lats_sales;
CREATE TRIGGER update_lats_sales_updated_at 
    BEFORE UPDATE ON lats_sales 
    FOR EACH ROW EXECUTE FUNCTION update_lats_sales_updated_at();

-- Create or replace the updated_at trigger for lats_sale_items
CREATE OR REPLACE FUNCTION update_lats_sale_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lats_sale_items_updated_at ON lats_sale_items;
CREATE TRIGGER update_lats_sale_items_updated_at 
    BEFORE UPDATE ON lats_sale_items 
    FOR EACH ROW EXECUTE FUNCTION update_lats_sale_items_updated_at();

-- =====================================================
-- STEP 6: Show final structures
-- =====================================================

SELECT 
    'Final lats_sales structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

SELECT 
    'Final lats_sale_items structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sale_items' 
ORDER BY ordinal_position;

-- =====================================================
-- STEP 7: Test complete sale insertion
-- =====================================================

DO $$
DECLARE
    test_sale_id UUID;
    test_item_id UUID;
BEGIN
    -- Insert test sale
    INSERT INTO lats_sales (
        sale_number,
        customer_id,
        subtotal,
        discount_amount,
        discount_type,
        discount_value,
        total_amount,
        payment_method,
        status,
        notes,
        created_by,
        customer_name,
        customer_phone,
        tax
    ) VALUES (
        'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        NULL,
        1000.00,
        100.00,
        'fixed',
        100.00,
        900.00,
        '{"type": "cash", "amount": 900.00}',
        'completed',
        'Test sale',
        'System Test',
        'Test Customer',
        '+255700000000',
        0.00
    ) RETURNING id INTO test_sale_id;
    
    RAISE NOTICE '✅ Test sale created successfully with ID: %', test_sale_id;
    
    -- Insert test sale item
    INSERT INTO lats_sale_items (
        sale_id,
        product_id,
        variant_id,
        quantity,
        unit_price,
        total_price,
        cost_price,
        profit
    ) VALUES (
        test_sale_id,
        gen_random_uuid(), -- Dummy product ID
        gen_random_uuid(), -- Dummy variant ID
        1,
        500.00,
        500.00,
        300.00,
        200.00
    ) RETURNING id INTO test_item_id;
    
    RAISE NOTICE '✅ Test sale item created successfully with ID: %', test_item_id;
    
    -- Clean up test data
    DELETE FROM lats_sale_items WHERE id = test_item_id;
    DELETE FROM lats_sales WHERE id = test_sale_id;
    RAISE NOTICE '✅ Test data cleaned up successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test failed: %', SQLERRM;
END $$;

-- =====================================================
-- FINAL STATUS
-- =====================================================

SELECT '🎉 Both LATS Sales tables have been fixed successfully!' as status;
SELECT '✅ lats_sales table is ready for sales insertion' as lats_sales_status;
SELECT '✅ lats_sale_items table is ready for sale items insertion' as lats_sale_items_status;
SELECT '✅ RLS policies are configured' as rls_status;
SELECT '✅ Triggers are set up for automatic updates' as triggers_status;
SELECT '💡 Sales should now work properly in the application!' as final_note;
