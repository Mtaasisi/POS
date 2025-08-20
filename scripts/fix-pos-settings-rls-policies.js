import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client with anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixPOSSettingsRLSPolicies() {
  console.log('🚀 Fixing POS Settings RLS Policies...');
  
  try {
    // First, let's authenticate to get a valid session
    console.log('🔐 Authenticating...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    if (!authData.session) {
      console.log('⚠️ No active session found');
      console.log('💡 The 406 errors might be due to authentication issues');
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('👤 User ID:', authData.session.user.id);
    
    // Test accessing each table with the authenticated user
    const tables = [
      'lats_pos_barcode_scanner_settings',
      'lats_pos_search_filter_settings',
      'lats_pos_user_permissions_settings',
      'lats_pos_loyalty_customer_settings',
      'lats_pos_analytics_reporting_settings',
      'lats_pos_notification_settings'
    ];
    
    const userId = authData.session.user.id;
    
    for (const table of tables) {
      console.log(`🔍 Testing access to ${table}...`);
      
      try {
        // Try to select from the table
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .limit(1);
        
        if (error) {
          console.log(`❌ Error accessing ${table}:`, error.message);
          
          // If it's a 406 error, it might be an RLS policy issue
          if (error.message.includes('406') || error.message.includes('Not Acceptable')) {
            console.log(`💡 406 error detected for ${table} - likely RLS policy issue`);
            
            // Try to insert a default record to see if that works
            console.log(`🔄 Attempting to create default record for ${table}...`);
            
            const defaultRecord = {
              user_id: userId,
              business_id: null
            };
            
            const { data: insertData, error: insertError } = await supabase
              .from(table)
              .insert(defaultRecord)
              .select();
            
            if (insertError) {
              console.log(`❌ Insert failed for ${table}:`, insertError.message);
            } else {
              console.log(`✅ Successfully created default record for ${table}`);
            }
          }
        } else {
          console.log(`✅ Successfully accessed ${table}`);
          if (data && data.length > 0) {
            console.log(`📊 Found ${data.length} existing records`);
          } else {
            console.log(`📊 No existing records found, creating default...`);
            
            // Create a default record
            const defaultRecord = {
              user_id: userId,
              business_id: null
            };
            
            const { data: insertData, error: insertError } = await supabase
              .from(table)
              .insert(defaultRecord)
              .select();
            
            if (insertError) {
              console.log(`❌ Failed to create default record for ${table}:`, insertError.message);
            } else {
              console.log(`✅ Created default record for ${table}`);
            }
          }
        }
      } catch (err) {
        console.error(`💥 Exception testing ${table}:`, err.message);
      }
    }
    
    console.log('🎉 RLS policy testing completed!');
    
  } catch (error) {
    console.error('💥 Error fixing RLS policies:', error);
  }
}

// Run the fix
fixPOSSettingsRLSPolicies();
