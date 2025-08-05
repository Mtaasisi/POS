-- Fix RLS policies for gift_cards table
-- This will allow authenticated users to perform all operations on gift cards

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

-- Success message
SELECT 'Gift cards RLS policies fixed successfully!' as status; 