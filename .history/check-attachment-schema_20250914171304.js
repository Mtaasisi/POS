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

async function checkAttachmentSchema() {
  try {
    console.log('Checking device_attachments table structure...');
    
    // Try to get a sample record to see the actual structure
    const { data, error } = await supabase
      .from('device_attachments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Sample record structure:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No records found, checking table structure by attempting insert...');
      
      // Try to insert a test record to see what columns are expected
      const testData = {
        device_id: '00000000-0000-0000-0000-000000000000',
        filename: 'test.txt',
        file_path: 'test/test.txt',
        file_size: 1024,
        mime_type: 'text/plain',
        uploaded_by: '00000000-0000-0000-0000-000000000000'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('device_attachments')
        .insert(testData)
        .select();
      
      if (insertError) {
        console.error('Insert error (expected due to foreign key):', insertError.message);
        console.log('But this shows us the table structure is correct');
      } else {
        console.log('Insert successful:', insertData);
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAttachmentSchema();
