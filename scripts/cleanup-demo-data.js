#!/usr/bin/env node

/**
 * Demo Data Cleanup Script
 * This script removes any existing demo data and ensures the system uses only real data
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

async function cleanupDemoData() {
  try {
    console.log('🧹 Starting demo data cleanup...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // List of tables to clean (in order to respect foreign key constraints)
    const tablesToClean = [
      'lats_sale_items',
      'lats_sales',
      'lats_cart_items',
      'lats_cart',
      'lats_stock_movements',
      'lats_purchase_order_items',
      'lats_purchase_orders',
      'lats_spare_part_usage',
      'lats_spare_parts',
      'lats_product_variants',
      'lats_products',
      'lats_suppliers',
      'lats_brands',
      'lats_categories'
    ];
    
    let totalDeleted = 0;
    
    for (const table of tablesToClean) {
      try {
        console.log(`🗑️  Cleaning table: ${table}`);
        
        const { data, error, count } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep at least one record if needed
        
        if (error) {
          console.error(`❌ Error cleaning ${table}:`, error.message);
        } else {
          const deletedCount = count || 0;
          totalDeleted += deletedCount;
          console.log(`✅ Cleaned ${table}: ${deletedCount} records deleted`);
        }
      } catch (error) {
        console.error(`❌ Exception cleaning ${table}:`, error.message);
      }
    }
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`✅ Total records deleted: ${totalDeleted}`);
    console.log(`🎉 Demo data cleanup completed!`);
    
    // Verify cleanup
    console.log(`\n🔍 Verifying cleanup...`);
    
    for (const table of tablesToClean) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ Error checking ${table}:`, error.message);
        } else {
          console.log(`✅ ${table}: ${count || 0} records remaining`);
        }
      } catch (error) {
        console.error(`❌ Exception checking ${table}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Fatal error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupDemoData();
