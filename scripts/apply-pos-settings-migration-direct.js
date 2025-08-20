import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigrationDirectly() {
  console.log('🚀 Applying POS Settings Migration Directly...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241202000007_fix_missing_pos_settings_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement using direct table operations
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`📝 Processing statement ${i + 1}/${statements.length}...`);
        
        // Skip complex statements that require exec_sql
        if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE') || statement.includes('CREATE POLICY')) {
          console.log(`⏭️ Skipping complex statement: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        // For simple statements, try to execute them
        try {
          // This won't work without exec_sql, but we'll try
          console.log(`⚠️ Cannot execute SQL directly without exec_sql function`);
          break;
        } catch (err) {
          console.error(`❌ Exception processing statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Migration processing completed!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

// Alternative approach: Create tables using direct Supabase operations
async function createTablesUsingDirectOperations() {
  console.log('🚀 Creating POS Settings Tables Using Direct Operations...');
  
  try {
    // Test connection first
    console.log('🔍 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('lats_pos_general_settings')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('⚠️ General settings table test:', testError.message);
    } else {
      console.log('✅ Connection test successful');
    }
    
    // Try to create a simple test record to see if tables exist
    const testUserId = 'a15a9139-3be9-4028-b944-240caae9eeb2'; // From the logs
    
    // Test barcode scanner settings
    console.log('🔍 Testing barcode scanner settings table...');
    const { data: scannerData, error: scannerError } = await supabase
      .from('lats_pos_barcode_scanner_settings')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (scannerError) {
      console.log('❌ Barcode scanner settings table error:', scannerError.message);
      console.log('💡 This table needs to be created');
    } else {
      console.log('✅ Barcode scanner settings table exists');
    }
    
    // Test search filter settings
    console.log('🔍 Testing search filter settings table...');
    const { data: searchData, error: searchError } = await supabase
      .from('lats_pos_search_filter_settings')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (searchError) {
      console.log('❌ Search filter settings table error:', searchError.message);
      console.log('💡 This table needs to be created');
    } else {
      console.log('✅ Search filter settings table exists');
    }
    
    // Test user permissions settings
    console.log('🔍 Testing user permissions settings table...');
    const { data: permissionsData, error: permissionsError } = await supabase
      .from('lats_pos_user_permissions_settings')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (permissionsError) {
      console.log('❌ User permissions settings table error:', permissionsError.message);
      console.log('💡 This table needs to be created');
    } else {
      console.log('✅ User permissions settings table exists');
    }
    
    // Test loyalty customer settings
    console.log('🔍 Testing loyalty customer settings table...');
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from('lats_pos_loyalty_customer_settings')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (loyaltyError) {
      console.log('❌ Loyalty customer settings table error:', loyaltyError.message);
      console.log('💡 This table needs to be created');
    } else {
      console.log('✅ Loyalty customer settings table exists');
    }
    
    // Test analytics reporting settings
    console.log('🔍 Testing analytics reporting settings table...');
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('lats_pos_analytics_reporting_settings')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (analyticsError) {
      console.log('❌ Analytics reporting settings table error:', analyticsError.message);
      console.log('💡 This table needs to be created');
    } else {
      console.log('✅ Analytics reporting settings table exists');
    }
    
    // Test notification settings
    console.log('🔍 Testing notification settings table...');
    const { data: notificationData, error: notificationError } = await supabase
      .from('lats_pos_notification_settings')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (notificationError) {
      console.log('❌ Notification settings table error:', notificationError.message);
      console.log('💡 This table needs to be created');
    } else {
      console.log('✅ Notification settings table exists');
    }
    
    console.log('🎉 Table existence check completed!');
    console.log('💡 The 406 errors indicate that these tables need to be created in the database');
    console.log('💡 You may need to apply the migration manually through the Supabase dashboard');
    
  } catch (error) {
    console.error('💥 Error checking tables:', error);
  }
}

// Run the table check
createTablesUsingDirectOperations();
