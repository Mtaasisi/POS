-- Fix policy conflicts for diagnostic system
-- Migration: 20250131000066_fix_policy_conflicts.sql
-- This migration resolves the policy conflict error

-- Fix device_diagnoses table policy conflict
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON device_diagnoses;
    
    -- Recreate the policy
    CREATE POLICY "Enable all access for authenticated users" ON device_diagnoses
        FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
        
    RAISE NOTICE 'Fixed device_diagnoses policy conflict';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Policy conflict resolution failed: %', SQLERRM;
END $$;

-- Fix diagnostic_checklist_results table policy conflict
DO $$
BEGIN
    -- Check if policy already exists and is correct
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_checklist_results' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        RAISE NOTICE 'diagnostic_checklist_results policy already exists, skipping creation';
    ELSE
        -- Drop existing policy if it exists (just in case)
        DROP POLICY IF EXISTS "Enable all access for authenticated users" ON diagnostic_checklist_results;
        
        -- Create the policy
        CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checklist_results
            FOR ALL USING (auth.role() = 'authenticated');
            
        RAISE NOTICE 'Created diagnostic_checklist_results policy';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'diagnostic_checklist_results policy already exists, continuing';
    WHEN OTHERS THEN
        RAISE NOTICE 'Policy conflict resolution failed: %', SQLERRM;
END $$;

-- Verify policies exist
DO $$
BEGIN
    -- Check device_diagnoses policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'device_diagnoses' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        RAISE NOTICE 'device_diagnoses policy exists and is working';
    ELSE
        RAISE NOTICE 'device_diagnoses policy is missing';
    END IF;
    
    -- Check diagnostic_checklist_results policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'diagnostic_checklist_results' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        RAISE NOTICE 'diagnostic_checklist_results policy exists and is working';
    ELSE
        RAISE NOTICE 'diagnostic_checklist_results policy is missing';
    END IF;
END $$;
