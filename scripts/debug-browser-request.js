import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBrowserRequest() {
  console.log('🔍 Debugging what might be causing the browser 400 error...\n');

  try {
    // Test various scenarios that might be happening in the browser
    
    console.log('1️⃣ Testing with old field names (should fail with column not found):');
    const oldFieldData = {
      customer_id: '40e2d46f-a9db-4b89-9040-f9ed60ca9228',
      amount: 1000,
      payment_method: 'cash', // Old field name
      payment_type: 'payment'
    };

    const { data: oldResult, error: oldError } = await supabase
      .from('customer_payments')
      .insert(oldFieldData)
      .select()
      .single();

    if (oldError) {
      console.log('❌ Old field names failed (expected):', oldError.code, oldError.message);
    } else {
      console.log('✅ Old field names succeeded (unexpected):', oldResult);
    }

    console.log('\n2️⃣ Testing with correct field names:');
    const correctData = {
      customer_id: '40e2d46f-a9db-4b89-9040-f9ed60ca9228',
      amount: 1000,
      method: 'cash', // Correct field name
      payment_type: 'payment'
    };

    const { data: correctResult, error: correctError } = await supabase
      .from('customer_payments')
      .insert(correctData)
      .select()
      .single();

    if (correctError) {
      console.log('❌ Correct field names failed:', correctError.code, correctError.message);
    } else {
      console.log('✅ Correct field names succeeded:', correctResult);
      
      // Clean up
      await supabase.from('customer_payments').delete().eq('id', correctResult.id);
      console.log('🧹 Test record cleaned up');
    }

    console.log('\n3️⃣ Testing with extra fields that might be causing issues:');
    const extraFieldsData = {
      customer_id: '40e2d46f-a9db-4b89-9040-f9ed60ca9228',
      amount: 1000,
      method: 'cash',
      payment_type: 'payment',
      payment_account_id: 'some-id', // Extra field
      reference: 'some-ref', // Extra field
      notes: 'some notes', // Extra field
      source: 'repair_payment' // Extra field
    };

    const { data: extraResult, error: extraError } = await supabase
      .from('customer_payments')
      .insert(extraFieldsData)
      .select()
      .single();

    if (extraError) {
      console.log('❌ Extra fields failed:', extraError.code, extraError.message);
    } else {
      console.log('✅ Extra fields succeeded:', extraResult);
      
      // Clean up
      await supabase.from('customer_payments').delete().eq('id', extraResult.id);
      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug
debugBrowserRequest();
