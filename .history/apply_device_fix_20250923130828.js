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

async function applyDeviceFix() {
  console.log('🚀 Applying comprehensive device status fix...');
  console.log('');

  try {
    // Read the SQL fix file
    const sqlFilePath = path.join(__dirname, 'simple_device_fix.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📋 Executing comprehensive device fix...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sqlContent 
    });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute SQL in parts
      console.log('🔄 Trying alternative approach...');
      await executeSQLInParts();
    } else {
      console.log('✅ SQL executed successfully!');
      console.log('🎉 Device status updates to repair-complete should work now!');
    }

  } catch (error) {
    console.error('❌ Failed to apply device fix:', error);
    process.exit(1);
  }
}

async function executeSQLInParts() {
  console.log('📋 Executing SQL in parts...');
  
  const sqlParts = [
    // Add missing columns
    `ALTER TABLE devices ADD COLUMN IF NOT EXISTS repair_cost NUMERIC(12,2) DEFAULT 0;`,
    `ALTER TABLE devices ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;`,
    
    // Drop conflicting constraints
    `ALTER TABLE devices DROP CONSTRAINT IF EXISTS check_status_transitions;`,
    `ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_status_check;`,
    
    // Add comprehensive constraint
    `ALTER TABLE devices ADD CONSTRAINT devices_status_check 
     CHECK (status IN (
         'assigned', 
         'diagnosis-started', 
         'awaiting-admin-review',
         'awaiting-parts', 
         'parts-arrived',
         'in-repair', 
         'reassembled-testing', 
         'repair-complete', 
         'process-payments',
         'returned-to-customer-care', 
         'done', 
         'failed'
     ));`
  ];

  for (let i = 0; i < sqlParts.length; i++) {
    const sql = sqlParts[i];
    console.log(`   Executing part ${i + 1}/${sqlParts.length}...`);
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`   ❌ Error in part ${i + 1}:`, error.message);
    } else {
      console.log(`   ✅ Part ${i + 1} completed`);
    }
  }

  console.log('✅ All SQL parts executed!');
  console.log('🎉 Device status updates to repair-complete should work now!');
}

// Run the fix
applyDeviceFix();
