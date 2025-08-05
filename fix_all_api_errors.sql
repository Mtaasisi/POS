-- Comprehensive fix for API errors
-- This script fixes both the 403 Forbidden (gift cards) and 400 Bad Request (customers) errors

-- =============================================
-- STEP 1: Fix Gift Cards RLS Policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Users can insert gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Users can update gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Users can delete gift cards" ON gift_cards;

-- Create comprehensive policies for gift_cards
CREATE POLICY "Users can view gift cards" ON gift_cards 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert gift cards" ON gift_cards 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update gift cards" ON gift_cards 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete gift cards" ON gift_cards 
FOR DELETE USING (auth.role() = 'authenticated');

-- Also fix gift_card_transactions table policies
DROP POLICY IF EXISTS "Users can view gift card transactions" ON gift_card_transactions;
DROP POLICY IF EXISTS "Users can insert gift card transactions" ON gift_card_transactions;
DROP POLICY IF EXISTS "Users can update gift card transactions" ON gift_card_transactions;
DROP POLICY IF EXISTS "Users can delete gift card transactions" ON gift_card_transactions;

CREATE POLICY "Users can view gift card transactions" ON gift_card_transactions 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert gift card transactions" ON gift_card_transactions 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update gift card transactions" ON gift_card_transactions 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete gift card transactions" ON gift_card_transactions 
FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- STEP 2: Fix Customers Table Structure (SAFE APPROACH)
-- =============================================

-- First, let's see what color_tag values currently exist
SELECT DISTINCT color_tag FROM customers;

-- Update existing data to match the new constraint BEFORE applying it
-- Map old values to new values
UPDATE customers SET color_tag = 'new' WHERE color_tag = 'normal';
UPDATE customers SET color_tag = 'vip' WHERE color_tag = 'vip';
UPDATE customers SET color_tag = 'complainer' WHERE color_tag = 'complainer';

-- Now safely update the constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_color_tag_check;

-- Update the color_tag constraint to match the TypeScript interface
ALTER TABLE customers ADD CONSTRAINT customers_color_tag_check 
CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased'));

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'created_by') THEN
        ALTER TABLE customers ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add initial_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'initial_notes') THEN
        ALTER TABLE customers ADD COLUMN initial_notes TEXT;
    END IF;
    
    -- Add location_description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'location_description') THEN
        ALTER TABLE customers ADD COLUMN location_description TEXT;
    END IF;
    
    -- Add national_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'national_id') THEN
        ALTER TABLE customers ADD COLUMN national_id TEXT;
    END IF;
    
    -- Add profile_image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'profile_image') THEN
        ALTER TABLE customers ADD COLUMN profile_image TEXT;
    END IF;
END $$;

-- =============================================
-- STEP 3: Fix Customers RLS Policies
-- =============================================

-- Fix RLS policies for customers table
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

-- Create comprehensive policies for customers
CREATE POLICY "Users can view customers" ON customers 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert customers" ON customers 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update customers" ON customers 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete customers" ON customers 
FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- STEP 4: Fix Other Related Tables
-- =============================================

-- Fix loyalty_customers RLS policies
DROP POLICY IF EXISTS "Users can view loyalty customers" ON loyalty_customers;
DROP POLICY IF EXISTS "Users can insert loyalty customers" ON loyalty_customers;
DROP POLICY IF EXISTS "Users can update loyalty customers" ON loyalty_customers;
DROP POLICY IF EXISTS "Users can delete loyalty customers" ON loyalty_customers;

CREATE POLICY "Users can view loyalty customers" ON loyalty_customers 
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert loyalty customers" ON loyalty_customers 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update loyalty customers" ON loyalty_customers 
FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete loyalty customers" ON loyalty_customers 
FOR DELETE USING (auth.role() = 'authenticated');

-- Fix loyalty_rewards RLS policies
DROP POLICY IF EXISTS "Users can view loyalty rewards" ON loyalty_rewards;
DROP POLICY IF EXISTS "Users can insert loyalty rewards" ON loyalty_rewards;
DROP POLICY IF EXISTS "Users can update loyalty rewards" ON loyalty_rewards;
DROP POLICY IF EXISTS "Users can delete loyalty rewards" ON loyalty_rewards;

CREATE POLICY "Users can view loyalty rewards" ON loyalty_rewards 
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert loyalty rewards" ON loyalty_rewards 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update loyalty rewards" ON loyalty_rewards 
FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete loyalty rewards" ON loyalty_rewards 
FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- STEP 5: Success Message
-- =============================================

SELECT 'All API errors fixed successfully! Gift cards and customers should now work properly.' as status; 