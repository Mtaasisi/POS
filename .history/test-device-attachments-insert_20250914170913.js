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

async function testInsert() {
  try {
    console.log('Testing insert with different column names...');
    
    // Test with the columns from the API code
    const testData1 = {
      device_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      file_name: 'test.txt',
      file_url: 'https://example.com/test.txt',
      uploaded_by: '00000000-0000-0000-0000-000000000000', // dummy UUID
      type: 'other'
    };
    
    console.log('Trying insert with API columns...');
    const { data: data1, error: error1 } = await supabase
      .from('device_attachments')
      .insert(testData1)
      .select();
    
    if (error1) {
      console.log('Error with API columns:', error1.message);
    } else {
      console.log('Success with API columns:', data1);
    }
    
    // Test with the columns from the database types
    const testData2 = {
      device_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      filename: 'test.txt',
      file_path: 'test/test.txt',
      file_size: 1024,
      mime_type: 'text/plain',
      uploaded_by: '00000000-0000-0000-0000-000000000000' // dummy UUID
    };
    
    console.log('Trying insert with database types columns...');
    const { data: data2, error: error2 } = await supabase
      .from('device_attachments')
      .insert(testData2)
      .select();
    
    if (error2) {
      console.log('Error with database types columns:', error2.message);
    } else {
      console.log('Success with database types columns:', data2);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testInsert();
