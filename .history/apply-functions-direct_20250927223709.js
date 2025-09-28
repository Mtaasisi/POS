import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
// Using service role key for admin operations
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY3NDk1MCwiZXhwIjoyMDUxMjUwOTUwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyFunctionsDirectly() {
  console.log('🔧 Applying RPC functions directly to database...');
  
  try {
    // Read the SQL file
    const fs = await import('fs');
    const sqlContent = fs.readFileSync('./APPLY_ALL_RPC_FUNCTIONS.sql', 'utf8');
    
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
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement 
          });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} warning: ${error.message}`);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} error: ${err.message}`);
        }
      } else if (statement.includes('GRANT EXECUTE')) {
        console.log(`📝 Executing GRANT statement ${i + 1}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement 
          });
          
          if (error) {
            console.log(`⚠️  GRANT statement warning: ${error.message}`);
          } else {
            console.log(`✅ GRANT statement executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  GRANT statement error: ${err.message}`);
        }
      }
    }
    
    // Verify functions exist
    console.log('🔍 Verifying functions exist...');
    const { data: functions, error: verifyError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .in('routine_name', [
        'get_purchase_order_items_with_products',
        'get_po_inventory_stats',
        'get_received_items_for_po'
      ])
      .eq('routine_schema', 'public');
    
    if (verifyError) {
      console.log('⚠️  Could not verify functions:', verifyError.message);
    } else {
      console.log('✅ Functions verification:');
      console.log(`   - get_purchase_order_items_with_products: ${functions?.find(f => f.routine_name === 'get_purchase_order_items_with_products') ? '✅' : '❌'}`);
      console.log(`   - get_po_inventory_stats: ${functions?.find(f => f.routine_name === 'get_po_inventory_stats') ? '✅' : '❌'}`);
      console.log(`   - get_received_items_for_po: ${functions?.find(f => f.routine_name === 'get_received_items_for_po') ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Error applying functions:', error);
  }
}

// Run the script
applyFunctionsDirectly();
