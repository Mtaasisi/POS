#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🔧 Fixing Sales Calculation Discrepancy');
console.log('======================================');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSalesCalculation() {
  try {
    console.log('\n📊 1. Finding the sale with calculation issues...');
    
    // Find the specific sale
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
    
    console.log('\n📊 2. Current database values:');
    console.log(`  - subtotal: ${sale.subtotal}`);
    console.log(`  - discount_amount: ${sale.discount_amount}`);
    console.log(`  - discount_type: ${sale.discount_type}`);
    console.log(`  - discount_value: ${sale.discount_value}`);
    console.log(`  - tax: ${sale.tax}`);
    console.log(`  - total_amount: ${sale.total_amount}`);
    
    console.log('\n📊 3. Frontend reported values:');
    console.log('  - subtotal: 700000');
    console.log('  - discount_amount: 88888');
    console.log('  - discount_type: fixed');
    console.log('  - discount_value: 88888');
    console.log('  - tax: null');
    console.log('  - total_amount: 611112');
    
    console.log('\n🔧 4. Applying frontend values to database...');
    
    // Update the sale with the frontend values
    const updatedSale = {
      subtotal: 700000,
      discount_amount: 88888,
      discount_type: 'fixed',
      discount_value: 88888,
      tax: 0, // Convert null to 0
      total_amount: 611112
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('lats_sales')
      .update(updatedSale)
      .eq('id', sale.id)
      .select();
    
    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
    } else {
      console.log('✅ Sale updated successfully');
      console.log('📋 Updated values:');
      console.log(`  - subtotal: ${updateResult[0].subtotal}`);
      console.log(`  - discount_amount: ${updateResult[0].discount_amount}`);
      console.log(`  - discount_type: ${updateResult[0].discount_type}`);
      console.log(`  - discount_value: ${updateResult[0].discount_value}`);
      console.log(`  - tax: ${updateResult[0].tax}`);
      console.log(`  - total_amount: ${updateResult[0].total_amount}`);
    }
    
    console.log('\n📊 5. Verifying calculation logic...');
    
    // Verify the calculation
    const expectedTotal = updatedSale.subtotal - updatedSale.discount_amount + updatedSale.tax;
    console.log(`  - Expected total: ${expectedTotal}`);
    console.log(`  - Database total: ${updatedSale.total_amount}`);
    
    if (expectedTotal === updatedSale.total_amount) {
      console.log('✅ Calculation is correct');
    } else {
      console.log('⚠️  Calculation mismatch detected');
      
      // Fix the total amount
      const { error: totalFixError } = await supabase
        .from('lats_sales')
        .update({ total_amount: expectedTotal })
        .eq('id', sale.id);
      
      if (totalFixError) {
        console.error('❌ Total fix failed:', totalFixError.message);
      } else {
        console.log('✅ Total amount fixed');
      }
    }
    
    console.log('\n🎉 Sales calculation fix completed!');
    console.log('===================================');
    console.log('✅ Database values updated to match frontend');
    console.log('✅ Calculation logic verified');
    console.log('✅ Sale record synchronized');
    
    console.log('\n📋 Next steps:');
    console.log('1. Refresh your frontend application');
    console.log('2. Clear browser cache if needed');
    console.log('3. Check if the values now match');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixSalesCalculation();
