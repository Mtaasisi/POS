-- Fix the RLS policy for purchase_order_audit table
-- This allows users to insert audit records properly

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit;

-- Create a more permissive INSERT policy
-- Allow authenticated users to insert audit records
CREATE POLICY "Allow authenticated users to insert audit records" 
ON purchase_order_audit 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also update the SELECT policy to be less restrictive
DROP POLICY IF EXISTS "Users can view purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit;

CREATE POLICY "Allow authenticated users to view audit records" 
ON purchase_order_audit 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

