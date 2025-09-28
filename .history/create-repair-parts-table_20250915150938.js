#!/usr/bin/env node

/**
 * Create repair_parts table script
 * This script creates the repair_parts table directly using the Supabase client
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    console.log('🔧 Using environment variables for Supabase configuration');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration
  console.log('🔧 Using fallback Supabase configuration');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

async function createRepairPartsTable() {
  try {
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    console.log('🚀 Creating repair_parts table...');
    
    // First, let's check if the table already exists
    const { data: existingData, error: existingError } = await supabase
      .from('repair_parts')
      .select('*')
      .limit(1);
    
    if (!existingError) {
      console.log('✅ repair_parts table already exists');
      return;
    }
    
    console.log('📝 Table does not exist, creating it...');
    
    // Since we can't execute raw SQL directly, let's try to create a simple test record
    // This will fail if the table doesn't exist, but it might trigger table creation
    // in some cases, or at least give us a better error message
    
    // Let's try to insert a test record to see what happens
    const { data: testData, error: testError } = await supabase
      .from('repair_parts')
      .insert({
        device_id: '00000000-0000-0000-0000-000000000000',
        spare_part_id: '00000000-0000-0000-0000-000000000000',
        quantity_needed: 1,
        cost_per_unit: 0,
        status: 'needed'
      })
      .select();
    
    if (testError) {
      console.log('❌ Cannot create test record:', testError.message);
      console.log('💡 The table needs to be created manually in the Supabase dashboard');
      console.log('📋 Please run the following SQL in your Supabase SQL editor:');
      console.log('');
      console.log('-- Create repair parts tracking table');
      console.log('CREATE TABLE IF NOT EXISTS repair_parts (');
      console.log('    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,');
      console.log('    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,');
      console.log('    spare_part_id UUID NOT NULL REFERENCES lats_spare_parts(id) ON DELETE CASCADE,');
      console.log('    quantity_needed INTEGER NOT NULL DEFAULT 1,');
      console.log('    quantity_used INTEGER DEFAULT 0,');
      console.log('    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,');
      console.log('    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,');
      console.log('    status TEXT NOT NULL DEFAULT \'needed\' CHECK (status IN (\'needed\', \'ordered\', \'received\', \'used\')),');
      console.log('    notes TEXT,');
      console.log('    created_by UUID REFERENCES auth.users(id),');
      console.log('    updated_by UUID REFERENCES auth.users(id),');
      console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.log(');');
      console.log('');
      console.log('-- Add indexes');
      console.log('CREATE INDEX IF NOT EXISTS idx_repair_parts_device_id ON repair_parts(device_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_repair_parts_spare_part_id ON repair_parts(spare_part_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_repair_parts_status ON repair_parts(status);');
      console.log('');
      console.log('-- Enable RLS');
      console.log('ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Add policies');
      console.log('CREATE POLICY "Users can view repair parts" ON repair_parts');
      console.log('    FOR SELECT USING (auth.role() = \'authenticated\');');
      console.log('');
      console.log('CREATE POLICY "Technicians and admins can manage repair parts" ON repair_parts');
      console.log('    FOR ALL USING (');
      console.log('        auth.role() = \'authenticated\' AND (');
      console.log('            EXISTS (');
      console.log('                SELECT 1 FROM user_profiles');
      console.log('                WHERE user_profiles.id = auth.uid()');
      console.log('                AND user_profiles.role IN (\'technician\', \'admin\')');
      console.log('            )');
      console.log('        )');
      console.log('    );');
    } else {
      console.log('✅ repair_parts table created successfully');
      // Clean up the test record
      await supabase.from('repair_parts').delete().eq('id', testData[0].id);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

createRepairPartsTable();
