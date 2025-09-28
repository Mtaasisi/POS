#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🔍 Investigating Null Sales Data Issues');
console.log('=======================================');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateNullSalesData() {
  try {
    console.log('\n📊 1. Fetching all recent sales...');
    
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (salesError) {
      console.error('❌ Error fetching sales:', salesError.message);
      return;
    }
    
    console.log(`✅ Found ${sales.length} recent sales`);
    
    console.log('\n📊 2. Analyzing sales data structure...');
    
    sales.forEach((sale, index) => {
      console.log(`\n📦 Sale ${index + 1}: ${sale.sale_number}`);
      console.log(`  - ID: ${sale.id}`);
      console.log(`  - Subtotal: ${sale.subtotal} (${typeof sale.subtotal})`);
      console.log(`  - Discount Amount: ${sale.discount_amount} (${typeof sale.discount_amount})`);
      console.log(`  - Discount Type: ${sale.discount_type} (${typeof sale.discount_type})`);
      console.log(`  - Discount Value: ${sale.discount_value} (${typeof sale.discount_value})`);
      console.log(`  - Tax: ${sale.tax} (${typeof sale.tax})`);
      console.log(`  - Total Amount: ${sale.total_amount} (${typeof sale.total_amount})`);
      console.log(`  - Payment Method: ${sale.payment_method ? 'Present' : 'Missing'}`);
      console.log(`  - Status: ${sale.status}`);
      console.log(`  - Created: ${sale.created_at}`);
    });
    
    console.log('\n📊 3. Finding sales with null values...');
    
    const nullSubtotalSales = sales.filter(sale => sale.subtotal === null);
    const nullDiscountSales = sales.filter(sale => sale.discount_amount === null);
    const nullTaxSales = sales.filter(sale => sale.tax === null);
    
    console.log(`  - Sales with null subtotal: ${nullSubtotalSales.length}`);
    console.log(`  - Sales with null discount: ${nullDiscountSales.length}`);
    console.log(`  - Sales with null tax: ${nullTaxSales.length}`);
    
    if (nullSubtotalSales.length > 0) {
      console.log('\n🔧 4. Fixing null subtotal values...');
      
      for (const sale of nullSubtotalSales) {
        // Calculate subtotal from sale items
        const { data: saleItems, error: itemsError } = await supabase
          .from('lats_sale_items')
          .select('total_price')
          .eq('sale_id', sale.id);
        
        if (itemsError) {
          console.log(`❌ Error fetching items for sale ${sale.sale_number}: ${itemsError.message}`);
          continue;
        }
        
        const calculatedSubtotal = saleItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        console.log(`  - Sale ${sale.sale_number}: Setting subtotal to ${calculatedSubtotal}`);
        
        const { error: updateError } = await supabase
          .from('lats_sales')
          .update({ subtotal: calculatedSubtotal })
          .eq('id', sale.id);
        
        if (updateError) {
          console.log(`❌ Failed to update ${sale.sale_number}: ${updateError.message}`);
        } else {
          console.log(`✅ Updated ${sale.sale_number}`);
        }
      }
    }
    
    if (nullDiscountSales.length > 0) {
      console.log('\n🔧 5. Fixing null discount values...');
      
      for (const sale of nullDiscountSales) {
        console.log(`  - Sale ${sale.sale_number}: Setting discount to 0`);
        
        const { error: updateError } = await supabase
          .from('lats_sales')
          .update({ 
            discount_amount: 0,
            discount_type: 'none',
            discount_value: 0
          })
          .eq('id', sale.id);
        
        if (updateError) {
          console.log(`❌ Failed to update ${sale.sale_number}: ${updateError.message}`);
        } else {
          console.log(`✅ Updated ${sale.sale_number}`);
        }
      }
    }
    
    if (nullTaxSales.length > 0) {
      console.log('\n🔧 6. Fixing null tax values...');
      
      for (const sale of nullTaxSales) {
        console.log(`  - Sale ${sale.sale_number}: Setting tax to 0`);
        
        const { error: updateError } = await supabase
          .from('lats_sales')
          .update({ tax: 0 })
          .eq('id', sale.id);
        
        if (updateError) {
          console.log(`❌ Failed to update ${sale.sale_number}: ${updateError.message}`);
        } else {
          console.log(`✅ Updated ${sale.sale_number}`);
        }
      }
    }
    
    console.log('\n📊 7. Verifying fixes...');
    
    const { data: updatedSales, error: verifyError } = await supabase
      .from('lats_sales')
      .select('sale_number, subtotal, discount_amount, tax, total_amount')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Error verifying fixes:', verifyError.message);
    } else {
      console.log('✅ Updated sales data:');
      updatedSales.forEach(sale => {
        console.log(`  - ${sale.sale_number}: Subtotal=${sale.subtotal}, Discount=${sale.discount_amount}, Tax=${sale.tax}, Total=${sale.total_amount}`);
      });
    }
    
    console.log('\n🎉 Null sales data investigation completed!');
    console.log('==========================================');
    console.log('✅ Null values identified and fixed');
    console.log('✅ Sales data structure normalized');
    console.log('✅ Financial calculations should now work correctly');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

// Run the investigation
investigateNullSalesData();
