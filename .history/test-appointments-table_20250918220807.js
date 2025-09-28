// Browser console script to test appointments table
// Copy and paste this into your browser console while on your app

async function testAppointmentsTable() {
  console.log('🧪 Testing appointments table structure...');
  
  try {
    // Get the supabase client from the app
    const supabase = window.supabase || window.__supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found. Make sure you are on your app page.');
      return false;
    }

    // Test if we can insert an appointment with the expected fields
    console.log('🔄 Testing appointment insertion...');
    
    const testAppointment = {
      customer_id: '00000000-0000-0000-0000-000000000001', // This will fail due to foreign key, but that's expected
      service_type: 'repair',
      appointment_date: '2024-02-01',
      appointment_time: '10:00:00',
      duration_minutes: 60,
      priority: 'medium',
      status: 'pending'
    };
    
    const { error: testError } = await supabase
      .from('appointments')
      .insert(testAppointment);
    
    if (testError && testError.code === 'PGRST116') {
      console.log('❌ Appointments table is missing required columns');
      console.log('💡 You need to run this SQL in the Supabase SQL editor:');
      console.log(`
-- Copy and paste this SQL into your Supabase SQL editor:

-- Add missing columns to match application expectations
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS appointment_date DATE,
ADD COLUMN IF NOT EXISTS appointment_time TIME,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Update existing data to populate new fields from existing fields
UPDATE appointments 
SET 
  service_type = appointment_type,
  appointment_date = scheduled_date::DATE,
  appointment_time = '09:00:00'::TIME,
  duration_minutes = estimated_duration
WHERE service_type IS NULL;

-- Make the new fields NOT NULL after populating them
ALTER TABLE appointments 
ALTER COLUMN service_type SET NOT NULL,
ALTER COLUMN appointment_date SET NOT NULL,
ALTER COLUMN appointment_time SET NOT NULL;

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_appointments_service_type ON appointments(service_type);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_time ON appointments(appointment_time);

-- Update the status constraint to match application expectations
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show'));

-- Update default status to match application expectations
ALTER TABLE appointments 
ALTER COLUMN status SET DEFAULT 'pending';
      `);
      return false;
    } else if (testError && testError.code === '23503') {
      console.log('✅ Appointments table structure is correct (foreign key constraint working as expected)');
      return true;
    } else if (testError) {
      console.error('❌ Unexpected test error:', testError);
      console.log('Error details:', testError);
      return false;
    } else {
      console.log('✅ Appointments table structure is correct and test insert successful');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the function
testAppointmentsTable().then(success => {
  if (success) {
    console.log('🎉 Appointments table is working correctly!');
  } else {
    console.log('💥 Appointments table needs to be fixed manually.');
  }
});
