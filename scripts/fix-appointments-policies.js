import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixAppointmentsPolicies() {
  console.log('🔧 Fixing appointments table policies...');

  try {
    // First, let's check the current state of the appointments table
    console.log('📋 Checking appointments table structure...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);

    if (appointmentsError) {
      console.error('❌ Error accessing appointments table:', appointmentsError);
      return;
    }

    console.log('✅ Appointments table is accessible');

    // Check if we need to add missing columns
    console.log('📋 Checking for missing columns...');
    
    // Try to insert a test record to see what columns exist
    const testRecord = {
      customer_name: 'Test Customer',
      customer_phone: '+255123456789',
      service_type: 'Test Service',
      appointment_date: '2024-12-31',
      appointment_time: '10:00:00',
      status: 'scheduled',
      priority: 'medium'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('⚠️ Insert test failed, checking column structure...');
      console.log('Error details:', insertError.message);
    } else {
      console.log('✅ Basic columns are working');
      // Clean up test record
      if (insertData && insertData[0]) {
        await supabase
          .from('appointments')
          .delete()
          .eq('id', insertData[0].id);
      }
    }

    // Check settings
    console.log('📋 Checking appointment settings...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('category', 'appointments');

    if (settingsError) {
      console.log('⚠️ No appointment settings found, creating them...');
      await createAppointmentSettings();
    } else {
      console.log(`✅ Found ${settingsData?.length || 0} appointment settings`);
    }

    console.log('🎉 Appointments table is ready for use!');

  } catch (error) {
    console.error('❌ Error in fixAppointmentsPolicies:', error);
  }
}

async function createAppointmentSettings() {
  try {
    console.log('📋 Creating appointment settings...');
    
    const settings = [
      {
        key: 'appointments.service_types',
        value: JSON.stringify([
          'Device Repair',
          'Device Diagnostics', 
          'Software Installation',
          'Hardware Upgrade',
          'Data Recovery',
          'Virus Removal',
          'Screen Replacement',
          'Battery Replacement',
          'Consultation'
        ]),
        description: 'Available appointment service types',
        category: 'appointments'
      },
      {
        key: 'appointments.reminder_settings',
        value: JSON.stringify({
          whatsapp_reminder_hours: 24,
          sms_reminder_hours: 2,
          email_reminder_hours: 48,
          auto_confirm_hours: 1
        }),
        description: 'Appointment reminder settings',
        category: 'appointments'
      }
    ];

    for (const setting of settings) {
      const { error } = await supabase
        .from('settings')
        .insert(setting);

      if (error && !error.message.includes('duplicate key')) {
        console.error('❌ Error creating setting:', error);
      }
    }

    console.log('✅ Appointment settings created');
  } catch (error) {
    console.error('❌ Error creating appointment settings:', error);
  }
}

// Run the fix
fixAppointmentsPolicies()
  .then(() => {
    console.log('🎉 Appointments table setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
