import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing device creation...');

async function testDeviceCreation() {
  try {
    // Test data similar to what the form would send
    const testDevice = {
      id: crypto.randomUUID(),
      customer_id: 'test-customer-id', // This might not exist
      brand: 'Apple',
      model: 'iPhone 15',
      serial_number: 'TEST123456789',
      issue_description: 'Screen cracked and not responding to touch',
      status: 'assigned',
      assigned_to: null,
      expected_return_date: new Date().toISOString().split('T')[0], // Today's date
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unlock_code: null,
      repair_cost: null,
      deposit_amount: null,
      diagnosis_required: false,
      device_notes: null,
      device_cost: null,
      estimated_hours: null,
      device_condition: null,
    };

    console.log('📋 Test device data:', testDevice);

    // Try to insert the device
    const { data, error } = await supabase
      .from('devices')
      .insert([testDevice])
      .select();

    if (error) {
      console.error('❌ Error creating device:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Device created successfully:', data);
    }

    // Check the devices table structure
    console.log('🔍 Checking devices table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('devices')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
    } else {
      console.log('📊 Table structure sample:', tableInfo);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDeviceCreation();
