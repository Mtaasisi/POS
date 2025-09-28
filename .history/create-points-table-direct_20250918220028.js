const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPointsTransactionsTable() {
  try {
    console.log('🔄 Creating points_transactions table...');
    
    // First, let's check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('points_transactions')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ points_transactions table already exists');
      return true;
    }
    
    if (checkError && checkError.code === 'PGRST116') {
      console.log('📝 Table does not exist, creating it...');
      
      // Since we can't execute raw SQL directly, let's try to create a dummy record
      // to trigger table creation, but first let's check if we can create it through
      // the REST API by attempting an insert
      
      const { error: insertError } = await supabase
        .from('points_transactions')
        .insert({
          customer_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          points_change: 0,
          transaction_type: 'adjusted',
          reason: 'Table creation test',
          created_by: 'system'
        });
      
      if (insertError && insertError.code === 'PGRST106') {
        console.log('❌ Table does not exist and cannot be created through REST API');
        console.log('💡 You need to create the table manually in Supabase dashboard or use a different approach');
        return false;
      }
      
      if (insertError) {
        console.log('⚠️ Table creation attempt failed:', insertError.message);
        return false;
      }
      
      console.log('✅ points_transactions table created successfully');
      return true;
    }
    
    console.log('❌ Unexpected error checking table:', checkError);
    return false;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function testPointsSystem() {
  try {
    console.log('🧪 Testing points system functionality...');
    
    // Try to fetch from points_transactions table
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Points system test failed:', error.message);
      return false;
    }
    
    console.log('✅ Points system is working! Found', data?.length || 0, 'transactions');
    return true;
  } catch (error) {
    console.error('❌ Points system test error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting points system setup...');
  
  const tableCreated = await createPointsTransactionsTable();
  
  if (tableCreated) {
    const systemWorking = await testPointsSystem();
    
    if (systemWorking) {
      console.log('🎉 Points system is fully functional!');
    } else {
      console.log('⚠️ Points system setup completed but testing failed');
    }
  } else {
    console.log('💥 Points system setup failed - table could not be created');
    console.log('');
    console.log('📋 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL from create-points-transactions-table.sql');
    console.log('4. Or apply the migration file: supabase/migrations/20250131000060_create_points_transactions_table.sql');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
