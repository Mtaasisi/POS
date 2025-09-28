// Apply payment function fix
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPaymentFix() {
  try {
    console.log('🔄 Applying payment function fix...');
    
    // Read the SQL fix
    const sql = fs.readFileSync('fix-payment-function.sql', 'utf8');
    
    // Split into individual statements and execute
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('⚡ Executing SQL statement...');
        
        // Try to execute the statement
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement.trim() 
          });
          
          if (error) {
            console.log('❌ Error:', error.message);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (err) {
          console.log('❌ Exception:', err.message);
        }
      }
    }
    
    console.log('🎉 Payment function fix applied!');
    
    // Test the function
    console.log('\n🧪 Testing the fixed function...');
    const { data, error } = await supabase.rpc('process_purchase_order_payment', {
      purchase_order_id_param: '3c1681e3-0acb-4f19-9266-e544544a15b6',
      payment_account_id_param: 'deb92580-95dd-4018-9f6a-134b2157716c',
      amount_param: 2370,
      currency_param: 'CNY',
      payment_method_param: 'Cash',
      payment_method_id_param: null,
      user_id_param: '00000000-0000-0000-0000-000000000000',
      reference_param: null,
      notes_param: null
    });
    
    if (error) {
      console.log('❌ Test failed:', error.message);
    } else {
      console.log('✅ Test passed:', data);
    }
    
  } catch (error) {
    console.error('❌ Error applying fix:', error.message);
  }
}

applyPaymentFix();
