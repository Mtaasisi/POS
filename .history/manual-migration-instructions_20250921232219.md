# Manual Migration Instructions for Device Diagnoses

The `device_diagnoses` table needs to be created to fix the 404 error in DiagnosisModal.tsx. Please follow these steps:

## Step 1: Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL commands in order:

## Step 2: Create Diagnostic Tables (if not already created)

```sql
-- Create diagnostic_requests table
CREATE TABLE IF NOT EXISTS diagnostic_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'submitted_for_review', 'admin_reviewed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnostic_devices table
CREATE TABLE IF NOT EXISTS diagnostic_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diagnostic_request_id UUID NOT NULL REFERENCES diagnostic_requests(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    serial_number TEXT,
    model TEXT,
    notes TEXT,
    result_status TEXT NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'passed', 'failed', 'partially_failed', 'submitted_for_review', 'repair_required', 'replacement_required', 'no_action_required', 'escalated', 'admin_reviewed', 'sent_to_care')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_created_by ON diagnostic_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_assigned_to ON diagnostic_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_status ON diagnostic_requests(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_requests_created_at ON diagnostic_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_request_id ON diagnostic_devices(diagnostic_request_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_result_status ON diagnostic_devices(result_status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_devices_created_at ON diagnostic_devices(created_at);

-- Enable Row Level Security
ALTER TABLE diagnostic_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_devices ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON diagnostic_requests
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON diagnostic_devices
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON diagnostic_requests TO authenticated;
GRANT ALL ON diagnostic_devices TO authenticated;
```

## Step 3: Create Device-Related Tables (if not already created)

```sql
-- Create device_remarks table
CREATE TABLE IF NOT EXISTS device_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_transitions table
CREATE TABLE IF NOT EXISTS device_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    performed_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device_ratings table
CREATE TABLE IF NOT EXISTS device_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_remarks_device_id ON device_remarks(device_id);
CREATE INDEX IF NOT EXISTS idx_device_remarks_created_by ON device_remarks(created_by);
CREATE INDEX IF NOT EXISTS idx_device_remarks_created_at ON device_remarks(created_at);

CREATE INDEX IF NOT EXISTS idx_device_transitions_device_id ON device_transitions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_transitions_to_status ON device_transitions(to_status);
CREATE INDEX IF NOT EXISTS idx_device_transitions_performed_by ON device_transitions(performed_by);
CREATE INDEX IF NOT EXISTS idx_device_transitions_created_at ON device_transitions(created_at);

CREATE INDEX IF NOT EXISTS idx_device_ratings_device_id ON device_ratings(device_id);
CREATE INDEX IF NOT EXISTS idx_device_ratings_technician_id ON device_ratings(technician_id);
CREATE INDEX IF NOT EXISTS idx_device_ratings_score ON device_ratings(score);
CREATE INDEX IF NOT EXISTS idx_device_ratings_created_at ON device_ratings(created_at);

-- Enable Row Level Security
ALTER TABLE device_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_ratings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables
CREATE POLICY "Enable all access for authenticated users" ON device_remarks
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON device_transitions
    FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON device_ratings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON device_remarks TO authenticated;
GRANT ALL ON device_remarks TO anon;

GRANT ALL ON device_transitions TO authenticated;
GRANT ALL ON device_transitions TO anon;

GRANT ALL ON device_ratings TO authenticated;
GRANT ALL ON device_ratings TO anon;
```

## Step 4: Create Diagnostic Checks Table

```sql
-- Create diagnostic_checks table
CREATE TABLE IF NOT EXISTS diagnostic_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diagnostic_device_id UUID NOT NULL,
    test_item TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
    remarks TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checks_diagnostic_device_id_fkey' 
        AND table_name = 'diagnostic_checks'
    ) THEN
        ALTER TABLE diagnostic_checks 
        ADD CONSTRAINT diagnostic_checks_diagnostic_device_id_fkey 
        FOREIGN KEY (diagnostic_device_id) 
        REFERENCES diagnostic_devices(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure indexes exist for better performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_device_id ON diagnostic_checks(diagnostic_device_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_result ON diagnostic_checks(result);
CREATE INDEX IF NOT EXISTS idx_diagnostic_checks_created_at ON diagnostic_checks(created_at);

-- Enable Row Level Security if not already enabled
ALTER TABLE diagnostic_checks ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users (only if it doesn't exist)
CREATE POLICY "Enable all access for authenticated users" ON diagnostic_checks
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON diagnostic_checks TO authenticated;
```

## Step 5: Create Device Diagnoses Table (MAIN TABLE)

```sql
-- Create device_diagnoses table for storing device diagnosis results
CREATE TABLE IF NOT EXISTS device_diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    diagnosis_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_diagnoses_device_id ON device_diagnoses(device_id);
CREATE INDEX IF NOT EXISTS idx_device_diagnoses_technician_id ON device_diagnoses(technician_id);
CREATE INDEX IF NOT EXISTS idx_device_diagnoses_status ON device_diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_device_diagnoses_created_at ON device_diagnoses(created_at);

-- Enable Row Level Security
ALTER TABLE device_diagnoses ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'device_diagnoses' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON device_diagnoses
            FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- Grant permissions to authenticated users
GRANT ALL ON device_diagnoses TO authenticated;
GRANT ALL ON device_diagnoses TO service_role;
```

## Step 6: Verify Tables Created

```sql
-- Check if all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'diagnostic_requests',
    'diagnostic_devices', 
    'diagnostic_checks',
    'device_diagnoses',
    'device_remarks',
    'device_transitions',
    'device_ratings'
)
ORDER BY table_name;
```

## Step 7: Test the DiagnosisModal

After running all the SQL commands above:

1. Refresh your application
2. Try using the DiagnosisModal functionality
3. The 404 error should be resolved

## Notes

- Run each step in order
- If you get errors about tables already existing, that's fine - the `IF NOT EXISTS` clauses will handle that
- The main table you need is `device_diagnoses` - this is what DiagnosisModal.tsx is trying to access
- All tables have proper Row Level Security (RLS) policies for authenticated users
- All tables have proper indexes for performance
