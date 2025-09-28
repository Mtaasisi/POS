-- =====================================================
-- QUICK FIX FOR SEQUENCE ERROR
-- =====================================================
-- This fixes the "relation customer_payments_id_seq does not exist" error

-- Check if the sequence exists and handle accordingly
DO $$
BEGIN
    -- Check if customer_payments uses a sequence or UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_payments' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        RAISE NOTICE '✅ customer_payments uses UUID with gen_random_uuid() - no sequence needed';
        RAISE NOTICE '✅ The 400 error fix should work without sequence permissions';
    ELSE
        -- If it's not UUID, check for sequence
        IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'customer_payments_id_seq') THEN
            GRANT USAGE ON SEQUENCE customer_payments_id_seq TO authenticated;
            RAISE NOTICE '✅ Granted sequence permissions for customer_payments_id_seq';
        ELSE
            RAISE NOTICE '⚠️  No sequence found and not using UUID - this may need investigation';
        END IF;
    END IF;
END $$;

-- Grant basic table permissions (this should always work)
GRANT INSERT, SELECT, UPDATE, DELETE ON customer_payments TO authenticated;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customer_payments' 
ORDER BY ordinal_position;
