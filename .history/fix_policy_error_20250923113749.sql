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
