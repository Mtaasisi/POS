import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixRLSPoliciesSimple() {
  console.log('🔧 Fixing POS settings RLS policies (simple approach)...');

  try {
    // First, let's test if we can access the tables
    console.log('🔍 Testing table access...');
    
    const tables = [
      'lats_pos_search_filter_settings',
      'lats_pos_loyalty_customer_settings', 
      'lats_pos_analytics_reporting_settings'
    ];

    for (const table of tables) {
      console.log(`Testing access to ${table}...`);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`❌ Error accessing ${table}:`, error.message);
          
          // Try to create a default record to trigger table creation
          console.log(`🔄 Attempting to create default record for ${table}...`);
          
          const { error: insertError } = await supabase
            .from(table)
            .insert({
              user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
              business_id: null
            });

          if (insertError) {
            console.log(`❌ Could not create default record for ${table}:`, insertError.message);
          } else {
            console.log(`✅ Successfully created default record for ${table}`);
            
            // Clean up the dummy record
            await supabase
              .from(table)
              .delete()
              .eq('user_id', '00000000-0000-0000-0000-000000000000');
          }
        } else {
          console.log(`✅ Successfully accessed ${table}`);
        }
      } catch (err) {
        console.log(`💥 Exception accessing ${table}:`, err.message);
      }
    }

    // Now let's try to create some test records with a real user ID
    console.log('\n🔧 Creating test records...');
    
    // Get the current user (if any)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️ No authenticated user found, using dummy user ID');
      const testUserId = 'a15a9139-3be9-4028-b944-240caae9eeb2'; // From the logs
      
      for (const table of tables) {
        console.log(`Creating test record for ${table}...`);
        
        const { error } = await supabase
          .from(table)
          .insert({
            user_id: testUserId,
            business_id: null
          });

        if (error) {
          console.log(`❌ Error creating test record for ${table}:`, error.message);
        } else {
          console.log(`✅ Created test record for ${table}`);
        }
      }
    } else {
      console.log(`✅ Authenticated as user: ${user.id}`);
      
      for (const table of tables) {
        console.log(`Creating test record for ${table}...`);
        
        const { error } = await supabase
          .from(table)
          .insert({
            user_id: user.id,
            business_id: null
          });

        if (error) {
          console.log(`❌ Error creating test record for ${table}:`, error.message);
        } else {
          console.log(`✅ Created test record for ${table}`);
        }
      }
    }

    console.log('\n🎉 RLS policy test completed!');
    console.log('📋 If you see success messages above, the RLS policies are working correctly.');
    console.log('📋 If you see 406 errors, the policies need to be fixed via the Supabase dashboard.');

  } catch (error) {
    console.error('💥 Error testing RLS policies:', error);
  }
}

// Run the test
fixRLSPoliciesSimple();
