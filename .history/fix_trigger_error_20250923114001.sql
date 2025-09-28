-- Quick fix for trigger conflict errors
-- Run this directly in your Supabase SQL editor or psql

-- Fix device_diagnoses trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_device_diagnoses_updated_at ON device_diagnoses;
        
        -- Create the trigger
        CREATE TRIGGER update_device_diagnoses_updated_at 
            BEFORE UPDATE ON device_diagnoses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Fixed device_diagnoses trigger - OK';
    ELSE
        RAISE NOTICE 'update_updated_at_column function not found - skipping trigger creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'device_diagnoses trigger already exists - OK';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with device_diagnoses trigger: %', SQLERRM;
END $$;

-- Fix diagnostic_checklist_results trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_diagnostic_checklist_results_updated_at ON diagnostic_checklist_results;
        
        -- Create the trigger
        CREATE TRIGGER update_diagnostic_checklist_results_updated_at 
            BEFORE UPDATE ON diagnostic_checklist_results
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Fixed diagnostic_checklist_results trigger - OK';
    ELSE
        RAISE NOTICE 'update_updated_at_column function not found - skipping trigger creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'diagnostic_checklist_results trigger already exists - OK';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with diagnostic_checklist_results trigger: %', SQLERRM;
END $$;

-- Verify triggers exist and are working
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('diagnostic_checklist_results', 'device_diagnoses')
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;
