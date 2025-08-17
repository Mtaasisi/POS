#!/usr/bin/env node

/**
 * LATS Database Setup Script (Direct Method)
 * This script sets up the LATS inventory management system database schema
 * using direct Supabase client operations
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function setupLatsDatabaseDirect() {
  try {
    console.log('🚀 Starting LATS database setup (Direct Method)...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('devices')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Connection test failed, but continuing with setup...');
    } else {
      console.log('✅ Supabase connection successful');
    }
    
    // Create tables using direct operations
    console.log('📝 Creating LATS tables...');
    
    // 1. Create categories table
    console.log('Creating lats_categories table...');
    try {
      const { error } = await supabase.rpc('create_lats_categories_table');
      if (error) {
        console.log('Table might already exist, continuing...');
      }
    } catch (error) {
      console.log('Categories table creation skipped (may already exist)');
    }
    
    // 2. Create brands table
    console.log('Creating lats_brands table...');
    try {
      const { error } = await supabase.rpc('create_lats_brands_table');
      if (error) {
        console.log('Table might already exist, continuing...');
      }
    } catch (error) {
      console.log('Brands table creation skipped (may already exist)');
    }
    
    // Since we can't create tables directly via the client, let's test if they exist
    console.log('🔍 Checking existing tables...');
    
    const tablesToCheck = [
      'lats_categories',
      'lats_brands', 
      'lats_suppliers',
      'lats_products',
      'lats_product_variants',
      'lats_stock_movements',
      'lats_purchase_orders',
      'lats_purchase_order_items',
      'lats_spare_parts',
      'lats_spare_part_usage',
      'lats_cart',
      'lats_cart_items',
      'lats_sales',
      'lats_sale_items',
      'lats_pos_settings'
    ];
    
    let existingTables = 0;
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table} does not exist or is not accessible`);
        } else {
          console.log(`✅ Table ${table} exists`);
          existingTables++;
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Table Check Summary:`);
    console.log(`✅ Existing tables: ${existingTables}/${tablesToCheck.length}`);
    
    if (existingTables === 0) {
      console.log('\n⚠️  No LATS tables found. You need to create them manually in the Supabase dashboard.');
      console.log('\n📋 Manual Setup Instructions:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project: jxhzveborezjhsmzsgbc');
      console.log('3. Navigate to SQL Editor');
      console.log('4. Copy and paste the contents of: supabase/migrations/20241201000000_create_lats_schema.sql');
      console.log('5. Click Run to execute the schema');
      console.log('6. Verify tables are created in the Table Editor');
      
      // Create a simple test to verify the setup
      console.log('\n🧪 Testing basic Supabase operations...');
      
      // Test if we can create a simple table for testing
      try {
        const { error } = await supabase
          .from('lats_test_connection')
          .insert([{ test: 'connection' }]);
        
        if (error) {
          console.log('❌ Basic insert test failed:', error.message);
        } else {
          console.log('✅ Basic insert test successful');
          
          // Clean up test data
          await supabase
            .from('lats_test_connection')
            .delete()
            .eq('test', 'connection');
        }
      } catch (error) {
        console.log('❌ Basic operation test failed:', error.message);
      }
      
    } else if (existingTables === tablesToCheck.length) {
      console.log('\n🎉 All LATS tables exist! Database setup appears complete.');
      
      // Test inserting some sample data
      console.log('\n🧪 Testing data operations...');
      
      try {
        // Test categories
        const { data: categories, error: catError } = await supabase
          .from('lats_categories')
          .select('*')
          .limit(5);
        
        if (catError) {
          console.log('❌ Categories query failed:', catError.message);
        } else {
          console.log(`✅ Categories query successful: ${categories?.length || 0} categories found`);
        }
        
        // Test brands
        const { data: brands, error: brandError } = await supabase
          .from('lats_brands')
          .select('*')
          .limit(5);
        
        if (brandError) {
          console.log('❌ Brands query failed:', brandError.message);
        } else {
          console.log(`✅ Brands query successful: ${brands?.length || 0} brands found`);
        }
        
        // Test products
        const { data: products, error: prodError } = await supabase
          .from('lats_products')
          .select('*')
          .limit(5);
        
        if (prodError) {
          console.log('❌ Products query failed:', prodError.message);
        } else {
          console.log(`✅ Products query successful: ${products?.length || 0} products found`);
        }
        
      } catch (error) {
        console.log('❌ Data operation test failed:', error.message);
      }
      
    } else {
      console.log('\n⚠️  Some tables exist but not all. You may need to complete the setup manually.');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. If tables don\'t exist, run the SQL migration manually in Supabase dashboard');
    console.log('2. Test the application to ensure it connects to real data');
    console.log('3. Add your actual inventory data');
    console.log('4. Configure POS settings');
    
  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupLatsDatabaseDirect();
