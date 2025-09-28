import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointmentsSchema() {
  console.log('🔍 Checking appointments table schema...');
  
  try {
    // Try to get sample data to understand the structure
    console.log('📊 Getting sample data to understand structure...');
    const { data: sample, error: sampleError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.log('❌ Error getting sample data:', sampleError);
      
      // Try to get any data at all
      console.log('\n🔍 Trying to get any data from appointments...');
      const { data: anyData, error: anyError } = await supabase
        .from('appointments')
        .select('*');
      
      if (anyError) {
        console.log('❌ Error getting any data:', anyError);
      } else {
        console.log('✅ Got data:', anyData);
      }
    } else {
      console.log('✅ Sample appointments:', sample);
      if (sample && sample.length > 0) {
        console.log('📋 Available columns:', Object.keys(sample[0]));
      }
    }
    
    // Try different column names that might exist
    console.log('\n🔍 Testing different column names...');
    const possibleColumns = [
      'id', 'customer_id', 'service_type', 'appointment_date', 'appointment_time',
      'status', 'technician_id', 'notes', 'duration_minutes', 'priority',
      'created_at', 'updated_at', 'scheduled_date', 'appointment_type'
    ];
    
    for (const col of possibleColumns) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(col)
          .limit(1);
        
        if (!error) {
          console.log(`✅ Column '${col}' exists`);
        } else {
          console.log(`❌ Column '${col}' does not exist:`, error.message);
        }
      } catch (e) {
        console.log(`❌ Column '${col}' error:`, e.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

checkAppointmentsSchema();