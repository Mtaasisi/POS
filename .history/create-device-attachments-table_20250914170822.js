const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDeviceAttachmentsTable() {
  try {
    console.log('Creating device_attachments table...');
    
    // First, let's check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('device_attachments')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('Table device_attachments already exists');
      return;
    }
    
    console.log('Table does not exist, creating it...');
    
    // Create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS device_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT DEFAULT 'other',
        file_size INTEGER,
        uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { data, error } = await supabase.rpc('exec', { sql: createTableSQL });
    
    if (error) {
      console.error('Error creating table:', error);
      return;
    }
    
    console.log('Table created successfully');
    
    // Create indexes
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_device_attachments_device_id ON device_attachments(device_id);
      CREATE INDEX IF NOT EXISTS idx_device_attachments_uploaded_by ON device_attachments(uploaded_by);
      CREATE INDEX IF NOT EXISTS idx_device_attachments_created_at ON device_attachments(created_at);
      CREATE INDEX IF NOT EXISTS idx_device_attachments_file_type ON device_attachments(file_type);
    `;
    
    const { error: indexError } = await supabase.rpc('exec', { sql: createIndexesSQL });
    
    if (indexError) {
      console.error('Error creating indexes:', indexError);
    } else {
      console.log('Indexes created successfully');
    }
    
    // Enable RLS
    const enableRLSSQL = `ALTER TABLE device_attachments ENABLE ROW LEVEL SECURITY;`;
    const { error: rlsError } = await supabase.rpc('exec', { sql: enableRLSSQL });
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    } else {
      console.log('RLS enabled successfully');
    }
    
    // Create policy
    const createPolicySQL = `
      CREATE POLICY "Enable all access for authenticated users" ON device_attachments
        FOR ALL USING (auth.role() = 'authenticated');
    `;
    
    const { error: policyError } = await supabase.rpc('exec', { sql: createPolicySQL });
    
    if (policyError) {
      console.error('Error creating policy:', policyError);
    } else {
      console.log('Policy created successfully');
    }
    
    console.log('Device attachments table setup completed successfully!');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

createDeviceAttachmentsTable();
