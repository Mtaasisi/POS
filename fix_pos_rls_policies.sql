-- Fix RLS Policies for POS Tables
-- This script makes the POS tables accessible without authentication

-- Fix RLS policies for sales_orders (allow anonymous access)
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view sales orders" ON sales_orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales orders" ON sales_orders;
DROP POLICY IF EXISTS "Allow authenticated users to update sales orders" ON sales_orders;

-- Create permissive policies that allow anonymous access
CREATE POLICY "Allow all users to view sales orders" ON sales_orders
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert sales orders" ON sales_orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update sales orders" ON sales_orders
    FOR UPDATE USING (true);

-- Fix RLS policies for customers (allow anonymous access)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON customers;

-- Create permissive policies for customers table
CREATE POLICY "Allow all users to view customers" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert customers" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update customers" ON customers
    FOR UPDATE USING (true);

CREATE POLICY "Allow all users to delete customers" ON customers
    FOR DELETE USING (true);

-- Fix RLS policies for sales_order_items
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view sales order items" ON sales_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales order items" ON sales_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to update sales order items" ON sales_order_items;

-- Create permissive policies
CREATE POLICY "Allow all users to view sales order items" ON sales_order_items
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert sales order items" ON sales_order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update sales order items" ON sales_order_items
    FOR UPDATE USING (true);

-- Fix RLS policies for installment_payments
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view installment payments" ON installment_payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert installment payments" ON installment_payments;
DROP POLICY IF EXISTS "Allow authenticated users to update installment payments" ON installment_payments;

-- Create permissive policies
CREATE POLICY "Allow all users to view installment payments" ON installment_payments
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert installment payments" ON installment_payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update installment payments" ON installment_payments
    FOR UPDATE USING (true);

-- Fix RLS policies for loyalty_customers
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view loyalty customers" ON loyalty_customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert loyalty customers" ON loyalty_customers;
DROP POLICY IF EXISTS "Allow authenticated users to update loyalty customers" ON loyalty_customers;

-- Create permissive policies
CREATE POLICY "Allow all users to view loyalty customers" ON loyalty_customers
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert loyalty customers" ON loyalty_customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update loyalty customers" ON loyalty_customers
    FOR UPDATE USING (true);

-- Fix RLS policies for loyalty_rewards
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view loyalty rewards" ON loyalty_rewards;
DROP POLICY IF EXISTS "Allow authenticated users to insert loyalty rewards" ON loyalty_rewards;
DROP POLICY IF EXISTS "Allow authenticated users to update loyalty rewards" ON loyalty_rewards;

-- Create permissive policies
CREATE POLICY "Allow all users to view loyalty rewards" ON loyalty_rewards
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert loyalty rewards" ON loyalty_rewards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update loyalty rewards" ON loyalty_rewards
    FOR UPDATE USING (true);

-- Fix RLS policies for gift_cards
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Allow authenticated users to insert gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Allow authenticated users to update gift cards" ON gift_cards;

-- Create permissive policies
CREATE POLICY "Allow all users to view gift cards" ON gift_cards
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert gift cards" ON gift_cards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update gift cards" ON gift_cards
    FOR UPDATE USING (true);

-- Fix RLS policies for gift_card_transactions
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view gift card transactions" ON gift_card_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert gift card transactions" ON gift_card_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to update gift card transactions" ON gift_card_transactions;

-- Create permissive policies
CREATE POLICY "Allow all users to view gift card transactions" ON gift_card_transactions
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert gift card transactions" ON gift_card_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update gift card transactions" ON gift_card_transactions
    FOR UPDATE USING (true);

-- Grant necessary permissions to anon role
GRANT ALL ON sales_orders TO anon;
GRANT ALL ON customers TO anon;
GRANT ALL ON sales_order_items TO anon;
GRANT ALL ON installment_payments TO anon;
GRANT ALL ON loyalty_customers TO anon;
GRANT ALL ON loyalty_rewards TO anon;
GRANT ALL ON gift_cards TO anon;
GRANT ALL ON gift_card_transactions TO anon;

-- Success message
SELECT 'POS RLS policies updated successfully to allow anonymous access!' as status; 