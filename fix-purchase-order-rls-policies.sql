-- Fix RLS policies for purchase order tables
-- Run this in your Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view purchase order messages" ON purchase_order_messages;
DROP POLICY IF EXISTS "Users can create purchase order messages" ON purchase_order_messages;
DROP POLICY IF EXISTS "Users can update purchase order messages" ON purchase_order_messages;
DROP POLICY IF EXISTS "Users can delete purchase order messages" ON purchase_order_messages;

DROP POLICY IF EXISTS "Users can view purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can create purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can update their purchase order payments" ON purchase_order_payments;
DROP POLICY IF EXISTS "Users can delete their purchase order payments" ON purchase_order_payments;

-- Create more permissive policies for purchase_order_messages
CREATE POLICY "Enable read access for all users" ON purchase_order_messages
  FOR SELECT USING (true);
  
CREATE POLICY "Enable insert for all users" ON purchase_order_messages
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Enable update for all users" ON purchase_order_messages
  FOR UPDATE USING (true);
  
CREATE POLICY "Enable delete for all users" ON purchase_order_messages
  FOR DELETE USING (true);

-- Create more permissive policies for purchase_order_payments
CREATE POLICY "Enable read access for all users" ON purchase_order_payments
  FOR SELECT USING (true);
  
CREATE POLICY "Enable insert for all users" ON purchase_order_payments
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Enable update for all users" ON purchase_order_payments
  FOR UPDATE USING (true);
  
CREATE POLICY "Enable delete for all users" ON purchase_order_payments
  FOR DELETE USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('purchase_order_messages', 'purchase_order_payments')
ORDER BY tablename, policyname;
