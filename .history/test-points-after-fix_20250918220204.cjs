const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPointsAfterFix() {
  try {
    console.log('🧪 Testing points system after table structure fix...');
    
    // Test 1: Check if we can access the table
    console.log('\n1️⃣ Testing table access...');
    const { data: testData, error: accessError } = await supabase
      .from('points_transactions')
      .select('*')
      .limit(1);
    
    if (accessError) {
      console.log('❌ Cannot access points_transactions table:', accessError.message);
      return false;
    }
    console.log('✅ Table accessible');
    
    // Test 2: Test inserting a points transaction
    console.log('\n2️⃣ Testing points transaction insertion...');
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (!customers || customers.length === 0) {
      console.log('❌ No customers found for testing');
      return false;
    }
    
    const testCustomer = customers[0];
    const { error: insertError } = await supabase
      .from('points_transactions')
      .insert({
        customer_id: testCustomer.id,
        points_change: 25,
        transaction_type: 'earned',
        reason: 'Test points earning after fix',
        created_by: 'test-system',
        metadata: { test: true, timestamp: new Date().toISOString() }
      });
    
    if (insertError) {
      console.log('❌ Points transaction insertion failed:', insertError.message);
      return false;
    }
    console.log('✅ Points transaction insertion successful');
    
    // Test 3: Verify the transaction was created
    console.log('\n3️⃣ Verifying transaction creation...');
    const { data: createdTransaction, error: fetchError } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('reason', 'Test points earning after fix')
      .single();
    
    if (fetchError || !createdTransaction) {
      console.log('❌ Could not fetch created transaction:', fetchError?.message);
      return false;
    }
    
    console.log('✅ Transaction created successfully:');
    console.log(`   - Customer ID: ${createdTransaction.customer_id}`);
    console.log(`   - Points Change: ${createdTransaction.points_change}`);
    console.log(`   - Type: ${createdTransaction.transaction_type}`);
    console.log(`   - Reason: ${createdTransaction.reason}`);
    console.log(`   - Created By: ${createdTransaction.created_by}`);
    
    // Test 4: Test updating customer points
    console.log('\n4️⃣ Testing customer points update...');
    const { data: customerBefore } = await supabase
      .from('customers')
      .select('points')
      .eq('id', testCustomer.id)
      .single();
    
    const currentPoints = customerBefore?.points || 0;
    const newPoints = currentPoints + 25;
    
    const { error: updateError } = await supabase
      .from('customers')
      .update({ points: newPoints })
      .eq('id', testCustomer.id);
    
    if (updateError) {
      console.log('❌ Customer points update failed:', updateError.message);
      return false;
    }
    
    // Verify the update
    const { data: customerAfter } = await supabase
      .from('customers')
      .select('points')
      .eq('id', testCustomer.id)
      .single();
    
    if (customerAfter?.points !== newPoints) {
      console.log('❌ Customer points update verification failed');
      return false;
    }
    
    console.log('✅ Customer points update successful');
    console.log(`   - Points before: ${currentPoints}`);
    console.log(`   - Points after: ${customerAfter.points}`);
    
    // Clean up test data
    console.log('\n5️⃣ Cleaning up test data...');
    await supabase
      .from('points_transactions')
      .delete()
      .eq('reason', 'Test points earning after fix');
    
    await supabase
      .from('customers')
      .update({ points: currentPoints })
      .eq('id', testCustomer.id);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All points system tests passed!');
    console.log('\n✅ The points system is now fully functional!');
    console.log('\n💡 You can now:');
    console.log('   - Add/subtract points for customers');
    console.log('   - View points transaction history');
    console.log('   - Use points for loyalty rewards');
    console.log('   - Track points earned from purchases');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing points system:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing points system after structure fix...');
  
  const systemWorking = await testPointsAfterFix();
  
  if (systemWorking) {
    console.log('\n🎉 Points system is fully operational!');
  } else {
    console.log('\n⚠️ Points system still has issues');
    console.log('💡 Make sure you applied the SQL migration in Supabase Dashboard');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
