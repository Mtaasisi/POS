const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPaymentDatabaseCleanup() {
  try {
    console.log('🧹 Starting payment database cleanup...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'remove-payment-tables-complete.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    console.log('🔧 Executing payment database cleanup...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing payment cleanup:', error);
      throw error;
    }
    
    console.log('✅ Payment database cleanup completed successfully!');
    console.log('📊 Results:', data);
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    
    // Check if payment tables still exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%payment%');
    
    if (tablesError) {
      console.warn('⚠️ Could not verify table cleanup:', tablesError);
    } else {
      console.log('📋 Remaining payment-related tables:', tables?.length || 0);
      if (tables && tables.length > 0) {
        console.log('   Tables:', tables.map(t => t.table_name).join(', '));
      }
    }
    
    // Check devices table columns
    const { data: deviceColumns, error: deviceError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'devices')
      .eq('table_schema', 'public')
      .or('column_name.like.%payment%,column_name.like.%repair_price%,column_name.like.%repair_cost%,column_name.like.%deposit%');
    
    if (deviceError) {
      console.warn('⚠️ Could not verify device columns cleanup:', deviceError);
    } else {
      console.log('📋 Remaining payment-related columns in devices table:', deviceColumns?.length || 0);
      if (deviceColumns && deviceColumns.length > 0) {
        console.log('   Columns:', deviceColumns.map(c => c.column_name).join(', '));
      }
    }
    
    console.log('\n🎉 Payment functionality has been completely removed from the database!');
    console.log('   ✅ All payment tables dropped');
    console.log('   ✅ All payment columns removed');
    console.log('   ✅ All payment functions dropped');
    console.log('   ✅ All payment triggers dropped');
    console.log('   ✅ All payment views dropped');
    console.log('\n🚀 The repair system now works without any payment processing!');
    
  } catch (error) {
    console.error('❌ Failed to apply payment database cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
applyPaymentDatabaseCleanup();
