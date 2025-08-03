-- Fix RLS Policies for Customers Table
-- This script drops existing policies and recreates them to avoid conflicts

-- Drop existing policies for customers table
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customers;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON customers;

-- Drop existing policies for customer_notes table
DROP POLICY IF EXISTS "Enable read access for all users" ON customer_notes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customer_notes;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON customer_notes;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON customer_notes;

-- Drop existing policies for promo_messages table
DROP POLICY IF EXISTS "Enable read access for all users" ON promo_messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON promo_messages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON promo_messages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON promo_messages;

-- Drop existing policies for customer_payments table
DROP POLICY IF EXISTS "Enable read access for all users" ON customer_payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON customer_payments;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON customer_payments;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON customer_payments;

-- Recreate RLS policies for customers table
CREATE POLICY "Enable read access for all users" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON customers
    FOR DELETE USING (auth.role() = 'authenticated');

-- Recreate RLS policies for customer_notes table
CREATE POLICY "Enable read access for all users" ON customer_notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON customer_notes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON customer_notes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON customer_notes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Recreate RLS policies for promo_messages table
CREATE POLICY "Enable read access for all users" ON promo_messages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON promo_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON promo_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON promo_messages
    FOR DELETE USING (auth.role() = 'authenticated');

-- Recreate RLS policies for customer_payments table
CREATE POLICY "Enable read access for all users" ON customer_payments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON customer_payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON customer_payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON customer_payments
    FOR DELETE USING (auth.role() = 'authenticated');

SELECT 'Customers table RLS policies updated successfully!' as status; 