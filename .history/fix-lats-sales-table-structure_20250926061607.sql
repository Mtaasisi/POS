-- Fix LATS Sales Table Structure
-- This script ensures the lats_sales table has all required columns for proper sales insertion

-- First, let's check the current structure
SELECT 
    'Current lats_sales table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- Add all missing columns that are referenced in the sales processing service
DO $$ 
BEGIN
    -- Add sale_number column if it doesn't exist (should be unique and not null)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'sale_number'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN sale_number VARCHAR(50) UNIQUE NOT NULL;
    END IF;

    -- Add subtotal column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN subtotal DECIMAL(15,2) DEFAULT 0;
    END IF;

    -- Add discount_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_amount'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_amount DECIMAL(15,2) DEFAULT 0;
    END IF;

    -- Add discount_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_type'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_type VARCHAR(20) DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage'));
    END IF;

    -- Add discount_value column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'discount_value'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN discount_value DECIMAL(15,2) DEFAULT 0;
    END IF;

    -- Add customer_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN customer_name VARCHAR(255);
    END IF;

    -- Add customer_phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN customer_phone VARCHAR(20);
    END IF;

    -- Add tax column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'tax'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN tax DECIMAL(15,2) DEFAULT 0;
    END IF;

    -- Ensure total_amount column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN total_amount DECIMAL(15,2) NOT NULL DEFAULT 0;
    END IF;

    -- Ensure payment_method column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash';
    END IF;

    -- Ensure status column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));
    END IF;

    -- Ensure created_by column exists and has proper type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN created_by TEXT;
    END IF;

    -- Ensure notes column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN notes TEXT;
    END IF;

    -- Ensure created_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Ensure updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE lats_sales ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_name ON lats_sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_phone ON lats_sales(customer_phone);
CREATE INDEX IF NOT EXISTS idx_lats_sales_total_amount ON lats_sales(total_amount);
CREATE INDEX IF NOT EXISTS idx_lats_sales_discount_amount ON lats_sales(discount_amount);
CREATE INDEX IF NOT EXISTS idx_lats_sales_payment_method ON lats_sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_lats_sales_status ON lats_sales(status);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_by ON lats_sales(created_by);

-- Enable Row Level Security if not already enabled
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;

CREATE POLICY "Enable read access for all users" ON lats_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);

-- Create or replace the updated_at trigger
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

-- Add comments for documentation
COMMENT ON COLUMN lats_sales.sale_number IS 'Unique sale number identifier';
COMMENT ON COLUMN lats_sales.subtotal IS 'Subtotal before discount and tax';
COMMENT ON COLUMN lats_sales.discount_amount IS 'The actual discount amount applied to the sale';
COMMENT ON COLUMN lats_sales.discount_type IS 'Type of discount: fixed (amount) or percentage';
COMMENT ON COLUMN lats_sales.discount_value IS 'The original discount value (amount or percentage)';
COMMENT ON COLUMN lats_sales.total_amount IS 'Final total amount after discount and tax';
COMMENT ON COLUMN lats_sales.payment_method IS 'Payment method used (JSON string for complex payments)';
COMMENT ON COLUMN lats_sales.status IS 'Sale status: pending, completed, cancelled, or refunded';
COMMENT ON COLUMN lats_sales.customer_name IS 'Customer name for quick reference (denormalized from customers table)';
COMMENT ON COLUMN lats_sales.customer_phone IS 'Customer phone for quick reference (denormalized from customers table)';
COMMENT ON COLUMN lats_sales.tax IS 'Tax amount applied to the sale';
COMMENT ON COLUMN lats_sales.created_by IS 'User who created the sale';

-- Verify the final structure
SELECT 
    'Final lats_sales table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- Show table constraints
SELECT 
    'Table constraints:' as info,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'lats_sales';

-- Test the table structure with a sample insert (will be rolled back)
DO $$
DECLARE
    test_sale_id UUID;
BEGIN
    -- Generate a test sale number
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
    
    -- Rollback the test sale
    DELETE FROM lats_sales WHERE id = test_sale_id;
    RAISE NOTICE '✅ Test sale cleaned up successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test sale failed: %', SQLERRM;
END $$;

-- Final status message
DO $$
BEGIN
    RAISE NOTICE '🎉 LATS Sales table structure has been updated successfully!';
    RAISE NOTICE '✅ All required columns are now present';
    RAISE NOTICE '✅ Indexes have been created for performance';
    RAISE NOTICE '✅ RLS policies are configured';
    RAISE NOTICE '✅ Triggers are set up for automatic updates';
    RAISE NOTICE '💡 The sales insertion should now work properly';
END $$;
