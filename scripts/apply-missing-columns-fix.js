import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMissingColumnsFix() {
  console.log('🚀 Applying missing columns fix...');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241203000004_fix_missing_pos_settings_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration SQL loaded from file');
    console.log('📝 SQL Preview:');
    console.log(migrationSQL.substring(0, 500) + '...');

    console.log('\n⚠️  IMPORTANT: This script cannot directly execute the migration due to permissions.');
    console.log('📋 Please apply this migration using one of these methods:');
    console.log('\n1. Supabase Dashboard:');
    console.log('   - Go to your Supabase project dashboard');
    console.log('   - Navigate to SQL Editor');
    console.log('   - Copy and paste the SQL from the migration file');
    console.log('   - Execute the SQL');
    console.log('\n2. Supabase CLI:');
    console.log('   - Run: supabase db push');
    console.log('\n3. Manual SQL Execution:');
    console.log('   - Copy the SQL below and execute it in your database');

    console.log('\n📋 SQL to execute:');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));

    // Test if the tables exist and show current structure
    console.log('\n🔍 Current table status:');
    
    // Try to get table info by attempting a simple select
    const { data: loyaltyTest, error: loyaltyError } = await supabase
      .from('lats_pos_loyalty_customer_settings')
      .select('id')
      .limit(1);

    if (loyaltyError) {
      console.log('❌ Loyalty table error:', loyaltyError.message);
    } else {
      console.log('✅ Loyalty table exists and is accessible');
    }

    const { data: analyticsTest, error: analyticsError } = await supabase
      .from('lats_pos_analytics_reporting_settings')
      .select('id')
      .limit(1);

    if (analyticsError) {
      console.log('❌ Analytics table error:', analyticsError.message);
    } else {
      console.log('✅ Analytics table exists and is accessible');
    }

    console.log('\n🎉 Instructions provided. Please apply the migration manually.');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix
applyMissingColumnsFix()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
