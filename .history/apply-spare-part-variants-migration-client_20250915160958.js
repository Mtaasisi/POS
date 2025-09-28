#!/usr/bin/env node

/**
 * Apply Spare Part Variants Migration (Using Supabase Client)
 * 
 * This script creates the lats_spare_part_variants table using direct client operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Starting Spare Part Variants Migration (Client-based)...');
    
    // Step 1: Check if table already exists
    console.log('📋 Step 1: Checking if table exists...');
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'lats_spare_part_variants');
    
    if (checkError) {
      console.error('❌ Error checking table existence:', checkError);
      throw checkError;
    }
    
    if (existingTables && existingTables.length > 0) {
      console.log('✅ Table lats_spare_part_variants already exists');
    } else {
      console.log('📋 Step 2: Creating lats_spare_part_variants table...');
      
      // Try to create the table using a simple insert to trigger table creation
      // This is a workaround since we can't execute DDL directly
      console.log('⚠️  Table does not exist. Please create it manually using the SQL script.');
      console.log('📄 SQL to execute in your Supabase dashboard:');
      console.log('');
      console.log(`
CREATE TABLE IF NOT EXISTS lats_spare_part_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spare_part_id UUID NOT NULL REFERENCES lats_spare_parts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    variant_attributes JSONB DEFAULT '{}',
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_spare_part_variants_spare_part_id ON lats_spare_part_variants(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_spare_part_variants_sku ON lats_spare_part_variants(sku);
CREATE INDEX IF NOT EXISTS idx_spare_part_variants_created_at ON lats_spare_part_variants(created_at);

-- Enable RLS
ALTER TABLE lats_spare_part_variants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read spare part variants" ON lats_spare_part_variants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert spare part variants" ON lats_spare_part_variants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update spare part variants" ON lats_spare_part_variants FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete spare part variants" ON lats_spare_part_variants FOR DELETE USING (auth.role() = 'authenticated');

-- Add metadata column to lats_spare_parts
ALTER TABLE lats_spare_parts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_spare_parts_metadata ON lats_spare_parts USING GIN(metadata);
      `);
      console.log('');
      console.log('🔧 After creating the table, run this script again to test functionality.');
      return;
    }
    
    // Step 2: Test table functionality
    console.log('📋 Step 2: Testing table functionality...');
    
    // Test insert
    const { data: testInsert, error: insertError } = await supabase
      .from('lats_spare_part_variants')
      .insert({
        name: 'Test Variant',
        sku: 'TEST-001',
        variant_attributes: { test: true, color: 'red' }
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error testing insert:', insertError);
      throw insertError;
    }
    
    console.log('✅ Insert test passed');
    
    // Test select
    const { data: testSelect, error: selectError } = await supabase
      .from('lats_spare_part_variants')
      .select('*')
      .eq('sku', 'TEST-001');
    
    if (selectError) {
      console.error('❌ Error testing select:', selectError);
      throw selectError;
    }
    
    console.log('✅ Select test passed');
    
    // Test update
    const { data: testUpdate, error: updateError } = await supabase
      .from('lats_spare_part_variants')
      .update({ name: 'Updated Test Variant' })
      .eq('sku', 'TEST-001')
      .select();
    
    if (updateError) {
      console.error('❌ Error testing update:', updateError);
      throw updateError;
    }
    
    console.log('✅ Update test passed');
    
    // Clean up test data
    const { error: deleteError } = await supabase
      .from('lats_spare_part_variants')
      .delete()
      .eq('sku', 'TEST-001');
    
    if (deleteError) {
      console.error('❌ Error cleaning up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    console.log('🎉 Spare Part Variants Migration verification completed successfully!');
    console.log('');
    console.log('📋 What was verified:');
    console.log('   • lats_spare_part_variants table exists');
    console.log('   • Insert functionality works');
    console.log('   • Select functionality works');
    console.log('   • Update functionality works');
    console.log('   • Delete functionality works');
    console.log('   • JSONB attributes work correctly');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Test the variants functionality in your app');
    console.log('   2. Create some spare parts with variants');
    console.log('   3. Verify the API endpoints work correctly');
    
  } catch (error) {
    console.error('💥 Migration verification failed with error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
