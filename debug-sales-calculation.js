#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🔍 Debugging Sales Calculation Issues');
console.log('=====================================');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSalesCalculation() {
  try {
    console.log('\n📊 1. Finding the problematic sale...');
    
    // Find the sale with the calculation issue
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('*')
      .eq('sale_number', 'SALE-84510552-AP4L')
      .limit(1);
    
    if (salesError) {
      console.error('❌ Error fetching sale:', salesError.message);
      return;
    }
    
    if (sales.length === 0) {
      console.log('❌ Sale not found');
      return;
    }
    
    const sale = sales[0];
    console.log('✅ Found sale:', sale.sale_number);
    console.log('📋 Raw database values:');
    console.log(`  - subtotal: ${sale.subtotal}`);
    console.log(`  - discount_amount: ${sale.discount_amount}`);
    console.log(`  - discount_type: ${sale.discount_type}`);
    console.log(`  - discount_value: ${sale.discount_value}`);
    console.log(`  - tax: ${sale.tax}`);
    console.log(`  - total_amount: ${sale.total_amount}`);
    
    console.log('\n📊 2. Fetching sale items...');
    
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select('*')
      .eq('sale_id', sale.id);
    
    if (itemsError) {
      console.error('❌ Error fetching sale items:', itemsError.message);
      return;
    }
    
    console.log(`✅ Found ${saleItems.length} sale items`);
    
    let calculatedSubtotal = 0;
    let calculatedTotal = 0;
    
    saleItems.forEach((item, index) => {
      console.log(`\n📦 Item ${index + 1}:`);
      console.log(`  - Product ID: ${item.product_id}`);
      console.log(`  - Variant ID: ${item.variant_id}`);
      console.log(`  - Quantity: ${item.quantity}`);
      console.log(`  - Unit Price: ${item.unit_price}`);
      console.log(`  - Total: ${item.total_price}`);
      
      calculatedSubtotal += item.total_price || 0;
    });
    
    console.log('\n📊 3. Calculation Analysis:');
    console.log(`  - Database subtotal: ${sale.subtotal}`);
    console.log(`  - Calculated subtotal: ${calculatedSubtotal}`);
    console.log(`  - Database discount: ${sale.discount_amount}`);
    console.log(`  - Database total: ${sale.total_amount}`);
    
    // Calculate expected total
    const expectedTotal = calculatedSubtotal - (sale.discount_amount || 0) + (sale.tax || 0);
    console.log(`  - Expected total: ${expectedTotal}`);
    
    console.log('\n📊 4. Fetching product details...');
    
    for (const item of saleItems) {
      if (item.product_id) {
        const { data: product, error: productError } = await supabase
          .from('lats_products')
          .select('name, selling_price')
          .eq('id', item.product_id)
          .single();
        
        if (productError) {
          console.log(`❌ Product ${item.product_id} not found`);
        } else {
          console.log(`✅ Product: ${product.name} (Price: ${product.selling_price})`);
        }
      }
      
      if (item.variant_id) {
        const { data: variant, error: variantError } = await supabase
          .from('lats_product_variants')
          .select('variant_name, price')
          .eq('id', item.variant_id)
          .single();
        
        if (variantError) {
          console.log(`❌ Variant ${item.variant_id} not found`);
        } else {
          console.log(`✅ Variant: ${variant.variant_name} (Price: ${variant.price})`);
        }
      }
    }
    
    console.log('\n🔧 5. Suggested Fix:');
    
    if (sale.subtotal !== calculatedSubtotal) {
      console.log('⚠️  Subtotal mismatch detected!');
      console.log('🔧 Updating subtotal to match calculated value...');
      
      const { error: updateError } = await supabase
        .from('lats_sales')
        .update({ subtotal: calculatedSubtotal })
        .eq('id', sale.id);
      
      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Subtotal updated successfully');
      }
    }
    
    if (sale.total_amount !== expectedTotal) {
      console.log('⚠️  Total amount mismatch detected!');
      console.log('🔧 Updating total amount to match calculated value...');
      
      const { error: updateError } = await supabase
        .from('lats_sales')
        .update({ total_amount: expectedTotal })
        .eq('id', sale.id);
      
      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Total amount updated successfully');
      }
    }
    
    console.log('\n🎉 Sales calculation debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugSalesCalculation();
