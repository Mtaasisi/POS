import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixDatabaseIssues() {
  console.log('🔍 Checking and fixing database issues...\n');

  try {
    // 1. Test basic customers query first
    console.log('📋 Testing basic customers query...');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, phone, whatsapp, created_at, updated_at, total_spent, city, color_tag')
      .limit(5);

    if (customersError) {
      console.error('❌ Error querying customers:', customersError);
      return;
    } else {
      console.log(`✅ Basic customers query successful: ${customers?.length || 0} records found`);
      if (customers && customers.length > 0) {
        console.log('📄 Sample customer:', customers[0]);
      }
    }

    // 2. Test query with whatsapp_opt_out filter
    console.log('\n🧪 Testing query with whatsapp_opt_out filter...');
    
    try {
      const { data: filteredCustomers, error: filterError } = await supabase
        .from('customers')
        .select('id, name, phone, whatsapp, created_at, updated_at, total_spent, city, color_tag')
        .neq('whatsapp_opt_out', true)
        .limit(5);

      if (filterError) {
        console.error('❌ Error with whatsapp_opt_out filter:', filterError.message);
        console.log('⚠️  This suggests the whatsapp_opt_out column may not exist');
        
        // Try to add the column
        console.log('\n🔧 Attempting to add whatsapp_opt_out column...');
        
        // Use a simple SQL approach
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;'
        });

        if (sqlError) {
          console.error('❌ Error adding column via RPC:', sqlError);
          console.log('💡 You may need to run the migration manually in Supabase dashboard');
        } else {
          console.log('✅ whatsapp_opt_out column added successfully');
          
          // Test the query again
          const { data: retryCustomers, error: retryError } = await supabase
            .from('customers')
            .select('id, name, phone, whatsapp, created_at, updated_at, total_spent, city, color_tag')
            .neq('whatsapp_opt_out', true)
            .limit(5);

          if (retryError) {
            console.error('❌ Still getting error after adding column:', retryError.message);
          } else {
            console.log(`✅ Filtered query now works: ${retryCustomers?.length || 0} records found`);
          }
        }
      } else {
        console.log(`✅ Filtered query successful: ${filteredCustomers?.length || 0} records found`);
      }
    } catch (filterError) {
      console.error('❌ Error with whatsapp_opt_out filter:', filterError);
    }

    // 3. Check enhanced tables
    console.log('\n📋 Checking enhanced WhatsApp tables...');
    
    const enhancedTables = [
      'whatsapp_campaigns',
      'whatsapp_bulk_message_results',
      'whatsapp_escalations',
      'whatsapp_contact_preferences',
      'whatsapp_message_templates',
      'whatsapp_analytics_events'
    ];

    for (const tableName of enhancedTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: exists`);
      }
    }

    // 4. Test AI service rate limiting
    console.log('\n🤖 Testing AI service configuration...');
    
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.log('⚠️  VITE_GEMINI_API_KEY not found in environment variables');
    } else {
      console.log('✅ VITE_GEMINI_API_KEY is configured');
    }

    console.log('\n🎉 Database check complete!');
    console.log('\n📝 Summary of issues found:');
    console.log('1. ✅ Basic customers query works');
    console.log('2. ⚠️  whatsapp_opt_out column may need to be added');
    console.log('3. ⚠️  Some enhanced tables may be missing');
    console.log('4. ⚠️  AI service rate limiting may need adjustment');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndFixDatabaseIssues();
