// Test script to debug categories loading
import { createClient } from '@supabase/supabase-js';

// You'll need to add your Supabase URL and key here
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCategories() {
  console.log('🧪 Testing categories table...');
  
  try {
    // Test 1: Check if table exists
    console.log('1. Checking if lats_categories table exists...');
    const { data: tableData, error: tableError } = await supabase
      .from('lats_categories')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table error:', tableError);
      return;
    }
    
    console.log('✅ Table exists, sample data:', tableData);
    
    // Test 2: Get all categories
    console.log('2. Fetching all categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('*')
      .order('name');
    
    if (categoriesError) {
      console.error('❌ Categories error:', categoriesError);
      return;
    }
    
    console.log('✅ Categories fetched:', {
      count: categories?.length || 0,
      categories: categories?.map(cat => ({ id: cat.id, name: cat.name, isActive: cat.isActive })) || []
    });
    
    // Test 3: Check for active categories only
    console.log('3. Fetching active categories only...');
    const { data: activeCategories, error: activeError } = await supabase
      .from('lats_categories')
      .select('*')
      .eq('isActive', true)
      .order('name');
    
    if (activeError) {
      console.error('❌ Active categories error:', activeError);
      return;
    }
    
    console.log('✅ Active categories:', {
      count: activeCategories?.length || 0,
      categories: activeCategories?.map(cat => ({ id: cat.id, name: cat.name })) || []
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCategories();
