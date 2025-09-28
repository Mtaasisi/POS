-- Comprehensive database repair script
-- Fixes policy conflicts and trigger errors for diagnostic tables
-- Run this directly in your Supabase SQL editor or psql

-- Check if required tables exist first
DO $$
BEGIN
    -- Check if diagnostic_checklist_results table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'diagnostic_checklist_results' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'WARNING: diagnostic_checklist_results table does not exist - skipping related fixes';
    END IF;
    
    -- Check if device_diagnoses table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'device_diagnoses' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'WARNING: device_diagnoses table does not exist - skipping related fixes';
    END IF;
    
    -- Check if update_updated_at_column function exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        RAISE NOTICE 'WARNING: update_updated_at_column function does not exist - trigger creation will be skipped';
    END IF;
END $$;

-- Fix diagnostic_checklist_results policy (consistent format)
DO $$
BEGIN
    -- Only proceed if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'diagnostic_checklist_results' 
        AND table_schema = 'public'
    ) THEN
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Enable all access for authenticated users" ON diagnostic_checklist_results;
        
        -- Create consistent policy
        CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checklist_results
            FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
            
        RAISE NOTICE 'Fixed diagnostic_checklist_results policy - OK';
    ELSE
        RAISE NOTICE 'diagnostic_checklist_results table not found - skipping policy creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'diagnostic_checklist_results policy already exists - OK';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with diagnostic_checklist_results policy: %', SQLERRM;
END $$;

-- Fix device_diagnoses policy (consistent format)
DO $$
BEGIN
    -- Only proceed if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'device_diagnoses' 
        AND table_schema = 'public'
    ) THEN
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Enable all access for authenticated users" ON device_diagnoses;
        
        -- Create consistent policy
        CREATE POLICY "Enable all access for authenticated users" ON device_diagnoses
            FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
            
        RAISE NOTICE 'Fixed device_diagnoses policy - OK';
    ELSE
        RAISE NOTICE 'device_diagnoses table not found - skipping policy creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'device_diagnoses policy already exists - OK';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with device_diagnoses policy: %', SQLERRM;
END $$;

-- Fix diagnostic_checklist_results trigger
DO $$
BEGIN
    -- Only proceed if both table and function exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'diagnostic_checklist_results' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_diagnostic_checklist_results_updated_at ON diagnostic_checklist_results;
        
        -- Create the trigger
        CREATE TRIGGER update_diagnostic_checklist_results_updated_at 
            BEFORE UPDATE ON diagnostic_checklist_results
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Fixed diagnostic_checklist_results trigger - OK';
    ELSE
        RAISE NOTICE 'diagnostic_checklist_results trigger skipped - table or function not found';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'diagnostic_checklist_results trigger already exists - OK';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with diagnostic_checklist_results trigger: %', SQLERRM;
END $$;

-- Fix device_diagnoses trigger
DO $$
BEGIN
    -- Only proceed if both table and function exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'device_diagnoses' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_device_diagnoses_updated_at ON device_diagnoses;
        
        -- Create the trigger
        CREATE TRIGGER update_device_diagnoses_updated_at 
            BEFORE UPDATE ON device_diagnoses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Fixed device_diagnoses trigger - OK';
    ELSE
        RAISE NOTICE 'device_diagnoses trigger skipped - table or function not found';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'device_diagnoses trigger already exists - OK';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with device_diagnoses trigger: %', SQLERRM;
END $$;

-- Comprehensive verification section
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
END $$;

-- Verify policies exist and show details
SELECT 
    'POLICY CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('diagnostic_checklist_results', 'device_diagnoses')
AND policyname = 'Enable all access for authenticated users'
ORDER BY tablename;

-- Verify triggers exist and show details
SELECT 
    'TRIGGER CHECK' as check_type,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('diagnostic_checklist_results', 'device_diagnoses')
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- Verify table structure for updated_at columns
SELECT 
    'TABLE STRUCTURE' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('diagnostic_checklist_results', 'device_diagnoses')
AND column_name = 'updated_at'
ORDER BY table_name;

-- Final status check
DO $$
BEGIN
    RAISE NOTICE '=== REPAIR COMPLETED ===';
    RAISE NOTICE 'Check the results above to verify all fixes were applied correctly';
END $$;
