import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnosePOSSettings() {
  console.log('🔍 Diagnosing POS settings issues...');
  console.log('📊 This will help identify why you\'re getting 406 and 400 errors\n');

  const tables = [
    'lats_pos_barcode_scanner_settings',
    'lats_pos_search_filter_settings',
    'lats_pos_user_permissions_settings',
    'lats_pos_loyalty_customer_settings',
    'lats_pos_analytics_reporting_settings',
    'lats_pos_notification_settings'
  ];

  console.log('📋 Testing table access for each POS settings table:\n');

  for (const table of tables) {
    console.log(`🔍 Testing ${table}...`);
    
    try {
      // Test SELECT with user_id filter (this should work if table exists and RLS allows it)
      const { data: selectData, error: selectError } = await supabase
        .from(table)
        .select('id')
        .eq('user_id', 'a15a9139-3be9-4028-b944-240caae9eeb2') // Your user ID from the logs
        .limit(1);

      if (selectError) {
        if (selectError.code === 'PGRST116') {
          console.log(`❌ Table ${table} does NOT exist`);
          console.log(`   → This is why you're getting 406 errors`);
        } else if (selectError.code === 'PGRST301') {
          console.log(`🔐 Table ${table} exists but RLS policy is blocking access`);
          console.log(`   → This is why you're getting 406 errors`);
        } else if (selectError.code === 'PGRST202') {
          console.log(`❌ Table ${table} does NOT exist (PGRST202 error)`);
          console.log(`   → This is why you're getting 406 errors`);
        } else {
          console.log(`❌ SELECT failed: ${selectError.code} - ${selectError.message}`);
        }
      } else {
        console.log(`✅ Table ${table} exists and is accessible`);
        console.log(`   → Found ${selectData?.length || 0} records`);
      }

    } catch (err) {
      console.log(`💥 Exception: ${err.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('📝 SUMMARY:');
  console.log('===========');
  console.log('The 406 (Not Acceptable) errors you\'re seeing indicate that:');
  console.log('1. The POS settings tables do not exist in your database');
  console.log('2. Or the RLS (Row Level Security) policies are blocking access');
  console.log('');
  console.log('The 400 (Bad Request) errors indicate that:');
  console.log('1. The table structure doesn\'t match what the application expects');
  console.log('2. Or there are missing required fields');
  console.log('');
  console.log('🔧 SOLUTION:');
  console.log('===========');
  console.log('1. Apply the migration file: supabase/migrations/20241203000001_fix_pos_settings_final.sql');
  console.log('2. Or manually create the tables in your Supabase dashboard');
  console.log('3. Ensure RLS policies allow authenticated users to access the tables');
  console.log('');
  console.log('📋 To apply the migration:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of the migration file');
  console.log('4. Execute the SQL');
  console.log('');
  console.log('🎯 This will create all the missing tables with proper RLS policies');
}

// Run the diagnosis
diagnosePOSSettings();
