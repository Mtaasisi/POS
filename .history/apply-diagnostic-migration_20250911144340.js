#!/usr/bin/env node

// Script to apply the diagnostic_checklist migration to the production database
// This script will run the SQL migration directly

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying diagnostic_checklist migration...');
  
  try {
    // SQL to add the missing columns
    const migrationSQL = `
      -- Add diagnostic_checklist column as JSONB to store diagnostic results
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS diagnostic_checklist JSONB DEFAULT NULL;

      -- Add repair_checklist column as JSONB to store repair checklist data
      ALTER TABLE devices 
      ADD COLUMN IF NOT EXISTS repair_checklist JSONB DEFAULT NULL;

      -- Create index for better performance on JSONB columns
      CREATE INDEX IF NOT EXISTS idx_devices_diagnostic_checklist ON devices USING GIN (diagnostic_checklist);
      CREATE INDEX IF NOT EXISTS idx_devices_repair_checklist ON devices USING GIN (repair_checklist);

      -- Add comments for documentation
      COMMENT ON COLUMN devices.diagnostic_checklist IS 'Stores diagnostic checklist results including items, notes, summary, and overall status';
      COMMENT ON COLUMN devices.repair_checklist IS 'Stores repair checklist progress including items, notes, and completion status';
    `;

    // Execute the migration using rpc (remote procedure call)
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    
    // Verify the columns exist
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'devices')
      .eq('table_schema', 'public')
      .in('column_name', ['diagnostic_checklist', 'repair_checklist']);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      process.exit(1);
    }

    console.log('✅ Verification successful!');
    console.log('📋 Added columns:', columns.map(col => col.column_name).join(', '));
    console.log('🎉 Device PATCH requests should now work for diagnostic and repair data!');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
