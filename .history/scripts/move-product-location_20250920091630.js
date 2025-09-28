#!/usr/bin/env node

/**
 * Script to move a product from shelf position H2 to 01B2
 * This script will:
 * 1. Find the product currently at position H2
 * 2. Verify that position 01B2 exists
 * 3. Update the product's location to 01B2
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Read environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

let envContent = '';
try {
  envContent = readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Initialize Supabase client
const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function moveProductLocation(fromPosition, toPosition) {
  try {
    console.log(`🔄 Moving product from position ${fromPosition} to ${toPosition}...`);

    // Step 1: Find the shelf with code H2
    console.log(`\n📋 Step 1: Finding shelf with code "${fromPosition}"...`);
    const { data: fromShelf, error: fromShelfError } = await supabase
      .from('lats_store_shelves')
      .select('*')
      .eq('code', fromPosition)
      .single();

    if (fromShelfError) {
      console.error(`❌ Error finding shelf ${fromPosition}:`, fromShelfError.message);
      return;
    }

    if (!fromShelf) {
      console.error(`❌ Shelf with code "${fromPosition}" not found`);
      return;
    }

    console.log(`✅ Found shelf: ${fromShelf.name} (${fromShelf.code})`);

    // Step 2: Find products at the current position
    console.log(`\n📋 Step 2: Finding products at position "${fromPosition}"...`);
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        sku,
        stock_quantity,
        store_shelf_id,
        lats_store_shelves!inner(code, name)
      `)
      .eq('store_shelf_id', fromShelf.id);

    if (productsError) {
      console.error(`❌ Error finding products:`, productsError.message);
      return;
    }

    if (!products || products.length === 0) {
      console.log(`ℹ️ No products found at position "${fromPosition}"`);
      return;
    }

    console.log(`✅ Found ${products.length} product(s) at position "${fromPosition}":`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (SKU: ${product.sku}) - Stock: ${product.stock_quantity}`);
    });

    // Step 3: Find the target shelf with code 01B2
    console.log(`\n📋 Step 3: Finding target shelf with code "${toPosition}"...`);
    const { data: toShelf, error: toShelfError } = await supabase
      .from('lats_store_shelves')
      .select('*')
      .eq('code', toPosition)
      .single();

    if (toShelfError) {
      console.error(`❌ Error finding target shelf ${toPosition}:`, toShelfError.message);
      return;
    }

    if (!toShelf) {
      console.error(`❌ Target shelf with code "${toPosition}" not found`);
      console.log(`\n💡 Available shelves:`);
      
      // Show available shelves for reference
      const { data: allShelves } = await supabase
        .from('lats_store_shelves')
        .select('code, name, current_capacity, max_capacity')
        .order('code');
      
      if (allShelves) {
        allShelves.forEach(shelf => {
          console.log(`   - ${shelf.code}: ${shelf.name} (${shelf.current_capacity}/${shelf.max_capacity})`);
        });
      }
      return;
    }

    console.log(`✅ Found target shelf: ${toShelf.name} (${toShelf.code})`);
    console.log(`   Current capacity: ${toShelf.current_capacity}/${toShelf.max_capacity}`);

    // Step 4: Check if target shelf has enough capacity
    const totalStockToMove = products.reduce((sum, product) => sum + (product.stock_quantity || 0), 0);
    if (toShelf.max_capacity && (toShelf.current_capacity + totalStockToMove) > toShelf.max_capacity) {
      console.error(`❌ Target shelf "${toPosition}" doesn't have enough capacity`);
      console.error(`   Required: ${totalStockToMove} units`);
      console.error(`   Available: ${toShelf.max_capacity - toShelf.current_capacity} units`);
      return;
    }

    // Step 5: Move each product
    console.log(`\n📋 Step 4: Moving products to position "${toPosition}"...`);
    
    for (const product of products) {
      console.log(`\n🔄 Moving "${product.name}" (${product.sku})...`);
      
      const { error: updateError } = await supabase
        .from('lats_products')
        .update({ 
          store_shelf_id: toShelf.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Error moving product "${product.name}":`, updateError.message);
        continue;
      }

      console.log(`✅ Successfully moved "${product.name}" to position "${toPosition}"`);
    }

    // Step 6: Verify the move
    console.log(`\n📋 Step 5: Verifying the move...`);
    const { data: movedProducts, error: verifyError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        sku,
        store_shelf_id,
        lats_store_shelves!inner(code, name)
      `)
      .eq('store_shelf_id', toShelf.id);

    if (verifyError) {
      console.error(`❌ Error verifying move:`, verifyError.message);
      return;
    }

    console.log(`✅ Verification successful! Products now at position "${toPosition}":`);
    movedProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (SKU: ${product.sku})`);
    });

    console.log(`\n🎉 Successfully moved all products from "${fromPosition}" to "${toPosition}"!`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node move-product-location.js <from_position> <to_position>');
    console.log('Example: node move-product-location.js H2 01B2');
    process.exit(1);
  }

  const fromPosition = args[0];
  const toPosition = args[1];

  console.log('🚀 Product Location Mover');
  console.log('========================');
  console.log(`From: ${fromPosition}`);
  console.log(`To: ${toPosition}`);
  console.log('========================\n');

  await moveProductLocation(fromPosition, toPosition);
}

// Run the script
main().catch(console.error);
