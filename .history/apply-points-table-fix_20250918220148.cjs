const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPointsTableFix() {
  try {
    console.log('🔧 Applying points_transactions table structure fix...');
    
    // Read the SQL migration file
    const sqlContent = fs.readFileSync('./supabase/migrations/20250131000061_fix_points_transactions_table_structure.sql', 'utf8');
    
    console.log('\n📋 SQL Migration to apply:');
    console.log('=' .repeat(60));
    console.log(sqlContent);
    console.log('=' .repeat(60));
    
    console.log('\n💡 Since we cannot execute DDL directly through the REST API,');
    console.log('   please follow these steps:');
    console.log('');
    console.log('1. Open your Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute the migration');
    console.log('');
    console.log('🔄 After applying the migration, run: node test-points-after-fix.cjs');
    
    return true;
  } catch (error) {
    console.error('❌ Error preparing fix:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Preparing points_transactions table structure fix...');
  
  const fixPrepared = await applyPointsTableFix();
  
  if (fixPrepared) {
    console.log('\n✅ Fix prepared successfully!');
    console.log('📝 Follow the manual steps above to complete the fix.');
  } else {
    console.log('\n💥 Failed to prepare fix');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
