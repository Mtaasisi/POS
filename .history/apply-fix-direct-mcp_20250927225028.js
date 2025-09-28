import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
// Using service role key for direct database operations
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY3NDk1MCwiZXhwIjoyMDUxMjUwOTUwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyFixDirectMCP() {
  console.log('🔧 APPLYING DIRECT FIX TO DATABASE USING MCP APPROACH...');
  console.log('=======================================================');
  
  try {
    // Read the final working SQL file
    const fs = await import('fs');
    const sqlContent = fs.readFileSync('./FINAL_WORKING_RPC_FUNCTIONS.sql', 'utf8');
    
    console.log('📝 SQL file loaded successfully');
    console.log(`📊 File size: ${sqlContent.length} characters`);
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('');
    
    // Execute statements in batches
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      if (statement.includes('DROP FUNCTION') || 
          statement.includes('CREATE OR REPLACE FUNCTION') || 
          statement.includes('GRANT EXECUTE')) {
        
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Try to execute via direct SQL call
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement 
          });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} warning: ${error.message}`);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} error: ${err.message}`);
          errorCount++;
        }
      } else if (statement.includes('SELECT') && statement.includes('Testing functions')) {
        // Skip test statements for now
        console.log(`⏭️  Skipping test statement ${i + 1}`);
      }
    }
    
    console.log('');
    console.log('📊 EXECUTION SUMMARY:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);
    
    // Now test the functions
    console.log('');
    console.log('🔍 TESTING FUNCTIONS AFTER APPLYING FIX...');
    
    // Get a real purchase order ID
    const { data: poData, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (poError || !poData || poData.length === 0) {
      console.log('❌ No purchase orders found for testing');
      return;
    }
    
    const testId = poData[0].id;
    console.log(`📝 Testing with purchase order ID: ${testId}`);
    
    // Test all three functions
    const tests = [
      {
        name: 'get_purchase_order_items_with_products',
        params: { purchase_order_id_param: testId }
      },
      {
        name: 'get_po_inventory_stats',
        params: { po_id: testId }
      },
      {
        name: 'get_received_items_for_po',
        params: { po_id: testId }
      }
    ];
    
    let allWorking = true;
    
    for (const test of tests) {
      console.log(`🔍 Testing ${test.name}...`);
      
      const { data, error } = await supabase.rpc(test.name, test.params);
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        allWorking = false;
      } else {
        console.log(`✅ ${test.name}: SUCCESS (${data?.length || 0} results)`);
      }
    }
    
    console.log('');
    if (allWorking) {
      console.log('🎉 SUCCESS! DIRECT MCP FIX APPLIED SUCCESSFULLY!');
      console.log('✅ All RPC functions are working correctly!');
      console.log('✅ Your 400 Bad Request errors should now be resolved!');
    } else {
      console.log('⚠️  Some functions still have issues.');
      console.log('🔧 The fix may need to be applied manually in Supabase SQL Editor');
    }
    
  } catch (error) {
    console.error('❌ Direct MCP fix failed:', error);
    console.log('🔧 Fallback: Please apply the FINAL_WORKING_RPC_FUNCTIONS.sql manually');
  }
}

// Run the direct fix
applyFixDirectMCP();
