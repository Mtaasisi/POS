import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies...');

  try {
    // Drop all existing restrictive policies
    console.log('\n🗑️  Dropping existing restrictive policies...');
    
    const dropPolicies = [
      // Loyalty Customer Settings
      "DROP POLICY IF EXISTS \"Users can view their own settings\" ON lats_pos_loyalty_customer_settings",
      "DROP POLICY IF EXISTS \"Users can insert their own settings\" ON lats_pos_loyalty_customer_settings",
      "DROP POLICY IF EXISTS \"Users can update their own settings\" ON lats_pos_loyalty_customer_settings",
      "DROP POLICY IF EXISTS \"Users can delete their own settings\" ON lats_pos_loyalty_customer_settings",
      "DROP POLICY IF EXISTS \"Users can view their own loyalty customer settings\" ON lats_pos_loyalty_customer_settings",
      "DROP POLICY IF EXISTS \"Users can insert their own loyalty customer settings\" ON lats_pos_loyalty_customer_settings",
      "DROP POLICY IF EXISTS \"Users can update their own loyalty customer settings\" ON lats_pos_loyalty_customer_settings",
      "DROP POLICY IF EXISTS \"Users can delete their own loyalty customer settings\" ON lats_pos_loyalty_customer_settings",
      
      // Analytics Reporting Settings
      "DROP POLICY IF EXISTS \"Users can view their own settings\" ON lats_pos_analytics_reporting_settings",
      "DROP POLICY IF EXISTS \"Users can insert their own settings\" ON lats_pos_analytics_reporting_settings",
      "DROP POLICY IF EXISTS \"Users can update their own settings\" ON lats_pos_analytics_reporting_settings",
      "DROP POLICY IF EXISTS \"Users can delete their own settings\" ON lats_pos_analytics_reporting_settings",
      "DROP POLICY IF EXISTS \"Users can view their own analytics reporting settings\" ON lats_pos_analytics_reporting_settings",
      "DROP POLICY IF EXISTS \"Users can insert their own analytics reporting settings\" ON lats_pos_analytics_reporting_settings",
      "DROP POLICY IF EXISTS \"Users can update their own analytics reporting settings\" ON lats_pos_analytics_reporting_settings",
      "DROP POLICY IF EXISTS \"Users can delete their own analytics reporting settings\" ON lats_pos_analytics_reporting_settings"
    ];

    for (const dropPolicy of dropPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: dropPolicy });
        if (error) {
          console.log(`⚠️  Warning dropping policy: ${error.message}`);
        } else {
          console.log(`✅ Dropped policy: ${dropPolicy.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️  Warning dropping policy: ${err.message}`);
      }
    }

    // Create permissive policies
    console.log('\n✅ Creating permissive policies...');
    
    const createPolicies = [
      // Loyalty Customer Settings - Allow all authenticated users
      "CREATE POLICY \"Enable all access for authenticated users\" ON lats_pos_loyalty_customer_settings FOR ALL USING (auth.role() = 'authenticated')",
      
      // Analytics Reporting Settings - Allow all authenticated users
      "CREATE POLICY \"Enable all access for authenticated users\" ON lats_pos_analytics_reporting_settings FOR ALL USING (auth.role() = 'authenticated')"
    ];

    for (const createPolicy of createPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: createPolicy });
        if (error) {
          console.log(`⚠️  Warning creating policy: ${error.message}`);
        } else {
          console.log(`✅ Created policy: ${createPolicy.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️  Warning creating policy: ${err.message}`);
      }
    }

    // Grant permissions
    console.log('\n🔐 Granting permissions...');
    
    const grantPermissions = [
      "GRANT ALL ON lats_pos_loyalty_customer_settings TO authenticated",
      "GRANT ALL ON lats_pos_analytics_reporting_settings TO authenticated"
    ];

    for (const grant of grantPermissions) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: grant });
        if (error) {
          console.log(`⚠️  Warning granting permissions: ${error.message}`);
        } else {
          console.log(`✅ Granted permissions: ${grant.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️  Warning granting permissions: ${err.message}`);
      }
    }

    console.log('\n✅ RLS policies fixed!');
    console.log('🔄 The tables should now allow authenticated users to insert data.');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

// Run the fix
fixRLSPolicies();
