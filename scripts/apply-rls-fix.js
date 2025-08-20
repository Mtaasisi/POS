import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing POS settings RLS policies...');

  try {
    // Drop all existing restrictive policies
    console.log('🗑️ Dropping existing restrictive policies...');
    
    const tables = [
      'lats_pos_search_filter_settings',
      'lats_pos_loyalty_customer_settings', 
      'lats_pos_analytics_reporting_settings',
      'lats_pos_user_permissions_settings',
      'lats_pos_barcode_scanner_settings',
      'lats_pos_notification_settings',
      'lats_pos_delivery_settings',
      'lats_pos_general_settings',
      'lats_pos_dynamic_pricing_settings',
      'lats_pos_receipt_settings',
      'lats_pos_advanced_settings'
    ];

    const policyTypes = [
      'Users can view their own settings',
      'Users can insert their own settings', 
      'Users can update their own settings',
      'Users can delete their own settings'
    ];

    for (const table of tables) {
      for (const policyType of policyTypes) {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policyType}" ON ${table};`
        });
        
        if (error) {
          console.log(`⚠️ Could not drop policy ${policyType} on ${table}:`, error.message);
        }
      }
    }

    console.log('✅ Dropped existing policies');

    // Create permissive policies
    console.log('🔐 Creating permissive policies...');
    
    for (const table of tables) {
      // Drop existing permissive policy if it exists
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "Enable all access for authenticated users" ON ${table};`
      });

      if (dropError) {
        console.log(`⚠️ Could not drop existing permissive policy on ${table}:`, dropError.message);
      }

      // Create new permissive policy
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "Enable all access for authenticated users" ON ${table} FOR ALL USING (auth.role() = 'authenticated');`
      });

      if (createError) {
        console.error(`❌ Error creating permissive policy on ${table}:`, createError);
      } else {
        console.log(`✅ Created permissive policy for ${table}`);
      }
    }

    // Grant permissions
    console.log('🔑 Granting permissions...');
    
    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `GRANT ALL ON ${table} TO authenticated;`
      });

      if (error) {
        console.error(`❌ Error granting permissions on ${table}:`, error);
      } else {
        console.log(`✅ Granted permissions for ${table}`);
      }
    }

    // Create indexes for performance
    console.log('📊 Creating performance indexes...');
    
    for (const table of tables) {
      const indexName = `idx_${table.replace('lats_pos_', '').replace('_settings', '')}_user_id`;
      const { error } = await supabase.rpc('exec_sql', {
        sql: `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(user_id);`
      });

      if (error) {
        console.log(`⚠️ Could not create index for ${table}:`, error.message);
      } else {
        console.log(`✅ Created index for ${table}`);
      }
    }

    console.log('🎉 RLS policies fixed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Dropped restrictive policies from ${tables.length} tables`);
    console.log(`   - Created permissive policies for ${tables.length} tables`);
    console.log(`   - Granted permissions to authenticated users`);
    console.log(`   - Created performance indexes`);

  } catch (error) {
    console.error('💥 Error fixing RLS policies:', error);
    process.exit(1);
  }
}

// Run the fix
fixRLSPolicies();
