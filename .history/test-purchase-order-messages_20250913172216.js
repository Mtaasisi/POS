import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTable() {
  try {
    console.log('🧪 Testing purchase_order_messages table access...');
    
    // Test 1: Try to select from the table
    console.log('1️⃣ Testing SELECT query...');
    const { data: selectData, error: selectError } = await supabase
      .from('purchase_order_messages')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ SELECT failed:', selectError);
    } else {
      console.log('✅ SELECT successful:', selectData);
    }
    
    // Test 2: Try to insert a test record
    console.log('2️⃣ Testing INSERT query...');
    const testMessage = {
      purchase_order_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      sender: 'system',
      content: 'Test message',
      type: 'system'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('purchase_order_messages')
      .insert(testMessage)
      .select();
    
    if (insertError) {
      console.error('❌ INSERT failed:', insertError);
    } else {
      console.log('✅ INSERT successful:', insertData);
      
      // Clean up the test record
      if (insertData && insertData[0]) {
        const { error: deleteError } = await supabase
          .from('purchase_order_messages')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error('⚠️ Cleanup failed:', deleteError);
        } else {
          console.log('✅ Test record cleaned up');
        }
      }
    }
    
    // Test 3: Check table structure
    console.log('3️⃣ Testing table structure...');
    const { data: structureData, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'purchase_order_messages' });
    
    if (structureError) {
      console.log('⚠️ Could not get table structure (this is normal):', structureError.message);
    } else {
      console.log('✅ Table structure:', structureData);
    }
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testTable();
