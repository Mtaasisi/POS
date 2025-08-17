import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const checkSalesData = async () => {
  try {
    console.log('📊 Checking existing sales data...');
    
    // Check sales table
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('*')
      .limit(10);
    
    if (salesError) {
      console.error('❌ Error fetching sales:', salesError);
      return;
    }
    
    console.log(`✅ Found ${sales.length} sales records`);
    
    if (sales.length > 0) {
      console.log('📋 Sample sales:');
      sales.forEach((sale, index) => {
        console.log(`  ${index + 1}. ${sale.sale_number} - ${sale.total_amount} TZS - ${sale.payment_method} - ${sale.created_at}`);
      });
    }
    
    // Check sale items table
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select('*')
      .limit(10);
    
    if (itemsError) {
      console.error('❌ Error fetching sale items:', itemsError);
      return;
    }
    
    console.log(`✅ Found ${saleItems.length} sale item records`);
    
    if (saleItems.length > 0) {
      console.log('📋 Sample sale items:');
      saleItems.forEach((item, index) => {
        console.log(`  ${index + 1}. Sale ID: ${item.sale_id} - Product: ${item.product_name || 'Unknown'} - Qty: ${item.quantity} - Price: ${item.unit_price} TZS`);
      });
    }
    
    // Calculate total revenue
    if (sales.length > 0) {
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      console.log(`💰 Total Revenue: ${totalRevenue.toLocaleString()} TZS`);
      console.log(`📊 Average Sale: ${(totalRevenue / sales.length).toLocaleString()} TZS`);
    }
    
  } catch (error) {
    console.error('❌ Error checking sales data:', error);
  }
};

// Run the script
checkSalesData();
