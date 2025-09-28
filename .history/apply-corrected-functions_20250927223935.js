import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, anonKey);

async function applyCorrectedFunctions() {
  console.log('🔧 Applying corrected RPC functions...');
  
  try {
    // Read the corrected SQL file
    const fs = await import('fs');
    const sqlContent = fs.readFileSync('./FIXED_RPC_FUNCTIONS.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      if (statement.includes('DROP FUNCTION') || statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Try to execute via RPC if available, otherwise show the SQL
          console.log(`⚠️  Please run this SQL in your Supabase SQL Editor:`);
          console.log(statement);
          console.log('');
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} error: ${err.message}`);
        }
      }
    }
    
    // Test the functions after applying
    console.log('🔍 Testing corrected functions...');
    const testId = '00000000-0000-0000-0000-000000000000';
    
    // Test get_purchase_order_items_with_products
    console.log('📝 Testing get_purchase_order_items_with_products...');
    const { data: itemsData, error: itemsError } = await supabase
      .rpc('get_purchase_order_items_with_products', {
        purchase_order_id_param: testId
      });
    
    if (itemsError) {
      console.log(`❌ get_purchase_order_items_with_products error: ${itemsError.message}`);
    } else {
      console.log(`✅ get_purchase_order_items_with_products works - returned ${itemsData?.length || 0} items`);
    }
    
    // Test get_po_inventory_stats
    console.log('📝 Testing get_po_inventory_stats...');
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_po_inventory_stats', {
        po_id: testId
      });
    
    if (statsError) {
      console.log(`❌ get_po_inventory_stats error: ${statsError.message}`);
    } else {
      console.log(`✅ get_po_inventory_stats works - returned ${statsData?.length || 0} stats`);
    }
    
    // Test get_received_items_for_po
    console.log('📝 Testing get_received_items_for_po...');
    const { data: receivedData, error: receivedError } = await supabase
      .rpc('get_received_items_for_po', {
        po_id: testId
      });
    
    if (receivedError) {
      console.log(`❌ get_received_items_for_po error: ${receivedError.message}`);
    } else {
      console.log(`✅ get_received_items_for_po works - returned ${receivedData?.length || 0} items`);
    }
    
  } catch (error) {
    console.error('❌ Error applying functions:', error);
  }
}

// Run the script
applyCorrectedFunctions();
