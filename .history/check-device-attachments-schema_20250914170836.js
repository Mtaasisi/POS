const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  try {
    console.log('Checking device_attachments table schema...');
    
    // Try to get table information using information_schema
    const { data, error } = await supabase
      .rpc('exec', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'device_attachments' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.error('Error checking schema:', error);
      
      // Try a simpler approach - just try to select from the table
      console.log('Trying to select from device_attachments table...');
      const { data: testData, error: testError } = await supabase
        .from('device_attachments')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('Table access error:', testError);
      } else {
        console.log('Table exists and is accessible');
        console.log('Sample data structure:', testData);
      }
    } else {
      console.log('Table schema:');
      console.table(data);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkTableSchema();
