-- Fix RLS Policies for Online Supabase Database
-- This script fixes the 403 Forbidden errors by creating proper RLS policies

-- 1. Fix Finance Accounts RLS Policies
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view finance accounts" ON finance_accounts;
    DROP POLICY IF EXISTS "Users can insert finance accounts" ON finance_accounts;
    DROP POLICY IF EXISTS "Users can update finance accounts" ON finance_accounts;
    DROP POLICY IF EXISTS "Users can delete finance accounts" ON finance_accounts;
    
    -- Create permissive policies for finance_accounts
    CREATE POLICY "Users can view finance accounts" ON finance_accounts
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can insert finance accounts" ON finance_accounts
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can update finance accounts" ON finance_accounts
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can delete finance accounts" ON finance_accounts
        FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'finance_accounts table does not exist';
END $$;

-- 2. Fix Finance Expenses RLS Policies
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view finance expenses" ON finance_expenses;
    DROP POLICY IF EXISTS "Users can insert finance expenses" ON finance_expenses;
    DROP POLICY IF EXISTS "Users can update finance expenses" ON finance_expenses;
    DROP POLICY IF EXISTS "Users can delete finance expenses" ON finance_expenses;
    
    -- Create permissive policies for finance_expenses
    CREATE POLICY "Users can view finance expenses" ON finance_expenses
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can insert finance expenses" ON finance_expenses
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can update finance expenses" ON finance_expenses
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can delete finance expenses" ON finance_expenses
        FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'finance_expenses table does not exist';
END $$;

-- 3. Fix Finance Expense Categories RLS Policies
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE finance_expense_categories ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view finance expense categories" ON finance_expense_categories;
    DROP POLICY IF EXISTS "Users can insert finance expense categories" ON finance_expense_categories;
    DROP POLICY IF EXISTS "Users can update finance expense categories" ON finance_expense_categories;
    DROP POLICY IF EXISTS "Users can delete finance expense categories" ON finance_expense_categories;
    
    -- Create permissive policies for finance_expense_categories
    CREATE POLICY "Users can view finance expense categories" ON finance_expense_categories
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can insert finance expense categories" ON finance_expense_categories
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can update finance expense categories" ON finance_expense_categories
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can delete finance expense categories" ON finance_expense_categories
        FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'finance_expense_categories table does not exist';
END $$;

-- 4. Fix Finance Transfers RLS Policies
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE finance_transfers ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view finance transfers" ON finance_transfers;
    DROP POLICY IF EXISTS "Users can insert finance transfers" ON finance_transfers;
    DROP POLICY IF EXISTS "Users can update finance transfers" ON finance_transfers;
    DROP POLICY IF EXISTS "Users can delete finance transfers" ON finance_transfers;
    
    -- Create permissive policies for finance_transfers
    CREATE POLICY "Users can view finance transfers" ON finance_transfers
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can insert finance transfers" ON finance_transfers
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can update finance transfers" ON finance_transfers
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can delete finance transfers" ON finance_transfers
        FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'finance_transfers table does not exist';
END $$;

-- 5. Fix Loyalty Customers RLS Policies
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view loyalty customers" ON loyalty_customers;
    DROP POLICY IF EXISTS "Users can insert loyalty customers" ON loyalty_customers;
    DROP POLICY IF EXISTS "Users can update loyalty customers" ON loyalty_customers;
    DROP POLICY IF EXISTS "Users can delete loyalty customers" ON loyalty_customers;
    
    -- Create permissive policies for loyalty_customers
    CREATE POLICY "Users can view loyalty customers" ON loyalty_customers
        FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can insert loyalty customers" ON loyalty_customers
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can update loyalty customers" ON loyalty_customers
        FOR UPDATE USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Users can delete loyalty customers" ON loyalty_customers
        FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'loyalty_customers table does not exist';
END $$;

-- 6. Fix Loyalty Rewards RLS Policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_rewards') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view loyalty rewards" ON loyalty_rewards;
        DROP POLICY IF EXISTS "Users can insert loyalty rewards" ON loyalty_rewards;
        DROP POLICY IF EXISTS "Users can update loyalty rewards" ON loyalty_rewards;
        DROP POLICY IF EXISTS "Users can delete loyalty rewards" ON loyalty_rewards;
        
        -- Create permissive policies for loyalty_rewards
        CREATE POLICY "Users can view loyalty rewards" ON loyalty_rewards
            FOR SELECT USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Users can insert loyalty rewards" ON loyalty_rewards
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
        CREATE POLICY "Users can update loyalty rewards" ON loyalty_rewards
            FOR UPDATE USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Users can delete loyalty rewards" ON loyalty_rewards
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'loyalty_rewards table does not exist';
END $$;

-- Grant necessary permissions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_accounts') THEN
        GRANT ALL ON finance_accounts TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_expenses') THEN
        GRANT ALL ON finance_expenses TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_expense_categories') THEN
        GRANT ALL ON finance_expense_categories TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'finance_transfers') THEN
        GRANT ALL ON finance_transfers TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_customers') THEN
        GRANT ALL ON loyalty_customers TO authenticated;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_rewards') THEN
        GRANT ALL ON loyalty_rewards TO authenticated;
    END IF;
END $$;

-- Success message
SELECT 'RLS policies updated successfully for all finance and loyalty tables!' as status; 