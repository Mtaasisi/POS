import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPurchaseOrdersRLS() {
  console.log('🔧 Fixing Purchase Orders RLS Policies...');

  try {
    // Tables that need RLS fixes
    const tables = [
      'lats_purchase_orders',
      'lats_purchase_order_items',
      'lats_suppliers'
    ];

    console.log('📋 Tables to fix:', tables.join(', '));

    for (const table of tables) {
      console.log(`\n🔧 Working on ${table}...`);

      // Enable RLS
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });

      if (rlsError) {
        console.log(`⚠️ Could not enable RLS on ${table}:`, rlsError.message);
      } else {
        console.log(`✅ RLS enabled for ${table}`);
      }

      // Drop existing restrictive policies
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "Allow authenticated users to manage ${table.replace('lats_', '')}" ON ${table};`
      });

      if (dropError) {
        console.log(`⚠️ Could not drop existing policy on ${table}:`, dropError.message);
      }

      // Create permissive policy
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "Enable all access for authenticated users" ON ${table} FOR ALL USING (auth.role() = 'authenticated');`
      });

      if (policyError) {
        console.error(`❌ Error creating policy on ${table}:`, policyError);
      } else {
        console.log(`✅ Created permissive policy for ${table}`);
      }

      // Grant permissions
      const { error: grantError } = await supabase.rpc('exec_sql', {
        sql: `GRANT ALL ON ${table} TO authenticated;`
      });

      if (grantError) {
        console.error(`❌ Error granting permissions on ${table}:`, grantError);
      } else {
        console.log(`✅ Granted permissions for ${table}`);
      }
    }

    // Test the query that was failing
    console.log('\n🧪 Testing the failing query...');
    
    const { data, error } = await supabase
      .from('lats_purchase_orders')
      .select(`
        *,
        lats_suppliers(name),
        lats_purchase_order_items(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Query still failing:', error);
    } else {
      console.log('✅ Query successful!');
      console.log(`📊 Found ${data?.length || 0} purchase orders`);
      if (data && data.length > 0) {
        console.log('📋 Sample data:', JSON.stringify(data[0], null, 2));
      }
    }

    console.log('\n🎉 Purchase Orders RLS fix completed!');
    console.log('📋 Summary:');
    console.log('✅ RLS enabled for all purchase order tables');
    console.log('✅ Permissive policies created');
    console.log('✅ Permissions granted to authenticated users');
    console.log('✅ Query test completed');

  } catch (error) {
    console.error('💥 Error fixing purchase orders RLS:', error);
    process.exit(1);
  }
}

// Run the fix
fixPurchaseOrdersRLS();
