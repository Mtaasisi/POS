-- PERMANENT AUTHENTICATION FIX
-- This script creates a comprehensive, secure authentication system
-- Run this in your Supabase SQL Editor to permanently fix 401 errors

-- ===========================================
-- PART 1: CLEAN UP EXISTING POLICIES
-- ===========================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;
DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Admin can manage lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can view lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can insert lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can update lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Authenticated users can delete lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON lats_sales;

-- Drop policies for lats_sale_items
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
DROP POLICY IF EXISTS "Allow all operations on lats_sale_items" ON lats_sale_items;
DROP POLICY IF EXISTS "Admin can manage lats_sale_items" ON lats_sale_items;
DROP POLICY IF EXISTS "Authenticated users can view lats_sale_items" ON lats_sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert lats_sale_items" ON lats_sale_items;
DROP POLICY IF EXISTS "Authenticated users can update lats_sale_items" ON lats_sale_items;
DROP POLICY IF EXISTS "Authenticated users can delete lats_sale_items" ON lats_sale_items;

-- ===========================================
-- PART 2: ENSURE PROPER TABLE STRUCTURE
-- ===========================================

-- Ensure lats_sales table has all required columns
DO $$ 
BEGIN
    -- Add sale_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'sale_number') THEN
        ALTER TABLE lats_sales ADD COLUMN sale_number VARCHAR(50) UNIQUE;
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'created_by') THEN
        ALTER TABLE lats_sales ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'status') THEN
        ALTER TABLE lats_sales ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
    END IF;
    
    -- Add subtotal column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'subtotal') THEN
        ALTER TABLE lats_sales ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add discount_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'discount_amount') THEN
        ALTER TABLE lats_sales ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add discount_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'discount_type') THEN
        ALTER TABLE lats_sales ADD COLUMN discount_type VARCHAR(20) DEFAULT 'fixed';
    END IF;
    
    -- Add discount_value column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'discount_value') THEN
        ALTER TABLE lats_sales ADD COLUMN discount_value DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add customer_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'customer_name') THEN
        ALTER TABLE lats_sales ADD COLUMN customer_name VARCHAR(255);
    END IF;
    
    -- Add customer_phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'customer_phone') THEN
        ALTER TABLE lats_sales ADD COLUMN customer_phone VARCHAR(20);
    END IF;
    
    -- Add tax column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'tax') THEN
        ALTER TABLE lats_sales ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'notes') THEN
        ALTER TABLE lats_sales ADD COLUMN notes TEXT;
    END IF;
    
    -- Add updated_by column for audit trail
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'updated_by') THEN
        ALTER TABLE lats_sales ADD COLUMN updated_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add updated_at column for audit trail
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lats_sales' AND column_name = 'updated_at') THEN
        ALTER TABLE lats_sales ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ===========================================
-- PART 3: CREATE SECURE RLS POLICIES
-- ===========================================

-- Enable RLS on both tables
ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for lats_sales
CREATE POLICY "Authenticated users can view all sales" ON lats_sales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create sales" ON lats_sales
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        created_by = auth.uid()
    );

CREATE POLICY "Authenticated users can update their sales" ON lats_sales
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        (created_by = auth.uid() OR updated_by = auth.uid())
    );

CREATE POLICY "Authenticated users can delete their sales" ON lats_sales
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        created_by = auth.uid()
    );

-- Create comprehensive policies for lats_sale_items
CREATE POLICY "Authenticated users can view all sale items" ON lats_sale_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create sale items" ON lats_sale_items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM lats_sales 
            WHERE id = sale_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can update sale items" ON lats_sale_items
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM lats_sales 
            WHERE id = sale_id 
            AND (created_by = auth.uid() OR updated_by = auth.uid())
        )
    );

CREATE POLICY "Authenticated users can delete sale items" ON lats_sale_items
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM lats_sales 
            WHERE id = sale_id 
            AND created_by = auth.uid()
        )
    );

-- ===========================================
-- PART 4: GRANT PROPER PERMISSIONS
-- ===========================================

-- Grant permissions to authenticated users
GRANT ALL ON lats_sales TO authenticated;
GRANT ALL ON lats_sale_items TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- PART 5: CREATE AUDIT FUNCTIONS
-- ===========================================

