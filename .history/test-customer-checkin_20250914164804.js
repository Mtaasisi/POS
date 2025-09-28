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

async function testCustomerCheckin() {
  try {
    console.log('🧪 Testing customer checkin functionality...');
    
    // Get a customer ID to test with
    console.log('🔍 Getting a customer for testing...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (customersError) {
      console.error('❌ Error fetching customers:', customersError);
      return;
    }
    
    if (!customers || customers.length === 0) {
      console.log('⚠️ No customers found in database');
      return;
    }
    
    const customer = customers[0];
    console.log(`✅ Found customer: ${customer.name} (${customer.id})`);
    
    // Get a staff/user ID to test with
    console.log('🔍 Getting a staff member for testing...');
    const { data: users, error: usersError } = await supabase
      .from('auth_users')
      .select('id, name')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ No users found in database');
      return;
    }
    
    const staff = users[0];
    console.log(`✅ Found staff: ${staff.name} (${staff.id})`);
    
    // Test the checkin insertion
    console.log('📝 Testing checkin insertion...');
    const { data: checkinData, error: checkinError } = await supabase
      .from('customer_checkins')
      .insert([{
        customer_id: customer.id,
        staff_id: staff.id,
        checkin_at: new Date().toISOString()
      }])
      .select();
    
    if (checkinError) {
      console.error('❌ Error inserting checkin:', checkinError);
      console.error('📋 Error details:', JSON.stringify(checkinError, null, 2));
      return;
    }
    
    console.log('✅ Checkin inserted successfully!');
    console.log('📊 Checkin data:', checkinData);
    
    // Clean up - delete the test record
    console.log('🧹 Cleaning up test record...');
    if (checkinData && checkinData.length > 0) {
      const { error: deleteError } = await supabase
        .from('customer_checkins')
        .delete()
        .eq('id', checkinData[0].id);
      
      if (deleteError) {
        console.warn('⚠️ Could not clean up test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testCustomerCheckin();
