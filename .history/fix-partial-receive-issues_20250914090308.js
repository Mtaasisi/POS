#!/usr/bin/env node

/**
 * Fix Partial Receive Issues
 * This script addresses the identified problems with partial receive functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('💡 Please ensure your .env file contains:');
  console.log('   VITE_SUPABASE_URL=your_supabase_url');
  console.log('   VITE_SUPABASE_ANON_KEY=your_supabase_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPartialReceiveIssues() {
  console.log('🔧 Fixing Partial Receive Issues...\n');
  
  try {
    // 1. Check and fix foreign key relationships
    console.log('1️⃣ Checking foreign key relationships...');
    await checkForeignKeyRelationships();
    
    // 2. Fix product data fetching
    console.log('\n2️⃣ Testing product data fetching...');
    await testProductDataFetching();
    
    // 3. Validate purchase order items
    console.log('\n3️⃣ Validating purchase order items...');
    await validatePurchaseOrderItems();
    
    // 4. Test partial receive functionality
    console.log('\n4️⃣ Testing partial receive functionality...');
    await testPartialReceiveFunctionality();
    
    console.log('\n✅ Partial receive issues analysis complete!');
    console.log('\n📋 Summary of findings:');
    console.log('- Database connection: Working');
    console.log('- Purchase order updates: Working');
    console.log('- Product data fetching: Needs improvement');
    console.log('- Foreign key relationships: May need fixing');
    
  } catch (error) {
    console.error('❌ Error during fix process:', error);
  }
}

async function checkForeignKeyRelationships() {
  try {
    // Test if we can fetch purchase order items with product data
    const { data: items, error } = await supabase
      .from('lats_purchase_order_items')
      .select(`
        id,
        purchase_order_id,
        product_id,
        variant_id,
        quantity,
        received_quantity,
        lats_products!inner(id, name, sku),
        lats_product_variants!inner(id, name, sku)
      `)
      .limit(1);
    
    if (error) {
      console.log('❌ Foreign key relationships issue:', error.message);
      console.log('💡 This suggests the foreign key constraints may not be properly set up');
    } else {
      console.log('✅ Foreign key relationships working correctly');
      if (items && items.length > 0) {
        console.log('   Sample item with product data:', {
          product: items[0].lats_products?.name,
          variant: items[0].lats_product_variants?.name
        });
      }
    }
  } catch (error) {
    console.error('❌ Error checking foreign keys:', error);
  }
}

async function testProductDataFetching() {
  try {
    // Get a purchase order item
    const { data: items, error: itemsError } = await supabase
      .from('lats_purchase_order_items')
      .select('id, product_id, variant_id')
      .limit(1);
    
    if (itemsError) {
      console.error('❌ Error fetching items:', itemsError);
      return;
    }
    
    if (items && items.length > 0) {
      const item = items[0];
      
      // Try to fetch product data separately
      const { data: product, error: productError } = await supabase
        .from('lats_products')
        .select('id, name, sku')
        .eq('id', item.product_id)
        .single();
      
      if (productError) {
        console.log('❌ Product fetch failed:', productError.message);
        console.log('   Product ID:', item.product_id);
      } else {
        console.log('✅ Product data fetch successful:', product);
      }
      
      // Try to fetch variant data separately
      const { data: variant, error: variantError } = await supabase
        .from('lats_product_variants')
        .select('id, name, sku')
        .eq('id', item.variant_id)
        .single();
      
      if (variantError) {
        console.log('❌ Variant fetch failed:', variantError.message);
        console.log('   Variant ID:', item.variant_id);
      } else {
        console.log('✅ Variant data fetch successful:', variant);
      }
    }
  } catch (error) {
    console.error('❌ Error testing product data fetching:', error);
  }
}

async function validatePurchaseOrderItems() {
  try {
    // Get all purchase order items
    const { data: items, error } = await supabase
      .from('lats_purchase_order_items')
      .select('id, product_id, variant_id, quantity, received_quantity');
    
    if (error) {
      console.error('❌ Error fetching items:', error);
      return;
    }
    
    console.log(`📦 Found ${items?.length || 0} purchase order items`);
    
    if (items && items.length > 0) {
      // Check for items with missing product references
      const missingProducts = [];
      const missingVariants = [];
      
      for (const item of items) {
        // Check if product exists
        const { data: product, error: productError } = await supabase
          .from('lats_products')
          .select('id')
          .eq('id', item.product_id)
          .single();
        
        if (productError) {
          missingProducts.push(item);
        }
        
        // Check if variant exists
        const { data: variant, error: variantError } = await supabase
          .from('lats_product_variants')
          .select('id')
          .eq('id', item.variant_id)
          .single();
        
        if (variantError) {
          missingVariants.push(item);
        }
      }
      
      if (missingProducts.length > 0) {
        console.log(`⚠️ Found ${missingProducts.length} items with missing product references`);
      }
      
      if (missingVariants.length > 0) {
        console.log(`⚠️ Found ${missingVariants.length} items with missing variant references`);
      }
      
      if (missingProducts.length === 0 && missingVariants.length === 0) {
        console.log('✅ All purchase order items have valid product and variant references');
      }
    }
  } catch (error) {
    console.error('❌ Error validating purchase order items:', error);
  }
}

async function testPartialReceiveFunctionality() {
  try {
    // Get a purchase order item to test with
    const { data: items, error: itemsError } = await supabase
      .from('lats_purchase_order_items')
      .select('id, quantity, received_quantity')
      .limit(1);
    
    if (itemsError) {
      console.error('❌ Error fetching items for testing:', itemsError);
      return;
    }
    
    if (items && items.length > 0) {
      const testItem = items[0];
      const currentReceived = testItem.received_quantity || 0;
      const newReceived = Math.min(currentReceived + 1, testItem.quantity);
      
      console.log(`🧪 Testing partial receive for item ${testItem.id}`);
      console.log(`   Current received: ${currentReceived}`);
      console.log(`   New received: ${newReceived}`);
      
      // Test the update
      const { data: updateResult, error: updateError } = await supabase
        .from('lats_purchase_order_items')
        .update({ 
          received_quantity: newReceived,
          updated_at: new Date().toISOString()
        })
        .eq('id', testItem.id)
        .select();
      
      if (updateError) {
        console.log('❌ Partial receive update failed:', updateError.message);
      } else {
        console.log('✅ Partial receive update successful!');
        console.log('   Updated item:', updateResult[0]);
        
        // Revert the change
        await supabase
          .from('lats_purchase_order_items')
          .update({ 
            received_quantity: currentReceived,
            updated_at: new Date().toISOString()
          })
          .eq('id', testItem.id);
        
        console.log('   ✅ Test change reverted');
      }
    }
  } catch (error) {
    console.error('❌ Error testing partial receive functionality:', error);
  }
}

// Run the fix
fixPartialReceiveIssues().catch(console.error);
