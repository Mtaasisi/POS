// Simple script to run the user device preferences migration
// This ensures the database table exists before the app tries to use it

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for migrations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running user device preferences migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250201000001_create_user_device_preferences.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📱 User device preferences table created');
    console.log('🔐 RLS policies configured');
    console.log('⚡ Indexes created for performance');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Check if we can connect to Supabase
async function testConnection() {
  try {
    const { data, error } = await supabase.from('auth.users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is expected for auth.users
      throw error;
    }
    console.log('✅ Connected to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to Supabase:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing Supabase connection...');
  const connected = await testConnection();
  
  if (!connected) {
    process.exit(1);
  }
  
  await runMigration();
}

main();
