import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAttachmentsAPI() {
  try {
    console.log('Testing attachments API with correct schema...');
    
    // First, let's get a real device ID
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id')
      .limit(1);
    
    if (devicesError || !devices || devices.length === 0) {
      console.log('No devices found, creating a test device...');
      // Create a test device
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
      
      if (customerError || !customer || customer.length === 0) {
        console.log('No customers found, cannot create test device');
        return;
      }
      
      const { data: newDevice, error: deviceError } = await supabase
        .from('devices')
        .insert({
          customer_id: customer[0].id,
          brand: 'Test Brand',
          model: 'Test Model',
          issue_description: 'Test issue',
          expected_return_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (deviceError) {
        console.error('Error creating test device:', deviceError);
        return;
      }
      
      console.log('Created test device:', newDevice.id);
      
      // Test listAttachments
      console.log('Testing listAttachments...');
      const { data: attachments, error: listError } = await supabase
        .from('device_attachments')
        .select('*')
        .eq('device_id', newDevice.id)
        .order('uploaded_at', { ascending: false });
      
      if (listError) {
        console.error('Error listing attachments:', listError);
      } else {
        console.log('Successfully listed attachments:', attachments);
      }
      
    } else {
      console.log('Found device:', devices[0].id);
      
      // Test listAttachments
      console.log('Testing listAttachments...');
      const { data: attachments, error: listError } = await supabase
        .from('device_attachments')
        .select('*')
        .eq('device_id', devices[0].id)
        .order('uploaded_at', { ascending: false });
      
      if (listError) {
        console.error('Error listing attachments:', listError);
      } else {
        console.log('Successfully listed attachments:', attachments);
      }
    }
    
    console.log('Attachments API test completed successfully!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testAttachmentsAPI();
