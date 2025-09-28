import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedQuery() {
  console.log('🔍 Testing fixed appointments query...');
  
  try {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('Today string:', todayString);

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        service_type,
        status,
        appointment_date,
        appointment_time,
        priority,
        notes,
        customers!inner(name, phone)
      `)
      .eq('appointment_date', todayString)
      .order('appointment_time', { ascending: true })
      .limit(4);

    if (error) {
      console.log('❌ Fixed query failed:', error);
    } else {
      console.log('✅ Fixed query successful!');
      console.log('Appointments:', appointments);
      
      // Test the mapping
      const mappedAppointments = appointments?.map(appointment => ({
        id: appointment.id,
        type: appointment.service_type,
        status: appointment.status,
        scheduledTime: `${appointment.appointment_date}T${appointment.appointment_time}`,
        priority: appointment.priority,
        customerName: appointment.customers?.name || 'Unknown',
        customerPhone: appointment.customers?.phone || '',
        deviceName: 'No device',
        notes: appointment.notes || ''
      })) || [];
      
      console.log('Mapped appointments:', mappedAppointments);
    }
    
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }
}

testFixedQuery();
