-- Quick fix for policy conflict errors
-- Run this directly in your Supabase SQL editor or psql

-- Fix diagnostic_checklist_results policy
DO $$
BEGIN
    -- Simply check if the policy exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_checklist_results' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checklist_results
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Created diagnostic_checklist_results policy';
    ELSE
        RAISE NOTICE 'diagnostic_checklist_results policy already exists - OK';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'diagnostic_checklist_results policy already exists - OK';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with diagnostic_checklist_results: %', SQLERRM;
END $$;

-- Fix device_diagnoses policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'device_diagnoses' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON device_diagnoses
            FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
        RAISE NOTICE 'Created device_diagnoses policy';
    ELSE
        RAISE NOTICE 'device_diagnoses policy already exists - OK';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'device_diagnoses policy already exists - OK';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error with device_diagnoses: %', SQLERRM;
END $$;

-- Fix trigger conflicts
DO $$
BEGIN
    -- Fix device_diagnoses trigger
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_device_diagnoses_updated_at ON device_diagnoses;
        CREATE TRIGGER update_device_diagnoses_updated_at 
            BEFORE UPDATE ON device_diagnoses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Fixed device_diagnoses trigger';
    END IF;
    
    -- Fix diagnostic_checklist_results trigger
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_diagnostic_checklist_results_updated_at ON diagnostic_checklist_results;
        CREATE TRIGGER update_diagnostic_checklist_results_updated_at 
            BEFORE UPDATE ON diagnostic_checklist_results
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Fixed diagnostic_checklist_results trigger';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Trigger fix failed: %', SQLERRM;
END $$;

-- Verify both policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('diagnostic_checklist_results', 'device_diagnoses')
AND policyname = 'Enable all access for authenticated users'
ORDER BY tablename;

-- Verify triggers exist
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table IN ('diagnostic_checklist_results', 'device_diagnoses')
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;
