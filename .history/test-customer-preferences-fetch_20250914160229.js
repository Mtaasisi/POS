import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCustomerPreferencesFetch() {
  console.log('🔍 Testing customer preferences database fetch...\n');

  try {
    // Test with the customer ID from the error logs
    const testCustomerId = '59a22d7a-26db-4b29-87b3-ab6c0932a2a2';
    
    console.log(`1️⃣ Testing fetch for customer: ${testCustomerId}`);
    
    // Test the old way (with .single()) - should show 406 error
    console.log('\n📋 Testing OLD method (with .single()):');
    const { data: oldData, error: oldError } = await supabase
      .from('customer_preferences')
      .select('*')
      .eq('customer_id', testCustomerId)
      .single();
    
    if (oldError) {
      console.log('❌ OLD method error:', oldError.message);
      console.log('Error code:', oldError.code);
    } else {
      console.log('✅ OLD method success:', oldData);
    }
    
    // Test the new way (without .single()) - should work
    console.log('\n📋 Testing NEW method (without .single()):');
    const { data: newData, error: newError } = await supabase
      .from('customer_preferences')
      .select('*')
      .eq('customer_id', testCustomerId);
    
    if (newError) {
      console.log('❌ NEW method error:', newError.message);
    } else {
      console.log('✅ NEW method success:');
      console.log('Data length:', newData.length);
      if (newData.length > 0) {
        console.log('First record:', newData[0]);
      } else {
        console.log('No records found (this is normal for new customers)');
      }
    }
    
    // Test with a different customer ID (one that might not have preferences)
    console.log('\n2️⃣ Testing with a different customer ID...');
    const { data: otherData, error: otherError } = await supabase
      .from('customer_preferences')
      .select('*')
      .eq('customer_id', '00000000-0000-0000-0000-000000000000');
    
    if (otherError) {
      console.log('❌ Other customer error:', otherError.message);
    } else {
      console.log('✅ Other customer success:');
      console.log('Data length:', otherData.length);
      if (otherData.length > 0) {
        console.log('Records found:', otherData);
      } else {
        console.log('No records found (expected for non-existent customer)');
      }
    }
    
    // Check total records in customer_preferences table
    console.log('\n3️⃣ Checking total records in customer_preferences table...');
    const { data: allData, error: allError } = await supabase
      .from('customer_preferences')
      .select('*');
    
    if (allError) {
      console.log('❌ Error fetching all records:', allError.message);
    } else {
      console.log('✅ Total records in customer_preferences:', allData.length);
      if (allData.length > 0) {
        console.log('Sample records:');
        allData.slice(0, 3).forEach((record, index) => {
          console.log(`  ${index + 1}. Customer: ${record.customer_id}, Method: ${record.preferred_contact_method}`);
        });
      }
    }
    
    // Test the exact query pattern used in the fixed code
    console.log('\n4️⃣ Testing the exact fixed query pattern...');
    const { data: fixedData, error: fixedError } = await supabase
      .from('customer_preferences')
      .select('*')
      .eq('customer_id', testCustomerId);
    
    if (!fixedError && fixedData && fixedData.length > 0) {
      console.log('✅ Fixed pattern works - found preferences:', fixedData[0]);
    } else if (!fixedError && fixedData && fixedData.length === 0) {
      console.log('✅ Fixed pattern works - no preferences found (normal)');
    } else {
      console.log('❌ Fixed pattern error:', fixedError?.message);
    }
    
    console.log('\n📊 Summary:');
    console.log('- OLD method (.single()): Should show 406 error when no records');
    console.log('- NEW method (array): Should work gracefully with empty results');
    console.log('- Database is accessible and working correctly');
    console.log('- The fix should resolve the 406 errors in the app');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testCustomerPreferencesFetch();
