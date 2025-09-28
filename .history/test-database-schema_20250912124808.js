#!/usr/bin/env node

// Test script to verify database schema and connection
// This will help identify if the lats_categories table has the required columns

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema and connection...\n');

  try {
    // Test 1: Basic connection test
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('lats_categories')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    console.log('✅ Basic connection successful\n');

    // Test 2: Check table structure
    console.log('2. Testing table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('lats_categories')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Structure test failed:', structureError);
      return;
    }
    
    if (structureData && structureData.length > 0) {
      const columns = Object.keys(structureData[0]);
      console.log('✅ Table structure test successful');
      console.log('📋 Available columns:', columns.join(', '));
      
      // Check for required columns
      const requiredColumns = ['id', 'name', 'parent_id', 'icon', 'is_active', 'sort_order', 'metadata'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️  Missing required columns:', missingColumns.join(', '));
      } else {
        console.log('✅ All required columns present');
      }
    } else {
      console.log('⚠️  Table is empty, cannot check structure');
    }
    console.log('');

    // Test 3: Test the problematic query pattern
    console.log('3. Testing the problematic query pattern...');
    const { data: queryData, error: queryError } = await supabase
      .from('lats_categories')
      .select('name, description, parent_id, color, icon, is_active, sort_order, metadata')
      .limit(5);
    
    if (queryError) {
      console.error('❌ Query pattern test failed:', queryError);
      console.error('Error details:', {
        message: queryError.message,
        details: queryError.details,
        hint: queryError.hint,
        code: queryError.code
      });
    } else {
      console.log('✅ Query pattern test successful');
      console.log('📊 Sample data:', JSON.stringify(queryData, null, 2));
    }
    console.log('');

    // Test 4: Test simple select all
    console.log('4. Testing simple select all...');
    const { data: allData, error: allError } = await supabase
      .from('lats_categories')
      .select('*')
      .limit(5);
    
    if (allError) {
      console.error('❌ Select all test failed:', allError);
    } else {
      console.log('✅ Select all test successful');
      console.log('📊 Total categories found:', allData?.length || 0);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabaseSchema().then(() => {
  console.log('\n🏁 Database schema test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