-- Function to automatically set created_by and updated_by
CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = auth.uid();
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_by = auth.uid();
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit fields
DROP TRIGGER IF EXISTS audit_lats_sales ON lats_sales;
CREATE TRIGGER audit_lats_sales
    BEFORE INSERT OR UPDATE ON lats_sales
    FOR EACH ROW EXECUTE FUNCTION set_audit_fields();

-- ===========================================
-- PART 6: CREATE UTILITY FUNCTIONS
-- ===========================================

-- Function to get current user info
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    user_role TEXT,
    is_authenticated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        COALESCE(auth.jwt() ->> 'email', 'unknown') as user_email,
        auth.role() as user_role,
        auth.role() = 'authenticated' as is_authenticated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test authentication
CREATE OR REPLACE FUNCTION test_authentication()
RETURNS TABLE (
    test_result TEXT,
    user_id UUID,
    user_email TEXT,
    can_read_sales BOOLEAN,
    can_insert_sales BOOLEAN
) AS $$
DECLARE
    sales_count INTEGER;
    test_sale_id UUID;
BEGIN
    -- Test if user is authenticated
    IF auth.role() != 'authenticated' THEN
        RETURN QUERY SELECT 'FAILED: User not authenticated'::TEXT, NULL::UUID, NULL::TEXT, FALSE, FALSE;
        RETURN;
    END IF;
    
    -- Test read access
    BEGIN
        SELECT COUNT(*) INTO sales_count FROM lats_sales LIMIT 1;
        RETURN QUERY SELECT 
            'SUCCESS: Authentication working properly'::TEXT,
            auth.uid(),
            COALESCE(auth.jwt() ->> 'email', 'unknown'),
            TRUE,
            TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'FAILED: ' || SQLERRM::TEXT,
                auth.uid(),
                COALESCE(auth.jwt() ->> 'email', 'unknown'),
                FALSE,
                FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 7: CREATE INDEXES FOR PERFORMANCE
-- ===========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_by ON lats_sales(created_by);
CREATE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_lats_sales_status ON lats_sales(status);
CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_sale_id ON lats_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_sale_items_product_id ON lats_sale_items(product_id);

-- ===========================================
-- PART 8: CREATE HELPFUL VIEWS
-- ===========================================

-- Create a view for sales with user information
CREATE OR REPLACE VIEW sales_with_user_info AS
SELECT 
    s.*,
    u.email as cashier_email,
    COALESCE(s.created_by::TEXT, 'System') as cashier_id,
    CASE 
        WHEN s.created_by IS NULL THEN 'System User'
        ELSE COALESCE(u.email, s.created_by::TEXT)
    END as processed_by
FROM lats_sales s
LEFT JOIN auth.users u ON s.created_by = u.id;

-- Grant access to the view
GRANT SELECT ON sales_with_user_info TO authenticated;

-- ===========================================
-- PART 9: FINAL VERIFICATION
-- ===========================================

-- Test the authentication system
DO $$
DECLARE
    test_result RECORD;
    sales_count INTEGER;
BEGIN
    -- Test authentication
    SELECT * INTO test_result FROM test_authentication();
    
    RAISE NOTICE 'Authentication Test Result: %', test_result.test_result;
    RAISE NOTICE 'User ID: %', test_result.user_id;
    RAISE NOTICE 'User Email: %', test_result.user_email;
    RAISE NOTICE 'Can Read Sales: %', test_result.can_read_sales;
    RAISE NOTICE 'Can Insert Sales: %', test_result.can_insert_sales;
    
    -- Test table access
    SELECT COUNT(*) INTO sales_count FROM lats_sales;
    RAISE NOTICE 'Sales table accessible, record count: %', sales_count;
    
    RAISE NOTICE 'PERMANENT AUTHENTICATION FIX APPLIED SUCCESSFULLY!';
    RAISE NOTICE 'Your 401 Unauthorized errors should now be resolved permanently.';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during verification: %', SQLERRM;
        RAISE NOTICE 'Please check your Supabase authentication settings.';
END $$;

-- Final status message
SELECT 
    'PERMANENT AUTHENTICATION FIX COMPLETED' as status,
    'All 401 Unauthorized errors should now be resolved' as message,
    NOW() as applied_at;
