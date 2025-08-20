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

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for POS settings tables...');
  console.log('📊 The issue is that RLS policies are blocking INSERT operations\n');

  const tables = [
    'lats_pos_barcode_scanner_settings',
    'lats_pos_search_filter_settings',
    'lats_pos_user_permissions_settings',
    'lats_pos_loyalty_customer_settings',
    'lats_pos_analytics_reporting_settings',
    'lats_pos_notification_settings'
  ];

  console.log('📝 SOLUTION:');
  console.log('===========');
  console.log('The RLS policies are too restrictive and blocking INSERT operations.');
  console.log('You need to update the RLS policies in your Supabase dashboard.');
  console.log('');
  console.log('🔧 Follow these steps:');
  console.log('');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to Authentication > Policies');
  console.log('3. For each table below, update the policies:');
  console.log('');

  for (const table of tables) {
    console.log(`📋 Table: ${table}`);
    console.log(`   - Current issue: RLS policy blocking INSERT operations`);
    console.log(`   - Solution: Create permissive INSERT policy`);
    console.log('');
  }

  console.log('📝 SQL to fix the policies:');
  console.log('==========================');
  console.log('');

  for (const table of tables) {
    console.log(`-- Fix RLS policies for ${table}`);
    console.log(`DROP POLICY IF EXISTS "Enable all access for authenticated users" ON ${table};`);
    console.log(`CREATE POLICY "Enable all access for authenticated users" ON ${table}`);
    console.log(`    FOR ALL USING (auth.role() = 'authenticated');`);
    console.log('');
  }

  console.log('🔧 Alternative: Apply the migration file');
  console.log('=====================================');
  console.log('You can also apply the migration file I created:');
  console.log('supabase/migrations/20241203000001_fix_pos_settings_final.sql');
  console.log('');
  console.log('This migration will:');
  console.log('1. Drop existing restrictive policies');
  console.log('2. Create new permissive policies');
  console.log('3. Allow authenticated users to perform all operations');
  console.log('');
  console.log('🎯 After applying the fix, the 406 and 400 errors should be resolved!');
}

// Run the fix
fixRLSPolicies();
