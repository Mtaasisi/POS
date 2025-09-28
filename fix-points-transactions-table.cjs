const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPointsTransactionsTable() {
  try {
    console.log('🔧 Fixing points_transactions table structure...');
    
    // First, let's check the current table structure
    console.log('\n1️⃣ Checking current table structure...');
    const { data: tableInfo, error: infoError } = await supabase
      .from('points_transactions')
      .select('*')
      .limit(1);
    
    if (infoError) {
      console.log('❌ Cannot access table:', infoError.message);
      return false;
    }
    
    console.log('✅ Table accessible');
    
    // Try to insert a test record to see what columns are missing
    console.log('\n2️⃣ Testing table structure with minimal insert...');
    const { error: minimalError } = await supabase
      .from('points_transactions')
      .insert({
        customer_id: '00000000-0000-0000-0000-000000000000',
        points_change: 0,
        transaction_type: 'adjusted',
        reason: 'Structure test'
      });
    
    if (minimalError) {
      console.log('❌ Minimal insert failed:', minimalError.message);
      console.log('💡 This suggests the table structure is incomplete');
      
      // Let's try to create the table with the correct structure
      console.log('\n3️⃣ Attempting to recreate table with correct structure...');
      
      // Since we can't execute DDL directly, let's provide instructions
      console.log('\n📋 Manual fix required:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Run the following SQL:');
      console.log(`
-- Drop and recreate points_transactions table with correct structure
DROP TABLE IF EXISTS points_transactions CASCADE;

CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'adjusted', 'redeemed', 'expired')),
    reason TEXT NOT NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    created_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX idx_points_transactions_customer_id ON points_transactions(customer_id);
CREATE INDEX idx_points_transactions_transaction_type ON points_transactions(transaction_type);
CREATE INDEX idx_points_transactions_created_at ON points_transactions(created_at);

-- Enable RLS
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view points transactions" ON points_transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert points transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON points_transactions TO authenticated;
GRANT ALL ON points_transactions TO anon;
      `);
      
      return false;
    }
    
    console.log('✅ Table structure test passed');
    
    // Clean up test record
    await supabase
      .from('points_transactions')
      .delete()
      .eq('reason', 'Structure test');
    
    // Test with all required columns
    console.log('\n4️⃣ Testing with all required columns...');
    const { error: fullError } = await supabase
      .from('points_transactions')
      .insert({
        customer_id: '00000000-0000-0000-0000-000000000000',
        points_change: 10,
        transaction_type: 'adjusted',
        reason: 'Full structure test',
        device_id: null,
        created_by: 'test-system',
        metadata: { test: true }
      });
    
    if (fullError) {
      console.log('❌ Full structure test failed:', fullError.message);
      return false;
    }
    
    console.log('✅ All required columns present');
    
    // Clean up test record
    await supabase
      .from('points_transactions')
      .delete()
      .eq('reason', 'Full structure test');
    
    console.log('\n🎉 points_transactions table structure is correct!');
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing table:', error);
    return false;
  }
}

async function testPointsAfterFix() {
  try {
    console.log('\n🧪 Testing points system after fix...');
    
    // Test inserting a real points transaction
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (customers && customers.length > 0) {
      const customer = customers[0];
      
      const { error: insertError } = await supabase
        .from('points_transactions')
        .insert({
          customer_id: customer.id,
          points_change: 15,
          transaction_type: 'earned',
          reason: 'Test points earning',
          created_by: 'test-system',
          metadata: { test: true }
        });
      
      if (insertError) {
        console.log('❌ Points transaction test failed:', insertError.message);
        return false;
      }
      
      console.log('✅ Points transaction creation successful');
      
      // Clean up
      await supabase
        .from('points_transactions')
        .delete()
        .eq('reason', 'Test points earning');
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error testing points:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting points_transactions table fix...');
  
  const tableFixed = await fixPointsTransactionsTable();
  
  if (tableFixed) {
    const systemWorking = await testPointsAfterFix();
    
    if (systemWorking) {
      console.log('\n🎉 Points system is fully functional!');
    } else {
      console.log('\n⚠️ Table structure is correct but functionality test failed');
    }
  } else {
    console.log('\n💥 Table fix failed - manual intervention required');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
