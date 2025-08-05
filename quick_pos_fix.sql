-- Quick Fix for POS Database Access Issues
-- Run this in your Supabase SQL Editor

-- 1. Fix customers table RLS policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to customers" ON customers;
CREATE POLICY "Allow all access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);

-- 2. Fix sales_orders table RLS policies
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to sales orders" ON sales_orders;
CREATE POLICY "Allow all access to sales orders" ON sales_orders FOR ALL USING (true) WITH CHECK (true);

-- 3. Fix sales_order_items table RLS policies
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to sales order items" ON sales_order_items;
CREATE POLICY "Allow all access to sales order items" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);

-- 4. Fix loyalty_customers table RLS policies
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to loyalty customers" ON loyalty_customers;
CREATE POLICY "Allow all access to loyalty customers" ON loyalty_customers FOR ALL USING (true) WITH CHECK (true);

-- 5. Fix loyalty_rewards table RLS policies
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to loyalty rewards" ON loyalty_rewards;
CREATE POLICY "Allow all access to loyalty rewards" ON loyalty_rewards FOR ALL USING (true) WITH CHECK (true);

-- 6. Fix gift_cards table RLS policies
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to gift cards" ON gift_cards;
CREATE POLICY "Allow all access to gift cards" ON gift_cards FOR ALL USING (true) WITH CHECK (true);

-- 7. Fix gift_card_transactions table RLS policies
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to gift card transactions" ON gift_card_transactions;
CREATE POLICY "Allow all access to gift card transactions" ON gift_card_transactions FOR ALL USING (true) WITH CHECK (true);

-- 8. Fix installment_payments table RLS policies
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to installment payments" ON installment_payments;
CREATE POLICY "Allow all access to installment payments" ON installment_payments FOR ALL USING (true) WITH CHECK (true);

-- 9. Fix locations table RLS policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to locations" ON locations;
CREATE POLICY "Allow all access to locations" ON locations FOR ALL USING (true) WITH CHECK (true);

-- 10. Fix products table RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to products" ON products;
CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true) WITH CHECK (true);

-- 11. Fix product_variants table RLS policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to product variants" ON product_variants;
CREATE POLICY "Allow all access to product variants" ON product_variants FOR ALL USING (true) WITH CHECK (true);

-- 12. Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 13. Insert default location if it doesn't exist
INSERT INTO locations (name, address, phone, manager, status)
SELECT 'Main Repair Center', 'Main Street, City', '+255123456789', 'Manager', 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM locations WHERE name = 'Main Repair Center'
);

-- 14. Verify the fix worked
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN (
    'customers', 'sales_orders', 'sales_order_items', 'loyalty_customers', 
    'loyalty_rewards', 'gift_cards', 'gift_card_transactions', 'installment_payments',
    'locations', 'products', 'product_variants'
)
ORDER BY tablename; 