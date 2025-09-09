#!/usr/bin/env node

/**
 * Fix Supabase Connection and Purchase Order Issues
 * This script diagnoses and fixes the connection and database issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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
  console.log('⚠️  This project URL is not resolving - it may be paused or deleted');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

async function fixSupabaseIssues() {
  console.log('🔧 Fixing Supabase Connection and Purchase Order Issues...\n');

  const config = getConfig();
  console.log(`🔗 Supabase URL: ${config.url}`);
  console.log(`🔑 API Key available: ${!!config.key}\n`);

  // Step 1: Test basic connection
  console.log('📋 Step 1: Testing basic connection...');
  try {
    const response = await fetch(config.url);
    if (response.ok) {
      console.log('✅ Supabase URL is accessible');
    } else {
      console.log(`⚠️ Supabase URL returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Supabase URL is not accessible: ${error.message}`);
    console.log('💡 This suggests the project might be paused or deleted');
  }

  // Step 2: Test Supabase client connection
  console.log('\n📋 Step 2: Testing Supabase client connection...');
  try {
    const supabase = createClient(config.url, config.key);
    
    // Test basic query
    const { data, error } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`❌ Supabase client error: ${error.message}`);
      
      if (error.message.includes('relation "lats_purchase_orders" does not exist')) {
        console.log('💡 The lats_purchase_orders table does not exist');
      } else if (error.message.includes('JWT')) {
        console.log('💡 Authentication issue - check your API key');
      } else if (error.message.includes('permission')) {
        console.log('💡 Permission issue - check RLS policies');
      }
    } else {
      console.log('✅ Supabase client connection successful');
      console.log(`📊 Found ${data?.length || 0} purchase orders`);
    }
  } catch (error) {
    console.log(`❌ Failed to create Supabase client: ${error.message}`);
  }

  // Step 3: Check if tables exist
  console.log('\n📋 Step 3: Checking table existence...');
  try {
    const supabase = createClient(config.url, config.key);
    
    const tables = [
      'lats_purchase_orders',
      'lats_suppliers',
      'lats_products',
      'lats_categories'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: exists`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Failed to check tables: ${error.message}`);
  }

  // Step 4: Provide solutions
  console.log('\n📋 Step 4: Recommended Solutions...');
  console.log('\n🔧 To fix the connection issues:');
  console.log('1. Check if your Supabase project is paused at https://supabase.com');
  console.log('2. Resume the project if it\'s paused');
  console.log('3. Or create a new project and update your environment variables');
  console.log('4. Ensure your API keys are correct and not expired');
  
  console.log('\n🔧 To fix the purchase order 400 errors:');
  console.log('1. Ensure the lats_purchase_orders table exists');
  console.log('2. Check that RLS policies allow insert operations');
  console.log('3. Verify foreign key constraints (supplier_id must exist in lats_suppliers)');
  console.log('4. Ensure the user has proper authentication');
  
  console.log('\n🔧 Quick fix commands:');
  console.log('1. Run: npm run setup-database (if you have this script)');
  console.log('2. Or manually create tables using the SQL migrations');
  console.log('3. Check RLS policies in your Supabase dashboard');
}

// Run the fix
fixSupabaseIssues().catch(console.error);
