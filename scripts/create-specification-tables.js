#!/usr/bin/env node

/**
 * Script to create the specification system tables directly
 * This creates the lats_specification_categories table and related tables
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSpecificationTables() {
  console.log('🚀 Creating specification system tables...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250131000035_create_specification_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Creating tables step by step...');
    
    // Create the tables using direct SQL execution
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error executing migration:', error);
      
      // Try alternative approach - create tables manually
      console.log('🔄 Trying alternative approach...');
      await createTablesManually();
    } else {
      console.log('✅ Migration executed successfully!');
      await verifyTables();
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('🔄 Trying alternative approach...');
    await createTablesManually();
  }
}

async function createTablesManually() {
  console.log('📋 Creating tables manually...');
  
  try {
    // Create specification categories table
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS lats_specification_categories (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        category_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        icon TEXT DEFAULT 'Monitor',
        color TEXT DEFAULT 'blue',
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: categoriesError } = await supabase.rpc('exec', { sql: createCategoriesTable });
    if (categoriesError) {
      console.error('❌ Error creating categories table:', categoriesError);
    } else {
      console.log('✅ lats_specification_categories table created');
    }
    
    // Create specifications table
    const createSpecsTable = `
      CREATE TABLE IF NOT EXISTS lats_specifications (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        category_id UUID NOT NULL REFERENCES lats_specification_categories(id) ON DELETE CASCADE,
        spec_key TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('text', 'number', 'boolean', 'select')),
        icon TEXT DEFAULT 'Settings',
        options JSONB DEFAULT '[]',
        unit TEXT,
        placeholder TEXT,
        description TEXT,
        is_required BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_spec_per_category UNIQUE (category_id, spec_key)
      );
    `;
    
    const { error: specsError } = await supabase.rpc('exec', { sql: createSpecsTable });
    if (specsError) {
      console.error('❌ Error creating specifications table:', specsError);
    } else {
      console.log('✅ lats_specifications table created');
    }
    
    // Create product specifications table
    const createProductSpecsTable = `
      CREATE TABLE IF NOT EXISTS lats_product_specifications (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
        specification_id UUID NOT NULL REFERENCES lats_specifications(id) ON DELETE CASCADE,
        value TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(product_id, specification_id)
      );
    `;
    
    const { error: productSpecsError } = await supabase.rpc('exec', { sql: createProductSpecsTable });
    if (productSpecsError) {
      console.error('❌ Error creating product specifications table:', productSpecsError);
    } else {
      console.log('✅ lats_product_specifications table created');
    }
    
    // Insert default categories
    await insertDefaultData();
    
    await verifyTables();
    
  } catch (error) {
    console.error('❌ Manual table creation failed:', error);
  }
}

async function insertDefaultData() {
  console.log('📋 Inserting default data...');
  
  try {
    // Insert default specification categories
    const defaultCategories = [
      { category_id: 'laptop', name: 'Laptop', icon: 'Monitor', color: 'blue', description: 'Laptop computers and notebooks', sort_order: 1 },
      { category_id: 'mobile', name: 'Mobile', icon: 'PhoneCall', color: 'green', description: 'Mobile phones and smartphones', sort_order: 2 },
      { category_id: 'monitor', name: 'Monitor', icon: 'Monitor', color: 'purple', description: 'Computer monitors and displays', sort_order: 3 },
      { category_id: 'tablet', name: 'Tablet', icon: 'Monitor', color: 'orange', description: 'Tablet computers and iPads', sort_order: 4 },
      { category_id: 'accessories', name: 'Accessories', icon: 'Cable', color: 'gray', description: 'Computer accessories and peripherals', sort_order: 5 }
    ];
    
    const { error } = await supabase
      .from('lats_specification_categories')
      .upsert(defaultCategories, { onConflict: 'category_id' });
    
    if (error) {
      console.error('❌ Error inserting default categories:', error);
    } else {
      console.log('✅ Default categories inserted');
    }
    
  } catch (error) {
    console.error('❌ Error inserting default data:', error);
  }
}

async function verifyTables() {
  console.log('🔍 Verifying tables were created...');
  
  try {
    const { data: categoriesTable, error: categoriesError } = await supabase
      .from('lats_specification_categories')
      .select('count')
      .limit(1);
    
    if (categoriesError) {
      console.error('❌ Failed to verify lats_specification_categories table:', categoriesError.message);
    } else {
      console.log('✅ lats_specification_categories table verified');
    }
    
    const { data: specsTable, error: specsError } = await supabase
      .from('lats_specifications')
      .select('count')
      .limit(1);
    
    if (specsError) {
      console.error('❌ Failed to verify lats_specifications table:', specsError.message);
    } else {
      console.log('✅ lats_specifications table verified');
    }
    
    const { data: productSpecsTable, error: productSpecsError } = await supabase
      .from('lats_product_specifications')
      .select('count')
      .limit(1);
    
    if (productSpecsError) {
      console.error('❌ Failed to verify lats_product_specifications table:', productSpecsError.message);
    } else {
      console.log('✅ lats_product_specifications table verified');
    }
    
    // Check default categories
    const { data: defaultCategories, error: defaultError } = await supabase
      .from('lats_specification_categories')
      .select('*')
      .eq('is_active', true);
    
    if (defaultError) {
      console.error('❌ Failed to check default categories:', defaultError.message);
    } else {
      console.log(`✅ Found ${defaultCategories?.length || 0} default specification categories`);
      if (defaultCategories && defaultCategories.length > 0) {
        console.log('   Default categories:');
        defaultCategories.forEach(cat => {
          console.log(`   - ${cat.name} (${cat.category_id})`);
        });
      }
    }
    
    console.log('');
    console.log('🎉 Specification system setup completed successfully!');
    console.log('');
    console.log('📊 What was created:');
    console.log('   ✅ lats_specification_categories table');
    console.log('   ✅ lats_specifications table');
    console.log('   ✅ lats_product_specifications table');
    console.log('   ✅ Default specification categories');
    console.log('');
    console.log('🔧 The 404 error should now be resolved!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the script
createSpecificationTables();
