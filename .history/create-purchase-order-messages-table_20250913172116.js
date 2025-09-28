import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  try {
    console.log('🚀 Creating purchase_order_messages table...');
    
    // First, let's try to query the table directly to see if it exists
    const { data: existingData, error: checkError } = await supabase
      .from('purchase_order_messages')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing tables:', checkError);
      return;
    }
    
    if (existingTables && existingTables.length > 0) {
      console.log('✅ Table purchase_order_messages already exists!');
      return;
    }
    
    console.log('📋 Table does not exist, creating it...');
    
    // Create the table using a simple approach
    // We'll use the Supabase client to insert a test record first to see if the table exists
    const testInsert = {
      purchase_order_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      sender: 'system',
      content: 'test',
      type: 'system'
    };
    
    const { data, error } = await supabase
      .from('purchase_order_messages')
      .insert(testInsert);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📋 Table does not exist, need to create it manually in Supabase dashboard');
        console.log('');
        console.log('🔧 Please run this SQL in your Supabase SQL Editor:');
        console.log('');
        console.log('-- Create purchase_order_messages table');
        console.log('CREATE TABLE IF NOT EXISTS purchase_order_messages (');
        console.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
        console.log('    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,');
        console.log('    sender TEXT NOT NULL,');
        console.log('    content TEXT NOT NULL,');
        console.log('    type TEXT NOT NULL CHECK (type IN (\'system\', \'user\', \'supplier\')),');
        console.log('    timestamp TIMESTAMPTZ DEFAULT NOW(),');
        console.log('    created_at TIMESTAMPTZ DEFAULT NOW()');
        console.log(');');
        console.log('');
        console.log('-- Add indexes');
        console.log('CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_order_id ON purchase_order_messages(purchase_order_id);');
        console.log('CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_timestamp ON purchase_order_messages(timestamp DESC);');
        console.log('CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_type ON purchase_order_messages(type);');
        console.log('');
        console.log('-- Enable RLS');
        console.log('ALTER TABLE purchase_order_messages ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('-- Create policies');
        console.log('CREATE POLICY "Users can view purchase order messages" ON purchase_order_messages');
        console.log('    FOR SELECT USING (');
        console.log('        EXISTS (');
        console.log('            SELECT 1 FROM lats_purchase_orders po');
        console.log('            WHERE po.id = purchase_order_messages.purchase_order_id');
        console.log('            AND po.created_by = auth.uid()');
        console.log('        )');
        console.log('    );');
        console.log('');
        console.log('CREATE POLICY "Users can create purchase order messages" ON purchase_order_messages');
        console.log('    FOR INSERT WITH CHECK (');
        console.log('        EXISTS (');
        console.log('            SELECT 1 FROM lats_purchase_orders po');
        console.log('            WHERE po.id = purchase_order_messages.purchase_order_id');
        console.log('            AND po.created_by = auth.uid()');
        console.log('        )');
        console.log('    );');
        console.log('');
        console.log('CREATE POLICY "Users can update purchase order messages" ON purchase_order_messages');
        console.log('    FOR UPDATE USING (');
        console.log('        EXISTS (');
        console.log('            SELECT 1 FROM lats_purchase_orders po');
        console.log('            WHERE po.id = purchase_order_messages.purchase_order_id');
        console.log('            AND po.created_by = auth.uid()');
        console.log('        )');
        console.log('    );');
        console.log('');
        console.log('CREATE POLICY "Users can delete purchase order messages" ON purchase_order_messages');
        console.log('    FOR DELETE USING (');
        console.log('        EXISTS (');
        console.log('            SELECT 1 FROM lats_purchase_orders po');
        console.log('            WHERE po.id = purchase_order_messages.purchase_order_id');
        console.log('            AND po.created_by = auth.uid()');
        console.log('        )');
        console.log('    );');
        console.log('');
        console.log('✅ After running the SQL above, the table will be created and your 404 error should be resolved!');
      } else {
        console.error('❌ Unexpected error:', error);
      }
    } else {
      console.log('✅ Table already exists and is accessible!');
      // Clean up the test record
      await supabase
        .from('purchase_order_messages')
        .delete()
        .eq('purchase_order_id', '00000000-0000-0000-0000-000000000000');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createTable();
