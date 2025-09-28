const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  try {
    console.log('🔄 Fixing RLS policies for purchase order payments...');
    
    // Test the current query that's failing
    console.log('🔍 Testing current query...');
    const { data: testData, error: testError } = await supabase
      .from('purchase_order_payments')
      .select(`
        *,
        lats_purchase_orders(
          order_number,
          total_amount,
          status,
          lats_suppliers(
            name,
            contact_person,
            phone,
            email
          )
        ),
        finance_accounts(name)
      `)
      .order('payment_date', { ascending: false })
      .limit(10);
    
    if (testError) {
      console.log('❌ Current query fails:', testError.message);
      console.log('🔧 Applying RLS policy fixes...');
      
      // Apply the fixes using direct SQL execution
      const fixes = [
        // Drop existing restrictive policies
        `DROP POLICY IF EXISTS "Users can view purchase order payments" ON purchase_order_payments;`,
        `DROP POLICY IF EXISTS "Users can create purchase order payments" ON purchase_order_payments;`,
        `DROP POLICY IF EXISTS "Users can update their purchase order payments" ON purchase_order_payments;`,
        `DROP POLICY IF EXISTS "Users can delete their own purchase order payments" ON purchase_order_payments;`,
        
        // Create permissive policies
        `CREATE POLICY "Enable all access for authenticated users" ON purchase_order_payments FOR ALL USING (auth.role() = 'authenticated');`,
        
        // Grant permissions
        `GRANT ALL ON purchase_order_payments TO authenticated;`,
        
        // Fix lats_purchase_orders policies
        `DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_purchase_orders;`,
        `CREATE POLICY "Enable all access for authenticated users" ON lats_purchase_orders FOR ALL USING (auth.role() = 'authenticated');`,
        `GRANT ALL ON lats_purchase_orders TO authenticated;`,
        
        // Fix lats_suppliers policies
        `DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_suppliers;`,
        `CREATE POLICY "Enable all access for authenticated users" ON lats_suppliers FOR ALL USING (auth.role() = 'authenticated');`,
        `GRANT ALL ON lats_suppliers TO authenticated;`
      ];
      
      for (const fix of fixes) {
        try {
          console.log('Executing:', fix.substring(0, 80) + '...');
          const { error } = await supabase.rpc('exec', { sql: fix });
          if (error) {
            console.log('⚠️ Warning:', error.message);
          } else {
            console.log('✅ Success');
          }
        } catch (err) {
          console.log('⚠️ Warning:', err.message);
        }
      }
      
      // Test the query again
      console.log('🔍 Testing query after fixes...');
      const { data: testData2, error: testError2 } = await supabase
        .from('purchase_order_payments')
        .select(`
          *,
          lats_purchase_orders(
            order_number,
            total_amount,
            status,
            lats_suppliers(
              name,
              contact_person,
              phone,
              email
            )
          ),
          finance_accounts(name)
        `)
        .order('payment_date', { ascending: false })
        .limit(10);
      
      if (testError2) {
        console.log('❌ Query still fails:', testError2.message);
      } else {
        console.log('✅ Query now works! Found', testData2?.length || 0, 'records');
      }
      
    } else {
      console.log('✅ Query already works! Found', testData?.length || 0, 'records');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixRLSPolicies();
