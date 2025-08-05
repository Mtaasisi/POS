import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function testCustomerUpdateDebug() {
  try {
    const customerId = 'c4aa2553-c004-464e-8b14-dea85379a89d';
    console.log(`🔍 Testing customer update debug: ${customerId}`);
    
    // Get current customer data
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching customer:', fetchError);
      return;
    }
    
    console.log('📋 Current customer data:');
    console.log(JSON.stringify(customer, null, 2));
    
    // Test with the exact fields that might be causing issues
    const testUpdates = [
      // Test 1: Minimal update
      { updated_at: new Date().toISOString() },
      
      // Test 2: Name update
      { name: customer.name, updated_at: new Date().toISOString() },
      
      // Test 3: Phone update
      { phone: customer.phone, updated_at: new Date().toISOString() },
      
      // Test 4: Multiple fields
      { 
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        updated_at: new Date().toISOString()
      },
      
      // Test 5: All possible fields that might be sent
      {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        gender: customer.gender,
        city: customer.city,
        joined_date: customer.joined_date,
        loyalty_level: customer.loyalty_level,
        color_tag: customer.color_tag,
        referred_by: customer.referred_by,
        total_spent: customer.total_spent,
        points: customer.points,
        last_visit: customer.last_visit,
        is_active: customer.is_active,
        whatsapp: customer.whatsapp,
        referral_source: customer.referral_source,
        birth_month: customer.birth_month,
        birth_day: customer.birth_day,
        initial_notes: customer.initial_notes,
        updated_at: new Date().toISOString()
      }
    ];
    
    for (let i = 0; i < testUpdates.length; i++) {
      const update = testUpdates[i];
      console.log(`\n🧪 Test ${i + 1}: Updating with ${Object.keys(update).length} fields`);
      console.log('Update data:', JSON.stringify(update, null, 2));
      
      const { data: updateData, error: updateError } = await supabase
        .from('customers')
        .update(update)
        .eq('id', customerId)
        .select();
      
      if (updateError) {
        console.error(`❌ Test ${i + 1} failed:`, updateError);
        console.error('Error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
      } else {
        console.log(`✅ Test ${i + 1} successful`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCustomerUpdateDebug(); 