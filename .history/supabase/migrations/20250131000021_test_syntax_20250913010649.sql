-- Test migration to verify syntax
-- This is a simple test to ensure the migration system is working

DO $$ 
BEGIN
    -- Simple test query
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        RAISE NOTICE 'Customers table exists';
    ELSE
        RAISE NOTICE 'Customers table does not exist';
    END IF;
END $$;
