import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPaymentInsert() {
  console.log('🔍 Debugging customer_payments insert...\n');

  try {
    // Test with minimal required fields only
    console.log('1️⃣ Testing with minimal required fields:');
    const minimalData = {
      customer_id: '00000000-0000-0000-0000-000000000000',
      amount: 1000,
      method: 'cash',
      payment_type: 'payment'
    };

    console.log('📝 Minimal data:', minimalData);

    const { data: minimalResult, error: minimalError } = await supabase
      .from('customer_payments')
      .insert(minimalData)
      .select()
      .single();

    if (minimalError) {
      console.error('❌ Minimal insert failed:', minimalError);
    } else {
      console.log('✅ Minimal insert succeeded:', minimalResult);
      
      // Clean up
      await supabase.from('customer_payments').delete().eq('id', minimalResult.id);
    }

    console.log('\n2️⃣ Testing with all fields:');
    const fullData = {
      id: crypto.randomUUID(),
      customer_id: '00000000-0000-0000-0000-000000000000',
      device_id: null,
      amount: 1000,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed',
      payment_date: new Date().toISOString(),
      created_by: '00000000-0000-0000-0000-000000000000'
    };

    console.log('📝 Full data:', fullData);

    const { data: fullResult, error: fullError } = await supabase
      .from('customer_payments')
      .insert(fullData)
      .select()
      .single();

    if (fullError) {
      console.error('❌ Full insert failed:', fullError);
      console.error('Error details:', {
        message: fullError.message,
        details: fullError.details,
        hint: fullError.hint,
        code: fullError.code
      });
    } else {
      console.log('✅ Full insert succeeded:', fullResult);
      
      // Clean up
      await supabase.from('customer_payments').delete().eq('id', fullResult.id);
    }

    console.log('\n3️⃣ Testing with wrong field names (to confirm the issue):');
    const wrongData = {
      customer_id: '00000000-0000-0000-0000-000000000000',
      amount: 1000,
      payment_method: 'cash', // Wrong field name
      payment_type: 'payment'
    };

    console.log('📝 Wrong data:', wrongData);

    const { data: wrongResult, error: wrongError } = await supabase
      .from('customer_payments')
      .insert(wrongData)
      .select()
      .single();

    if (wrongError) {
      console.error('❌ Wrong field names failed (expected):', wrongError);
    } else {
      console.log('✅ Wrong field names succeeded (unexpected):', wrongResult);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug
debugPaymentInsert();
