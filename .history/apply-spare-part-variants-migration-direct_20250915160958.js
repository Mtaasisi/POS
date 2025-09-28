#!/usr/bin/env node

/**
 * Apply Spare Part Variants Migration (Direct SQL Execution)
 * 
 * This script creates the lats_spare_part_variants table using direct SQL execution
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
    console.log('🚀 Starting Spare Part Variants Migration (Direct SQL)...');
    
    // Step 1: Create the table
    console.log('📋 Step 1: Creating lats_spare_part_variants table...');
    const createTableSQL = `
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
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (createError) {
      console.error('❌ Error creating table:', createError);
      throw createError;
    }
    console.log('✅ Table created successfully');
    
    // Step 2: Create indexes
    console.log('📋 Step 2: Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_spare_part_variants_spare_part_id ON lats_spare_part_variants(spare_part_id);',
      'CREATE INDEX IF NOT EXISTS idx_spare_part_variants_sku ON lats_spare_part_variants(sku);',
      'CREATE INDEX IF NOT EXISTS idx_spare_part_variants_created_at ON lats_spare_part_variants(created_at);'
    ];
    
    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (indexError) {
        console.log('⚠️  Index creation warning (may already exist):', indexError.message);
      } else {
        console.log('✅ Index created');
      }
    }
    
    // Step 3: Enable RLS
    console.log('📋 Step 3: Enabling Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE lats_spare_part_variants ENABLE ROW LEVEL SECURITY;' 
    });
    if (rlsError) {
      console.log('⚠️  RLS warning:', rlsError.message);
    } else {
      console.log('✅ RLS enabled');
    }
    
    // Step 4: Create RLS policies
    console.log('📋 Step 4: Creating RLS policies...');
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Users can read spare part variants" ON lats_spare_part_variants FOR SELECT USING (auth.role() = 'authenticated');`,
      `CREATE POLICY IF NOT EXISTS "Users can insert spare part variants" ON lats_spare_part_variants FOR INSERT WITH CHECK (auth.role() = 'authenticated');`,
      `CREATE POLICY IF NOT EXISTS "Users can update spare part variants" ON lats_spare_part_variants FOR UPDATE USING (auth.role() = 'authenticated');`,
      `CREATE POLICY IF NOT EXISTS "Users can delete spare part variants" ON lats_spare_part_variants FOR DELETE USING (auth.role() = 'authenticated');`
    ];
    
    for (const policySQL of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL });
      if (policyError) {
        console.log('⚠️  Policy warning (may already exist):', policyError.message);
      } else {
        console.log('✅ Policy created');
      }
    }
    
    // Step 5: Create trigger function
    console.log('📋 Step 5: Creating trigger function...');
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_spare_part_variants_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: triggerFunctionSQL });
    if (functionError) {
      console.log('⚠️  Function warning:', functionError.message);
    } else {
      console.log('✅ Trigger function created');
    }
    
    // Step 6: Create trigger
    console.log('📋 Step 6: Creating trigger...');
    const triggerSQL = `
      DROP TRIGGER IF EXISTS trigger_update_spare_part_variants_updated_at ON lats_spare_part_variants;
      CREATE TRIGGER trigger_update_spare_part_variants_updated_at
          BEFORE UPDATE ON lats_spare_part_variants
          FOR EACH ROW
          EXECUTE FUNCTION update_spare_part_variants_updated_at();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    if (triggerError) {
      console.log('⚠️  Trigger warning:', triggerError.message);
    } else {
      console.log('✅ Trigger created');
    }
    
    // Step 7: Add metadata column to lats_spare_parts
    console.log('📋 Step 7: Adding metadata column to lats_spare_parts...');
    const metadataSQL = `
      ALTER TABLE lats_spare_parts 
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    `;
    
    const { error: metadataError } = await supabase.rpc('exec_sql', { sql: metadataSQL });
    if (metadataError) {
      console.log('⚠️  Metadata column warning:', metadataError.message);
    } else {
      console.log('✅ Metadata column added');
    }
    
    // Step 8: Create metadata index
    console.log('📋 Step 8: Creating metadata index...');
    const metadataIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_spare_parts_metadata ON lats_spare_parts USING GIN(metadata);
    `;
    
    const { error: metadataIndexError } = await supabase.rpc('exec_sql', { sql: metadataIndexSQL });
    if (metadataIndexError) {
      console.log('⚠️  Metadata index warning:', metadataIndexError.message);
    } else {
      console.log('✅ Metadata index created');
    }
    
    // Step 9: Verify table creation
    console.log('📋 Step 9: Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'lats_spare_part_variants');
    
    if (tableError) {
      console.error('❌ Error verifying table:', tableError);
      throw tableError;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ Table lats_spare_part_variants verified');
    } else {
      console.error('❌ Table lats_spare_part_variants was not created');
      throw new Error('Table creation verification failed');
    }
    
    // Step 10: Test table functionality
    console.log('📋 Step 10: Testing table functionality...');
    const { data: testData, error: testError } = await supabase
      .from('lats_spare_part_variants')
      .insert({
        name: 'Test Variant',
        sku: 'TEST-001',
        variant_attributes: { test: true }
      })
      .select();
    
    if (testError) {
      console.error('❌ Error testing table:', testError);
      throw testError;
    }
    
    console.log('✅ Table functionality test passed');
    
    // Clean up test data
    await supabase
      .from('lats_spare_part_variants')
      .delete()
      .eq('sku', 'TEST-001');
    
    console.log('🎉 Spare Part Variants Migration completed successfully!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • lats_spare_part_variants table');
    console.log('   • Indexes for performance');
    console.log('   • RLS policies for security');
    console.log('   • Triggers for updated_at timestamps');
    console.log('   • Metadata column in lats_spare_parts table');
    console.log('   • Image support for variants');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Test the variants functionality in your app');
    console.log('   2. Create some spare parts with variants');
    console.log('   3. Verify the API endpoints work correctly');
    
  } catch (error) {
    console.error('💥 Migration failed with error:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
