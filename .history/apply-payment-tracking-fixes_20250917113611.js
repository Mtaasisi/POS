// Apply payment tracking fixes
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

async function applyPaymentTrackingFixes() {
  try {
    console.log('🔄 Applying payment tracking fixes...');
    
    // Read the SQL fix
    const sql = fs.readFileSync('fix-payment-tracking-missing-components.sql', 'utf8');
    
    // Split into individual statements and execute
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (statement.trim() && !statement.trim().startsWith('--')) {
        console.log('⚡ Executing SQL statement...');
        
        // Try to execute the statement
        try {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement.trim() 
          });
          
          if (error) {
            console.log('❌ Error:', error.message);
            errorCount++;
          } else {
            console.log('✅ Statement executed successfully');
            successCount++;
          }
        } catch (err) {
          console.log('❌ Exception:', err.message);
          errorCount++;
        }
      }
    }
    
    console.log(`🎉 Payment tracking fixes applied! Success: ${successCount}, Errors: ${errorCount}`);
    
    // Test the functions
    console.log('\n🧪 Testing the RPC functions...');
    
    const testFunctions = [
      { name: 'get_total_revenue_summary', params: {} },
      { name: 'get_monthly_payment_trends', params: { months_back: 6 } },
      { name: 'get_payment_method_analytics', params: {} },
      { name: 'get_currency_usage_stats', params: {} },
      { name: 'get_daily_payment_breakdown', params: { days_back: 7 } },
      { name: 'get_payment_status_analytics', params: {} },
      { name: 'get_top_customers_by_payments', params: { limit_count: 5 } },
      { name: 'get_payment_trends_by_hour', params: { days_back: 3 } },
      { name: 'get_failed_payment_analysis', params: {} }
    ];
    
    for (const testFunc of testFunctions) {
      try {
        const { data, error } = await supabase.rpc(testFunc.name, testFunc.params);
        
        if (error) {
          console.log(`❌ ${testFunc.name} failed:`, error.message);
        } else {
          console.log(`✅ ${testFunc.name} passed:`, Array.isArray(data) ? `${data.length} results` : 'Success');
        }
      } catch (err) {
        console.log(`❌ ${testFunc.name} exception:`, err.message);
      }
    }
    
    // Test table access
    console.log('\n🧪 Testing table access...');
    
    const testTables = ['device_payments', 'repair_payments'];
    
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        
        if (error) {
          console.log(`❌ ${tableName} access failed:`, error.message);
        } else {
          console.log(`✅ ${tableName} access passed:`, `${data.length} records found`);
        }
      } catch (err) {
        console.log(`❌ ${tableName} exception:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error.message);
  }
}

applyPaymentTrackingFixes();
