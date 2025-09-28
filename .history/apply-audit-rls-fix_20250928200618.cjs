const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFix() {
  try {
    console.log('🔧 Applying audit table RLS policy fix...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('FIX_AUDIT_RLS_POLICIES.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Use the SQL editor approach by making a direct request
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ sql: statement })
          });
          
          if (!response.ok) {
            console.log(`⚠️ Statement ${i + 1} warning:`, response.status, response.statusText);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️ Statement ${i + 1} warning:`, err.message);
        }
      }
    }
    
    console.log('✅ RLS policy fix applied!');
    
    // Test the fix
    console.log('🔍 Testing audit table insert after fix...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (ordersError || !orders || orders.length === 0) {
      console.log('⚠️ No purchase orders found for testing');
      return false;
    }
    
    const testOrderId = orders[0].id;
    
    // Test insert
    const { data, error } = await supabase
      .from('purchase_order_audit')
      .insert({
        purchase_order_id: testOrderId,
        action: 'test_action_fixed',
        details: { test: true, fixed: true },
        user_id: null,
        created_by: null,
        timestamp: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.log('❌ Audit table insert still failing:', error.message);
      return false;
    }
    
    console.log('✅ Audit table insert successful after fix!');
    
    // Clean up test record
    await supabase
      .from('purchase_order_audit')
      .delete()
      .eq('action', 'test_action_fixed');
    
    console.log('🎉 Audit table RLS fix completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error applying RLS fix:', error);
    return false;
  }
}

applyRLSFix().then(success => {
  if (success) {
    console.log('🎉 Audit table is now working correctly!');
  } else {
    console.log('💥 Audit table still has issues.');
    console.log('\n🔧 Please run the following SQL manually in your Supabase SQL editor:');
    console.log('https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/sql');
    console.log('\n' + '='.repeat(60));
    const sqlContent = fs.readFileSync('FIX_AUDIT_RLS_POLICIES.sql', 'utf8');
    console.log(sqlContent);
    console.log('\n' + '='.repeat(60));
  }
  process.exit(success ? 0 : 1);
});
