import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCustomerIdIssue() {
  console.log('🔍 Debugging customer_id UUID issue...\n');

  try {
    // Check if there's a customer with this email
    console.log('1️⃣ Looking for customer with email: xamuelhance10@gmail.com');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email')
      .eq('email', 'xamuelhance10@gmail.com')
      .single();

    if (customerError) {
      console.error('❌ Customer not found:', customerError);
    } else {
      console.log('✅ Customer found:', customer);
      console.log('📋 Customer UUID:', customer.id);
    }

    // Test insert with correct UUID
    if (customer) {
      console.log('\n2️⃣ Testing insert with correct UUID...');
      const testData = {
        customer_id: customer.id, // Use the actual UUID
        amount: 1000,
        method: 'cash',
        payment_type: 'payment'
      };

      console.log('📝 Test data with correct UUID:', testData);

      const { data: insertData, error: insertError } = await supabase
        .from('customer_payments')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Insert with correct UUID failed:', insertError);
      } else {
        console.log('✅ Insert with correct UUID succeeded:', insertData);
        
        // Clean up
        await supabase.from('customer_payments').delete().eq('id', insertData.id);
        console.log('🧹 Test record cleaned up');
      }
    }

    // Test insert with email (should fail)
    console.log('\n3️⃣ Testing insert with email (should fail)...');
    const wrongData = {
      customer_id: 'xamuelhance10@gmail.com', // This should fail
      amount: 1000,
      method: 'cash',
      payment_type: 'payment'
    };

    console.log('📝 Test data with email:', wrongData);

    const { data: wrongResult, error: wrongError } = await supabase
      .from('customer_payments')
      .insert(wrongData)
      .select()
      .single();

    if (wrongError) {
      console.log('❌ Insert with email failed (expected):', wrongError.code, wrongError.message);
    } else {
      console.log('✅ Insert with email succeeded (unexpected):', wrongResult);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug
debugCustomerIdIssue();
