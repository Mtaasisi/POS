import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppointmentsQuery() {
  console.log('🔍 Testing appointments table...');
  
  try {
    // First, let's check if the table exists by doing a simple select
    console.log('1. Testing basic table access...');
    const { data: basicData, error: basicError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.log('❌ Basic query failed:', basicError);
      return;
    }
    
    console.log('✅ Basic query successful, sample data:', basicData);
    
    // Now let's test the problematic query step by step
    console.log('\n2. Testing the exact failing query...');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('Date range:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_type,
        status,
        scheduled_date,
        priority,
        notes,
        customers!inner(name, phone),
        devices(brand, model)
      `)
      .gte('scheduled_date', startOfDay.toISOString())
      .lt('scheduled_date', endOfDay.toISOString())
      .order('scheduled_date', { ascending: true })
      .limit(4);

    if (error) {
      console.log('❌ Complex query failed:', error);
      
      // Let's try without the joins
      console.log('\n3. Testing without joins...');
      const { data: simpleData, error: simpleError } = await supabase
        .from('appointments')
        .select('id, appointment_type, status, scheduled_date, priority, notes')
        .gte('scheduled_date', startOfDay.toISOString())
        .lt('scheduled_date', endOfDay.toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(4);
      
      if (simpleError) {
        console.log('❌ Simple query also failed:', simpleError);
      } else {
        console.log('✅ Simple query successful:', simpleData);
      }
    } else {
      console.log('✅ Complex query successful:', appointments);
    }
    
  } catch (error) {
    console.log('❌ Exception occurred:', error.message);
  }
}

testAppointmentsQuery();
