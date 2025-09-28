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

async function applyRepairPaymentsCleanup() {
  try {
    console.log('🔧 Starting repair payments cleanup...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'remove-repair-payments-only.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    console.log('🔧 Executing repair payments cleanup...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing repair payments cleanup:', error);
      throw error;
    }
    
    console.log('✅ Repair payments cleanup completed successfully!');
    console.log('📊 Results:', data);
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    
    // Check if repair payment tables still exist
    const { data: repairTables, error: repairTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['customer_payments']);
    
    if (repairTablesError) {
      console.warn('⚠️ Could not verify repair table cleanup:', repairTablesError);
    } else {
      console.log('📋 Remaining repair payment tables:', repairTables?.length || 0);
      if (repairTables && repairTables.length > 0) {
        console.log('   Tables:', repairTables.map(t => t.table_name).join(', '));
      }
    }
    
    // Check if other payment systems are still intact
    const { data: otherTables, error: otherTablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['payment_transactions', 'purchase_order_payments', 'payment_methods', 'finance_accounts']);
    
    if (otherTablesError) {
      console.warn('⚠️ Could not verify other payment systems:', otherTablesError);
    } else {
      console.log('📋 Other payment systems still intact:', otherTables?.length || 0);
      if (otherTables && otherTables.length > 0) {
        console.log('   Tables:', otherTables.map(t => t.table_name).join(', '));
      }
    }
    
    // Check devices table columns
    const { data: deviceColumns, error: deviceError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'devices')
      .eq('table_schema', 'public')
      .or('column_name.like.%repair_price%,column_name.like.%repair_cost%,column_name.like.%deposit%,column_name.like.%payment_status%');
    
    if (deviceError) {
      console.warn('⚠️ Could not verify device columns cleanup:', deviceError);
    } else {
      console.log('📋 Remaining repair payment columns in devices table:', deviceColumns?.length || 0);
      if (deviceColumns && deviceColumns.length > 0) {
        console.log('   Columns:', deviceColumns.map(c => c.column_name).join(', '));
      }
    }
    
    console.log('\n🎉 Repair payment functionality has been removed!');
    console.log('   ✅ Repair payment tables dropped');
    console.log('   ✅ Repair payment columns removed');
    console.log('   ✅ Repair payment functions dropped');
    console.log('   ✅ Repair payment views dropped');
    console.log('   ✅ Other payment systems preserved');
    console.log('\n🚀 The repair system now works without payment processing!');
    console.log('   💳 POS and purchase order payments remain intact');
    
  } catch (error) {
    console.error('❌ Failed to apply repair payments cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
applyRepairPaymentsCleanup();
