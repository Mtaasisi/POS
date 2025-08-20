import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runRLSFix() {
  console.log('🚀 Running RLS Policies Fix...');
  
  try {
    // Read the RLS migration file
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241201000021_fix_pos_settings_rls_policies.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing RLS migration...');
    
    // Execute the migration using RPC
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (migrationError) {
      console.error('❌ RLS migration failed:', migrationError);
      return;
    }
    
    console.log('✅ RLS migration completed successfully');
    
    // Test the tables by trying to query them
    const tablesToTest = [
      'lats_pos_barcode_scanner_settings',
      'lats_pos_search_filter_settings',
      'lats_pos_user_permissions_settings',
      'lats_pos_loyalty_customer_settings',
      'lats_pos_analytics_reporting_settings',
      'lats_pos_notification_settings'
    ];
    
    console.log('🧪 Testing table access after RLS fix...');
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ Error testing ${table}:`, error.message);
        } else {
          console.log(`✅ ${table} is accessible`);
        }
      } catch (err) {
        console.log(`❌ Exception testing ${table}:`, err.message);
      }
    }
    
    // Test with a specific user ID
    const testUserId = 'a7c9adb7-f525-4850-bd42-79a769f12953';
    console.log(`🧪 Testing with user ID: ${testUserId}`);
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', testUserId);
        
        if (error) {
          console.log(`❌ Error querying ${table} for user:`, error.message);
        } else {
          console.log(`✅ ${table} has ${data?.length || 0} records for user`);
        }
      } catch (err) {
        console.log(`❌ Exception querying ${table} for user:`, err.message);
      }
    }
    
    console.log('🎉 RLS fix completed!');
    
  } catch (error) {
    console.error('💥 Error running RLS fix:', error);
  }
}

// Run the fix
runRLSFix();
