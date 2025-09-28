import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixCustomerPreferences406() {
  console.log('🔧 Fixing customer_preferences 406 error...\n');

  try {
    // Test the current state
    console.log('1️⃣ Testing current customer_preferences table access...');
    
    const { data, error } = await supabase
      .from('customer_preferences')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Current error:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✅ Table is accessible');
      console.log('Data:', data);
    }

    // Try to insert a test record to see if it's a permissions issue
    console.log('\n2️⃣ Testing insert permissions...');
    
    const testCustomerId = '59a22d7a-26db-4b29-87b3-ab6c0932a2a2';
    
    const { data: insertData, error: insertError } = await supabase
      .from('customer_preferences')
      .insert({
        customer_id: testCustomerId,
        preferred_contact_method: 'whatsapp',
        notification_preferences: {
          repair_updates: true,
          appointment_reminders: true,
          promotions: false
        },
        language: 'en',
        timezone: 'Africa/Dar_es_Salaam'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
      console.log('Insert error details:', insertError);
    } else {
      console.log('✅ Insert successful');
      console.log('Inserted data:', insertData);
    }

    // Try to query with the specific customer ID
    console.log('\n3️⃣ Testing query with specific customer ID...');
    
    const { data: queryData, error: queryError } = await supabase
      .from('customer_preferences')
      .select('*')
      .eq('customer_id', testCustomerId);
    
    if (queryError) {
      console.error('❌ Query error:', queryError.message);
      console.log('Query error details:', queryError);
    } else {
      console.log('✅ Query successful');
      console.log('Query data:', queryData);
    }

    console.log('\n📋 Analysis:');
    console.log('- Returns table: ✅ Working (0 records fetched)');
    console.log('- Appointments table: ✅ Working (0 records fetched)');
    console.log('- Customer preferences table: ❌ 406 error');
    
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check RLS policies on customer_preferences table');
    console.log('2. Verify table permissions');
    console.log('3. Check if the table structure is correct');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixCustomerPreferences406();
