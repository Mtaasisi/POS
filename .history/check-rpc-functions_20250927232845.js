import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRPCFunctions() {
  console.log('🔍 Checking available RPC functions...');
  
  try {
    // Get all functions from the database
    const { data: functions, error } = await supabase
      .rpc('get_functions')
      .select('*');
    
    if (error) {
      console.log('⚠️ Could not get functions via RPC, trying direct query...');
      
      // Try to get functions directly
      const { data: directFunctions, error: directError } = await supabase
        .from('pg_proc')
        .select('proname, proargnames')
        .like('proname', '%purchase%');
      
      if (directError) {
        console.error('❌ Error getting functions:', directError);
      } else {
        console.log('✅ Functions found:', directFunctions);
      }
    } else {
      console.log('✅ Functions found:', functions);
    }
    
    // Test if the functions exist by trying to call them
    console.log('\n🧪 Testing specific RPC functions...');
    
    const functionsToTest = [
      'get_purchase_order_items_with_products',
      'get_po_inventory_stats', 
      'get_received_items_for_po'
    ];
    
    for (const funcName of functionsToTest) {
      try {
        const { data, error } = await supabase.rpc(funcName, { po_id: 'test' });
        if (error) {
          console.log(`❌ ${funcName}: ${error.message}`);
        } else {
          console.log(`✅ ${funcName}: Available`);
        }
      } catch (err) {
        console.log(`❌ ${funcName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRPCFunctions();
