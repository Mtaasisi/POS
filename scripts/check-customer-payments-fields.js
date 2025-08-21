import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCustomerPaymentsFields() {
  console.log('🔍 Checking customer_payments table field names...\n');

  try {
    // Get a sample record to see the actual field names
    const { data: samplePayment, error: sampleError } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error fetching sample payment:', sampleError);
      return;
    }
    
    if (samplePayment && samplePayment.length > 0) {
      console.log('📋 Customer payments fields:');
      const fields = Object.keys(samplePayment[0]);
      fields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field}`);
      });
      
      console.log('\n📊 Sample payment data:');
      console.log(JSON.stringify(samplePayment[0], null, 2));
    } else {
      console.log('ℹ️ No customer payments found');
    }

    // Check if there are any customer_payments records
    const { count, error: countError } = await supabase
      .from('customer_payments')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting payments:', countError);
    } else {
      console.log(`\n📈 Total customer payments: ${count}`);
    }

    // Test the specific fields that might be causing issues
    console.log('\n🧪 Testing specific field queries...');
    
    // Test 1: Check if 'method' field exists
    const { data: methodTest, error: methodError } = await supabase
      .from('customer_payments')
      .select('method')
      .limit(1);
    
    if (methodError) {
      console.error('❌ Error querying method field:', methodError);
    } else {
      console.log('✅ method field is accessible');
    }

    // Test 2: Check if 'payment_method' field exists (this might be the issue)
    const { data: paymentMethodTest, error: paymentMethodError } = await supabase
      .from('customer_payments')
      .select('payment_method')
      .limit(1);
    
    if (paymentMethodError) {
      console.log('❌ payment_method field does not exist (this is expected)');
    } else {
      console.log('⚠️ payment_method field exists (this might be unexpected)');
    }

    // Test 3: Check if 'device_id' field exists
    const { data: deviceIdTest, error: deviceIdError } = await supabase
      .from('customer_payments')
      .select('device_id')
      .limit(1);
    
    if (deviceIdError) {
      console.error('❌ Error querying device_id field:', deviceIdError);
    } else {
      console.log('✅ device_id field is accessible');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the check
checkCustomerPaymentsFields().then(() => {
  console.log('\n🏁 Field check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Field check failed:', error);
  process.exit(1);
});
