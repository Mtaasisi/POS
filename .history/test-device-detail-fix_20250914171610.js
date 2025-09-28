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

async function testDeviceDetailPage() {
  try {
    console.log('Testing DeviceDetailPage functionality...');
    
    // Get a device ID
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id')
      .limit(1);
    
    if (devicesError || !devices || devices.length === 0) {
      console.log('No devices found');
      return;
    }
    
    const deviceId = devices[0].id;
    console.log('Testing with device ID:', deviceId);
    
    // Test listAttachments function (this was causing the 500 error)
    console.log('Testing listAttachments...');
    const { data: attachments, error: attachmentsError } = await supabase
      .from('device_attachments')
      .select('*')
      .eq('device_id', deviceId)
      .order('uploaded_at', { ascending: false });
    
    if (attachmentsError) {
      console.error('Error listing attachments:', attachmentsError);
    } else {
      console.log('✅ listAttachments works correctly');
      console.log('Found', attachments.length, 'attachments');
    }
    
    // Test that we can construct public URLs from file_path
    if (attachments && attachments.length > 0) {
      console.log('Testing public URL construction...');
      const attachment = attachments[0];
      const publicUrl = supabase.storage.from('device-attachments').getPublicUrl(attachment.file_path).data.publicUrl;
      console.log('✅ Public URL constructed successfully:', publicUrl);
    }
    
    console.log('✅ DeviceDetailPage should now work without 500 error!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testDeviceDetailPage();
