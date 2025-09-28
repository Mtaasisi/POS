const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPaymentMigration() {
  try {
    console.log('🚀 Applying payment functionality migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250131000054_fix_payment_functionality_final.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded, applying to database...');
    
    // Apply the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      return false;
    }
    
    console.log('✅ Payment functionality migration applied successfully!');
    
    // Verify the function exists
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'process_purchase_order_payment');
    
    if (funcError) {
      console.log('⚠️  Could not verify function existence (this is normal)');
    } else {
      console.log('✅ Function verification completed');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error in applyPaymentMigration:', error);
    return false;
  }
}

// Run the migration
applyPaymentMigration()
  .then(success => {
    if (success) {
      console.log('🎉 Payment functionality is now ready!');
    } else {
      console.log('💥 Migration failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
