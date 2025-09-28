import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function testConnection() {
  console.log('🔍 Testing database connection and checking existing functions...');
  
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('lats_products')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Connection test failed:', connectionError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check if functions exist
    console.log('🔍 Checking for existing RPC functions...');
    
    const functionNames = [
      'get_purchase_order_items_with_products',
      'get_po_inventory_stats', 
      'get_received_items_for_po'
    ];
    
    for (const functionName of functionNames) {
      try {
        // Try to call the function to see if it exists
        const { data, error } = await supabase.rpc(functionName, { 
          purchase_order_id_param: '00000000-0000-0000-0000-000000000000',
          po_id: '00000000-0000-0000-0000-000000000000'
        });
        
        if (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log(`❌ Function ${functionName} does not exist`);
          } else {
            console.log(`⚠️  Function ${functionName} exists but has parameter issues: ${error.message}`);
          }
        } else {
          console.log(`✅ Function ${functionName} exists and is callable`);
        }
      } catch (err) {
        console.log(`❌ Function ${functionName} does not exist or has issues: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testConnection();
