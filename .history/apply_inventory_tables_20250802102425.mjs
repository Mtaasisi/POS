#!/usr/bin/env node

// Apply Inventory Tables to Supabase using REST API
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Setting up inventory tables in Supabase...');

async function setupInventoryTables() {
  try {
    // First, let's check if the tables already exist
    console.log('📋 Checking existing tables...');
    
    // Try to fetch from inventory_categories to see if it exists
    const { data: categories, error: categoriesError } = await supabase
      .from('inventory_categories')
      .select('count')
      .limit(1);
    
    if (!categoriesError && categories !== null) {
      console.log('✅ inventory_categories table already exists');
    } else {
      console.log('❌ inventory_categories table does not exist');
      console.log('⚠️  You need to create the tables manually in the Supabase dashboard');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
      console.log('');
      console.log('📝 Copy and paste the SQL from setup_inventory_tables.sql into the SQL editor');
      return;
    }
    
    // Insert default categories if they don't exist
    console.log('📦 Inserting default categories...');
    const defaultCategories = [
      { name: 'Screens', description: 'Phone and tablet screens', color: '#EF4444' },
      { name: 'Batteries', description: 'Phone and tablet batteries', color: '#10B981' },
      { name: 'Charging Ports', description: 'Charging ports and cables', color: '#F59E0B' },
      { name: 'Cameras', description: 'Phone cameras and modules', color: '#8B5CF6' },
      { name: 'Speakers', description: 'Phone speakers and audio components', color: '#06B6D4' },
      { name: 'Motherboards', description: 'Phone motherboards and main boards', color: '#84CC16' },
      { name: 'Other Parts', description: 'Miscellaneous phone parts', color: '#6B7280' }
    ];
    
    for (const category of defaultCategories) {
      const { error } = await supabase
        .from('inventory_categories')
        .upsert(category, { onConflict: 'name' });
      
      if (error) {
        console.log(`⚠️  Error inserting category ${category.name}:`, error.message);
      } else {
        console.log(`✅ Added category: ${category.name}`);
      }
    }
    
    // Test the API
    console.log('🧪 Testing inventory API...');
    const { data: testCategories, error: testError } = await supabase
      .from('inventory_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (testError) {
      console.log('❌ Error testing inventory API:', testError.message);
    } else {
      console.log(`✅ Successfully fetched ${testCategories?.length || 0} categories`);
      console.log('📋 Categories:', testCategories?.map(c => c.name).join(', '));
    }
    
    console.log('');
    console.log('🎉 Inventory system setup complete!');
    console.log('📊 You can now use the inventory features in your app');
    
  } catch (error) {
    console.error('❌ Error setting up inventory tables:', error);
    console.log('');
    console.log('🔧 Manual setup required:');
    console.log('1. Go to https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
    console.log('2. Open the SQL editor');
    console.log('3. Copy the contents of setup_inventory_tables.sql');
    console.log('4. Paste and execute the SQL');
  }
}

// Run the setup
setupInventoryTables(); 